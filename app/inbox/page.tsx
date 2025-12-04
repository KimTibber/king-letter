"use client";

import { useEffect, useState } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { formatKoreanDate, formatDateKoreanLocaleString, formatDateKoreanLocaleStringSimplize } from '@/lib/dateUtils';

interface Letter {
  id: number;
  receivedDate: string;
  unsealed: string;
  title: string;
  sender: string;
  isUnlocked: boolean;
}
type EmailItem = {
  id: string;
  sentAt: string;
  subject: string | null;
  openAt: string;
  body: string;
  template: string;
  recipient: string | null;
  senderId: string;
};

export default function InboxPage() {
  const [emails, setEmails] = useState<EmailItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setError(null);
      try {
        const res = await fetch("/api/emails", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "불러오기 실패");
        if (active) setEmails(json.emails as EmailItem[]);
      } catch (e: any) {
        if (active) setError(e.message);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-300 to-purple-200">
      <div
        className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='20' height='20' fill='%23000'/%3E%3C/svg%3E")`,
          backgroundSize: "4px 4px",
          imageRendering: "pixelated",
        }}
      />

      <Header />

      <main className="max-w-[500px] mx-auto px-4 pt-20 pb-20">
        <div className="mt-4">
          {error && (
            <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {!emails && !error && (
            <div className="bg-white border-4 border-black p-8 pixel-shadow">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-purple-500 border-4 border-black pixel-shadow animate-bounce">
                    <div className="absolute inset-2 bg-purple-400 border-2 border-black flex items-center justify-center">
                      <i className="ri-mail-fill text-white text-2xl"></i>
                    </div>
                  </div>
                </div>
                <p className="font-bold text-xl text-gray-700">
                  편지함을 불러오는 중...
                </p>
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 bg-purple-500 border border-black animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-purple-500 border border-black animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-purple-500 border border-black animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {emails && (
            <div className="bg-white border-4 border-black p-4 pixel-shadow mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500 border-2 border-black flex items-center justify-center flex-shrink-0">
                    <i className="ri-mail-fill text-white text-xl"></i>
                  </div>
                  <div>
                    <h1 className="font-PressStart2P text-base font-bold">
                      INBOX
                    </h1>
                    <p className="text-gray-600">
                      총 {emails?.length}통의 편지
                    </p>
                  </div>
                </div>
                <Link
                  href="/write"
                  className="px-3 py-2 bg-purple-500 text-white border-2 border-black text-xs font-bold hover:bg-purple-600 transition-colors pixel-shadow"
                >
                  <i className="ri-quill-pen-line mr-1"></i>
                  편지 쓰기
                </Link>
              </div>
            </div>
          )}

          {emails && emails.length === 0 && (
            <div className="bg-white border-4 border-black p-12 pixel-shadow">
              <div className="flex flex-col items-center justify-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gray-300 border-4 border-black pixel-shadow">
                    <div className="absolute inset-3 bg-gray-200 border-2 border-black flex items-center justify-center">
                      <i className="ri-mail-line text-gray-400 text-4xl"></i>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 border-2 border-black transform rotate-12 flex items-center justify-center">
                      <span className="text-xl">✨</span>
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <h3 className="font-bold text-xl text-gray-800">
                    아직 받은 편지가 없어요
                  </h3>
                  <p className="text-gray-600 text-sm">
                    먼저 편지를 보내보는건 어떨까요?
                  </p>
                </div>

                <Link
                  href="/write"
                  className="inline-block px-6 py-3 bg-purple-500 text-white border-2 border-black font-bold transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-purple-600 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <i className="ri-quill-pen-line mr-2"></i>
                  편지 쓰러 가기
                </Link>
              </div>
            </div>
          )}

          {emails && emails.length > 0 && (
            <div className="space-y-3">
              {emails.map((letter) => {
                const locked = new Date(letter.openAt).getTime() > Date.now();
                const openAt = formatDateKoreanLocaleStringSimplize(letter.openAt);

                return (
                  <Link
                    key={letter.id}
                    href={`/inbox/${letter.id}`}
                    className={`relative group block ${
                      locked ? "bg-gray-100" : "bg-white"
                    } border-4 border-black p-4 pixel-shadow hover:translate-x-1 hover:translate-y-1 transition-transform`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 ${
                          locked ? "bg-red-500" : "bg-green-500"
                        } border-2 border-black flex items-center justify-center flex-shrink-0`}
                      >
                        <i
                          className={`${
                            locked ? "ri-mail-open-line" : "ri-lock-fill"
                          } text-white text-xl`}
                        ></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3
                            className={`text-lg font-bold ${
                              locked ? "text-gray-500" : "text-black"
                            } truncate`}
                          >
                            {letter.subject || "(제목 없음)"}
                          </h3>
                          <span
                            className={`text-[14px] ${
                              locked ? "text-gray-400" : "text-gray-500"
                            } whitespace-nowrap`}
                          >
                            {formatDateKoreanLocaleString(letter.sentAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p
                            className={`text-[14px] ${
                              locked ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            <i className="ri-user-fill mr-1"></i>
                            {letter.recipient}
                          </p>
                          {locked && (
                            <span className="text-[12px] text-red-600 font-bold">
                              <i className="ri-time-fill mr-1"></i>
                              {openAt} 개봉
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {locked && (
                      <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                        <div className="bg-red-500 border-2 border-black px-3 py-2 pixel-shadow whitespace-nowrap">
                          <p className="text-[12px] text-white font-bold">
                            🔒 봉인된 편지는 {formatKoreanDate(openAt)} 전까지
                            일부 내용만 볼 수 있습니다.
                          </p>
                          <div className="absolute left-1/2 top-full -translate-x-1/2 -mt-[2px]">
                            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black"></div>
                            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-red-500 absolute left-1/2 -translate-x-1/2 -top-[7px]"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
