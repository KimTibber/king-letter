import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET /api/emails/[id]
// - 존재하지 않으면 404
// - 다른 사용자의 메일이면 403
// - 봉인 해제 이전 조회면 423
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!id || id === "undefined") {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const myEmail =
    user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;

  // 이메일 단건 조회
  const { data, error } = await supabaseAdmin
    .from("emails")
    .select(
      "id, sender_id, sender_google_id, recipient_id, recipient_google_id, subject, body, created_at, open_at, template, read_at"
    )
    .eq("id", id)
    .limit(1)
    .single();

  // PGRST116: Results contain 0 rows
  // 22P02: invalid input syntax for type uuid
  if (error && error.code === "22P02") {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const isOwner =
    data.recipient_id === userId ||
    (!!myEmail && data.recipient_google_id === myEmail);
  if (!isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 봉인 해제 이전이면 본문을 10글자만 노출
  const now = Date.now();
  const openAtMs = new Date(data.open_at as string).getTime();
  const locked = Number.isFinite(openAtMs) && openAtMs > now;
  const safeBody = locked
    ? String(data.body ?? "").slice(0, 10)
    : (data.body as string);
  
  // 읽은 시간 업데이트
  if (!data.read_at) {
    const { error } = await supabaseAdmin.from("emails").update({
      read_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const email = {
    id: data.id as string,
    sentAt: data.created_at as string,
    subject: (data.subject as string | null) ?? null,
    openAt: data.open_at as string,
    body: safeBody,
    template: data.template as string,
    recipient: (data.recipient_google_id as string | null) ?? data.recipient_id,
    sender: (data.sender_google_id as string | null) ?? data.sender_id,
    senderId: data.sender_id as string,
    readAt: (data.read_at as string | null) ?? null,
  };

  return NextResponse.json({ email });
}
