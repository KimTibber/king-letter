"use client";

import { useEffect, useState } from "react";
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getLayoutByName } from '@/lib/letterLayouts';
import { formatDateKoreanLocaleStringSimplize } from '@/lib/dateUtils';

type Letter = {
  id: string;
  sentAt: string;
  subject: string | null;
  openAt: string;
  body: string;
  template: string;
  sender: string | null;
  senderId: string;
  readAt: string | null;
};

export default function LetterDetail({ letterId }: { letterId: string }) {
  const [isOpening, setIsOpening] = useState(true);
  const [letter, setLetter] = useState<Letter | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!letterId || letterId === "undefined") return;
      setIsOpening(true);
      setError(null);
      try {
        const res = await fetch(`/api/emails/${letterId}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "불러오기 실패");
        if (active) setLetter(json.email as Letter);
      } catch (e: any) {
        setError(e);
      } finally {
        if (active) setIsOpening(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [letterId]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-300 to-purple-200 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl">{( [error].map((error) => {
            const errorMessage = error.message;
            switch (errorMessage) {
              case "Invalid id":
              case "Not Found":
              case "Forbidden":
                return "편지를 찾을 수 없습니다.";

              default:
                return error.message;
            }
          }).join("") )}</p>
          <Link href="/inbox" className="mt-4 inline-block px-4 py-2 bg-purple-500 text-white border-2 border-black">
            돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (isOpening) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-300 to-purple-200">
        <div 
          className="fixed inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='20' height='20' fill='%23000'/%3E%3C/svg%3E")`,
            backgroundSize: '4px 4px',
            imageRendering: 'pixelated'
          }}
        />
        
        <Header />
        
        <main className="max-w-[500px] mx-auto px-4 pt-20 pb-20">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="relative animate-bounce">
              <div className="w-32 h-32 bg-gradient-to-br from-red-400 to-pink-500 border-4 border-black pixel-shadow">
                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-br from-red-500 to-pink-600 border-b-4 border-black"
                  style={{
                    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
                  }}
                />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-12 h-12 bg-yellow-300 border-2 border-black rounded-full flex items-center justify-center">
                    <i className="ri-heart-fill text-red-500 text-xl"></i>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-6 text-xl text-black">편지를 여는 중...</p>
          </div>
        </main>

        <Footer />

      </div>
    );
  };

  if (!letter) return (null);

  const layoutStyle = getLayoutByName(letter.template);
  const locked = letter ? new Date(letter.openAt).getTime() > Date.now() : false;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-300 to-purple-200">
      <div 
        className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='20' height='20' fill='%23000'/%3E%3C/svg%3E")`,
          backgroundSize: '4px 4px',
          imageRendering: 'pixelated'
        }}
      />
      
      <Header />
      
      <main className="max-w-[500px] mx-auto px-4 pt-20 pb-20">
          <div className="mt-4">
            {locked ? (
              <div className="relative">
                <div className="relative bg-gradient-to-br from-red-400 to-pink-500 border-4 border-black p-8 pixel-shadow">
                  <div 
                    className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-red-500 to-pink-600 border-b-4 border-black"
                    style={{
                      clipPath: 'polygon(0% 0%, 100% 0%, 100% 60%, 50% 100%, 0% 60%)'
                    }}
                  />

                  <div className={`absolute top-16 left-1/2 transform -translate-x-1/2 w-16 h-16 z-20 ${layoutStyle.decoration} border-2 border-black transform rounded-full`}>
                    <div className="w-full h-full text-[25px] flex items-center justify-center">
                      <i className={layoutStyle.contentIcon}></i>
                    </div>
                  </div>

                  <div className={`relative mt-16 ${layoutStyle.container} p-6 pixel-shadow overflow-hidden transform rotate-1`}>
                    {layoutStyle.id !== 4 && (
                      <div 
                        className="absolute inset-0 opacity-5"
                        style={{
                          backgroundImage: `repeating-linear-gradient(0deg, #8b4513 0px, #8b4513 1px, transparent 1px, transparent 29px)`
                        }}
                      />
                    )}

                    <div 
                      className="absolute top-4 right-4 w-24 h-24 opacity-15 pointer-events-none overflow-hidden"
                    >
                      <Image src={`/layout_${layoutStyle.id}.jpg`} alt={layoutStyle.name} className="w-full h-full object-cover" width={64} height={64} />
                    </div>
                    <div 
                      className="absolute bottom-4 left-4 w-24 h-24 opacity-15 pointer-events-none transform rotate-180 overflow-hidden"
                    >
                      <Image src={`/layout_${layoutStyle.id}.jpg`} alt={layoutStyle.name} className="w-full h-full object-cover" width={64} height={64} />
                    </div>

                    <div className="relative">
                      <div className={`flex items-center justify-between mb-4 border-b-2 border-dashed ${layoutStyle.header}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 ${layoutStyle.id === 4 ? 'bg-green-500' : 'bg-red-500'} border-2 border-black flex items-center justify-center`}>
                            <i className={`ri-mail-open-fill ${layoutStyle.id === 4 ? 'text-black' : 'text-white'} text-sm`}></i>
                          </div>
                          <div className={`flex gap-2 text-sm ${layoutStyle.id === 4 ? 'text-green-500' : 'text-gray-500'}`}>
                            <span>수신: {formatDateKoreanLocaleStringSimplize(letter.sentAt)}</span>
                            <span>|</span>
                            <span>개봉: {formatDateKoreanLocaleStringSimplize(letter.openAt)}</span>
                          </div>
                        </div>
                      </div>

                      <h1 className={`text-lg font-bold mb-6 text-center ${layoutStyle.font} ${layoutStyle.title} pb-3 border-b-2 ${layoutStyle.id === 4 ? 'border-green-500' : layoutStyle.header.includes('pink') ? 'border-pink-300' : layoutStyle.header.includes('amber') ? 'border-amber-300' : layoutStyle.header.includes('orange') ? 'border-orange-300' : 'border-purple-300'}`}>
                        {letter.subject}
                      </h1>

                      <div className="min-h-[120px] mb-6 relative">
                        <p className={`leading-relaxed ${layoutStyle.font} ${layoutStyle.content} whitespace-pre-wrap break-words`}>
                          {letter.body}...
                        </p>

                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/95 flex items-end justify-center pb-4">
                          <div className="text-center">
                            <span className="text-2xl mb-2">😜</span>
                            <p className="text-xs text-gray-600 font-bold">봉인이 풀리면 모든 내용을 읽을 수 있을거에요</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <div className="text-right">
                          <p className={`text-xs ${layoutStyle.id === 4 ? 'text-green-500' : 'text-gray-600'} mb-1`}>보낸이</p>
                          <p className={`text-sm font-bold ${layoutStyle.font} ${layoutStyle.content}`}>{letter.sender}</p>
                        </div>
                      </div>

                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-red-100 border-4 border-red-500 pixel-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-500 border-2 border-black flex items-center justify-center flex-shrink-0">
                        <i className="ri-lock-fill text-white text-xl"></i>
                      </div>
                      <div>
                        <p className="text-md font-bold text-red-700 mb-1">🔒 봉인된 편지</p>
                        <p className="text-sm text-red-600">
                          이 편지는 {formatDateKoreanLocaleStringSimplize(letter.openAt)}에 봉인이 해제됩니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`relative ${layoutStyle.container} p-6 pixel-shadow overflow-hidden`}>
                {layoutStyle.id !== 4 && (
                  <div 
                    className="absolute inset-0 opacity-5"
                    style={{
                      backgroundImage: `repeating-linear-gradient(0deg, #8b4513 0px, #8b4513 1px, transparent 1px, transparent 29px)`
                    }}
                  />
                )}

                <div 
                  className="absolute top-4 right-4 w-24 h-24 opacity-15 pointer-events-none overflow-hidden"
                >
                  <Image src={`/layout_${layoutStyle.id}.jpg`} alt={layoutStyle.name} className="w-full h-full object-cover" width={64} height={64} />
                </div>
                <div 
                  className="absolute bottom-4 left-4 w-24 h-24 opacity-15 pointer-events-none transform rotate-180 overflow-hidden"
                >
                  <Image src={`/layout_${layoutStyle.id}.jpg`} alt={layoutStyle.name} className="w-full h-full object-cover" width={64} height={64} />
                </div>
                
                <div className="relative">
                  <div className={`flex items-center justify-between mb-4 border-b-2 border-dashed ${layoutStyle.header}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 ${layoutStyle.id === 4 ? 'bg-green-500' : 'bg-red-500'} border-2 border-black flex items-center justify-center`}>
                        <i className={`ri-mail-open-fill ${layoutStyle.id === 4 ? 'text-black' : 'text-white'} text-sm`}></i>
                      </div>
                      <div className={`flex gap-2 ${layoutStyle.id === 4 ? 'text-green-500' : 'text-gray-500'}`}>
                        <span>수신: {formatDateKoreanLocaleStringSimplize(letter.sentAt)}</span>
                        <span>|</span>
                        <span>개봉: {formatDateKoreanLocaleStringSimplize(letter.openAt)}</span>
                      </div>
                    </div>
                  </div>

                  <h1 className={`text-lg font-bold mb-6 text-center ${layoutStyle.font} ${layoutStyle.title} pb-3 border-b-2 ${layoutStyle.id === 4 ? 'border-green-500' : layoutStyle.header.includes('pink') ? 'border-pink-300' : layoutStyle.header.includes('amber') ? 'border-amber-300' : layoutStyle.header.includes('orange') ? 'border-orange-300' : 'border-purple-300'}`}>
                    {letter.subject}
                  </h1>

                  <div className="min-h-[200px] mb-6 relative">
                    <p className={`leading-relaxed ${layoutStyle.font} ${layoutStyle.content} whitespace-pre-wrap break-words`}>
                      {letter.body}
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <div className="text-right">
                      <p className={`text-xs ${layoutStyle.id === 4 ? 'text-green-500' : 'text-gray-600'} mb-1`}>보낸이</p>
                      <p className={`text-sm font-bold ${layoutStyle.font} ${layoutStyle.content}`}>{letter.sender}</p>
                    </div>
                  </div>

                  <div className={`absolute -top-2 -right-2 w-12 h-12 ${layoutStyle.decoration} border-2 border-black transform rotate-12 rounded-full`}>
                    <div className="w-full h-full flex items-center justify-center">
                      <i className={layoutStyle.contentIcon}></i>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4">
              <Link 
                href="/inbox"
                className="w-full block px-4 py-3 bg-white border-2 border-black text-center font-bold hover:bg-gray-100 transition-colors pixel-shadow"
              >
                <i className="ri-arrow-left-line mr-1"></i>
                목록으로
              </Link>
            </div>
          </div>
      </main>

      <Footer />

    </div>
  );
}
