import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { currentUser } from "@clerk/nextjs/server";

// GET: 자신의 이메일 리스트 조회
// 반환 필드:
// - id
// - sentAt(발송일), subject, openAt(봉인 해제일), body, template, recipient
export async function GET() {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const myEmail =
    user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;

  const { data, error } = await supabaseAdmin
    .from("emails")
    .select(
      "id, sender_id, sender_google_id, recipient_id, recipient_google_id, subject, body, created_at, open_at, template"
    )
    .or(
      myEmail
        ? `recipient_id.eq.${userId},recipient_google_id.eq.${myEmail}`
        : `recipient_id.eq.${userId}`
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = Date.now();
  const emails =
    (data ?? []).map((row: any) => {
      const openAtMs = new Date(row.open_at as string).getTime();
      const locked = Number.isFinite(openAtMs) && openAtMs > now;
      const body = locked ? String(row.body ?? "").slice(0, 10) : row.body;
      return {
        id: row.id,
        sentAt: row.created_at,
        subject: row.subject,
        openAt: row.open_at,
        body,
        template: row.template,
        sender: row.sender_google_id ?? row.sender_id,
        recipient: row.recipient_google_id ?? row.recipient_id,
        senderId: row.sender_id,
      };
    }) ?? [];

  return NextResponse.json({ emails });
}

// POST: 이메일 발송(저장)
const postSchema = z.object({
  recipientUserId: z.string().min(1), // Clerk userId(필수)
  recipient: z.string().email().optional(), // 선택: 이메일(클라이언트가 함께 전송 시 사용)
  subject: z.string().max(200).optional(),
  body: z.string().min(30).max(5000),
  openAt: z.coerce.date(),
  template: z.string().min(1).default("default"),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await currentUser();
  const myEmail =
  user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
    ?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;

  const json = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { recipient, recipientUserId, subject, body, openAt, template } =
    parsed.data;

  // recipient가 없으면 Clerk로부터 이메일 조회
  let recipientEmail = recipient;
  if (!recipientEmail) {
    const api = process.env.CLERK_API_URL || "https://api.clerk.com";
    const resp = await fetch(`${api}/v1/users/${recipientUserId}`, {
      headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
      cache: "no-store",
    });
    if (!resp.ok) {
      const txt = await resp.text();
      return NextResponse.json(
        { error: `Failed to resolve recipient email: ${txt}` },
        { status: 500 }
      );
    }
    const u = await resp.json();
    recipientEmail =
      u?.email_addresses?.find((e: any) => e.id === u?.primary_email_address_id)
        ?.email_address ??
      u?.email_addresses?.[0]?.email_address ??
      undefined;
    if (!recipientEmail) {
      return NextResponse.json(
        { error: "Recipient has no email address" },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabaseAdmin
    .from("emails")
    .insert({
      sender_id: userId,
      sender_google_id: myEmail,
      recipient_id: recipientUserId ?? null,
      recipient_google_id: recipientEmail,
      subject: subject ?? null,
      body,
      open_at: openAt.toISOString(),
      template,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data?.id }, { status: 201 });
}
