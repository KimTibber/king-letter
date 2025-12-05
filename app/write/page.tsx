'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RecipientSelector from '@/components/RecipientSelector';
import { letterLayouts, getLayoutByName } from '@/lib/letterLayouts';

// 봉인 해제일 설정 범위
const MIN_UNSEAL_DAYS = 1;
const MAX_UNSEAL_DAYS = 365;

// SweetAlert 픽셀 스타일 믹스인
const PixelAlert = Swal.mixin({
  customClass: {
    popup: 'pixel-alert-popup',
    confirmButton: 'pixel-alert-button pixel-alert-confirm',
    cancelButton: 'pixel-alert-button pixel-alert-cancel',
  },
  buttonsStyling: false,
  confirmButtonText: '확인',
  cancelButtonText: '취소',
});

// SweetAlert HTML 템플릿 생성
const createAlertHtml = (message: string) => `
  <div style="text-align: center;">
    <div class="text-xl" style="line-height: 1.6;">
      ${message.replace(/\n/g, '<br/>')}
    </div>
  </div>
`;

export default function WritePage() {
  const router = useRouter();

  const [recipient, setRecipient] = useState<{ id: string; name: string; email: string } | null>(null);
  const [showRecipientSelector, setShowRecipientSelector] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [daysUntilUnseal, setDaysUntilUnseal] = useState('7');
  const [selectedLayout, setSelectedLayout] = useState("lovely");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentLayout = getLayoutByName(selectedLayout);
  
  // 봉인 해제일 유효성 검사
  const isDaysValid = (): boolean => {
    const daysNum = parseInt(daysUntilUnseal, 10);
    return !isNaN(daysNum) && daysNum >= MIN_UNSEAL_DAYS && daysNum <= MAX_UNSEAL_DAYS;
  };

  // 봉인 해제일 계산 함수
  const calculateUnsealDate = (days: string): Date => {
    const daysNum = parseInt(days, 10);
    if (isNaN(daysNum) || daysNum < MIN_UNSEAL_DAYS || daysNum > MAX_UNSEAL_DAYS) return new Date();
    
    const today = new Date();
    const unsealDate = new Date(today);
    unsealDate.setDate(today.getDate() + daysNum);

    return unsealDate;
  };

  const prettierUnsealDate = (days: string): string => {
    const unsealDate = calculateUnsealDate(days);

    const year = unsealDate.getFullYear();
    const month = unsealDate.getMonth() + 1;
    const day = unsealDate.getDate();

    return `${year}년 ${month}월 ${day}일`;
  };

  const handleRecipientSelect = (recipientData: { id: string; name: string; email: string }) => {
    setRecipient(recipientData);
    setShowRecipientSelector(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 받는 사람 선택 여부 검사
    if (!recipient) {
      await PixelAlert.fire({
        html: createAlertHtml('받는 사람을 선택해주세요.'),
      });
      return;
    }

    // 제목 검사
    if (!title) {
      await PixelAlert.fire({
        html: createAlertHtml('제목을 입력해주세요.'),
      });
      return;
    }

    // 앞뒤 공백 제거 후 글자 수 검증
    const trimmedContent = content.trim();
    if (trimmedContent.length < 30) {
      await PixelAlert.fire({
        html: createAlertHtml('편지 내용은 앞 뒤 공백없이 최소 30자 이상 입력해주세요.'),
      });
      return;
    }

    // 봉인 해제일 유효성 검사
    if (!isDaysValid()) {
      await PixelAlert.fire({
        html: createAlertHtml(`봉인 해제일을\n올바르게 입력해주세요.\n(${MIN_UNSEAL_DAYS}일 ~ ${MAX_UNSEAL_DAYS}일)`),
      });
      return;
    }

    // 전송 시작
    let response;
    const result = await PixelAlert.fire({
      html: createAlertHtml('편지를 전송하시겠습니까?'),
      showCancelButton: !Swal.isLoading(),
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      allowEscapeKey: () => !Swal.isLoading(),
      preConfirm: async () => {
        try {
          const res = await fetch("/api/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              "recipientUserId": recipient.id,
              "recipient": recipient.email || undefined,
              "subject": title || undefined,
              "openAt": calculateUnsealDate(daysUntilUnseal).toISOString(),
              "template": selectedLayout,
              "body": trimmedContent,
            }),
          });
          response = await res.json();
          if (!res.ok) throw new Error(response.error || "문제가 발생했습니다.");

        } catch (error) {
          await PixelAlert.fire({
            html: createAlertHtml('문제가 발생했습니다.'),
          });
          throw error;
        }
      }
    });

    if (result.isConfirmed) {
      const successResult = await PixelAlert.fire({
        html: createAlertHtml('편지가 전송되었습니다!'),
      });

      // inbox page로 이동
      if (successResult) router.push('/inbox');
    }
  };

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
          <div className="bg-white border-4 border-black p-4 pixel-shadow mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-500 border-2 border-black flex items-center justify-center flex-shrink-0">
                <i className="ri-quill-pen-line text-white text-xl"></i>
              </div>
              <h1 className="text-xl font-bold">편지 쓰기</h1>
            </div>
            <p className="text-[14px] text-gray-600">
              소중한 사람에게 마음을 담은 편지를 보내보세요
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white border-4 border-black p-4 pixel-shadow">
              <label className="block text-lg font-bold mb-2">
                <i className="ri-user-fill mr-1"></i>받는 사람
              </label>
              <button
                type="button"
                onClick={() => setShowRecipientSelector(true)}
                className="w-full px-3 py-2 border-2 border-gray-300 text-left focus:outline-none focus:border-purple-500 hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <span className={recipient ? 'text-gray-900' : 'text-gray-400'}>
                  {(recipient ? `${recipient?.name} (${recipient?.email})` : '받는 사람을 선택하세요')}
                </span>
                <i className="ri-arrow-down-s-line text-gray-400"></i>
              </button>
            </div>

            <div className="bg-white border-4 border-black p-4 pixel-shadow">
              <label className="block text-lg font-bold mb-2">
                <i className="ri-text mr-1"></i>제목
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="편지 제목을 입력하세요"
                className="w-full px-3 py-2 border-2 border-gray-300 focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div className="bg-white border-4 border-black p-4 pixel-shadow">
              <label className="block text-lg font-bold mb-2">
                <i className="ri-palette-fill mr-1"></i>편지지
              </label>
              <div className="grid grid-cols-5 gap-2">
                {letterLayouts.map((layout) => (
                  <button
                    key={layout.id}
                    type="button"
                    onClick={() => {
                      setSelectedLayout(layout.name);
                      setTimeout(() => textareaRef.current?.focus(), 0);
                    }}
                    className={`relative aspect-square bg-gradient-to-br ${layout.gradient} border-2 ${
                      selectedLayout === layout.name ? 'border-black' : 'border-gray-400'
                    } flex items-center justify-center hover:scale-105 transition-transform overflow-hidden`}
                  >
                    <Image src={`/layout_${layout.id}.jpg`} alt={layout.alias} className="absolute inset-0 w-full h-full object-cover opacity-30" width={64} height={64} draggable={false} />
                    <i className={`${layout.icon} ${layout.iconColor} text-xl relative z-10`}></i>
                    {selectedLayout === layout.name && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-black border border-white flex items-center justify-center">
                        <i className="ri-check-line text-white text-[10px]"></i>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className={`relative ${currentLayout.previewBg} mt-2 p-4 border-2 ${currentLayout.previewLine} overflow-hidden`}>
                {currentLayout.id !== 4 && (
                  <div 
                    className="absolute inset-0 opacity-5"
                    style={{
                      backgroundImage: `repeating-linear-gradient(0deg, #8b4513 0px, #8b4513 1px, transparent 1px, transparent 24px)`
                    }}
                  />
                )}

                <div className="absolute top-2 right-2 w-16 h-16 opacity-10 pointer-events-none overflow-hidden">
                  <Image src={`/layout_${currentLayout.id}.jpg`} alt={currentLayout.name} className="w-full h-full object-cover" width={64} height={64} />
                </div>
                <div className="absolute bottom-2 left-2 w-16 h-16 opacity-10 pointer-events-none transform rotate-180 overflow-hidden">
                  <Image src={`/layout_${currentLayout.id}.jpg`} alt={currentLayout.name} className="w-full h-full object-cover" width={64} height={64} />
                </div>

                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="내용을 입력하세요..."
                  className={`relative z-10 w-full h-48 bg-transparent ${currentLayout.font} ${currentLayout.content} resize-none focus:outline-none placeholder-gray-400 border-none`}
                  required
                />
              </div>
              <div className="mt-2 flex items-center justify-end text-sm">
                <p className={`font-bold ${content.trim().length >= 30 ? 'text-green-600' : 'text-red-500'}`}>
                  {content.trim().length}
                </p>
              </div>
            </div>

            <div className="bg-white border-4 border-black p-4 pixel-shadow">
              <label className="block text-lg font-bold mb-2">
                <i className="ri-lock-fill mr-1"></i>봉인 해제일
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={daysUntilUnseal}
                  onChange={(e) => setDaysUntilUnseal(e.target.value)}
                  min={MIN_UNSEAL_DAYS}
                  max={MAX_UNSEAL_DAYS}
                  className={`w-20 px-3 py-2 border-2 text-center focus:outline-none transition-colors ${
                    daysUntilUnseal && !isDaysValid()
                      ? 'border-red-500 bg-red-50 focus:border-red-600'
                      : 'border-gray-300 focus:border-purple-500'
                  }`}
                  required
                />
                <span className="text-gray-700">일 이후</span>
              </div>
              
              {daysUntilUnseal && !isDaysValid() && (
                <div className="mt-3 p-3 bg-red-50 border-2 border-red-300">
                  <p className="text-sm text-red-700">
                    <i className="ri-error-warning-fill mr-1"></i>
                    숫자 범위가 유효하지 않습니다! (최소 {MIN_UNSEAL_DAYS}, 최대 {MAX_UNSEAL_DAYS})
                  </p>
                </div>
              )}

              {prettierUnsealDate(daysUntilUnseal) && isDaysValid() && (
                <div className="mt-3 p-3 bg-purple-50 border-2 border-purple-200">
                  <p className="text-sm text-purple-700">
                    <i className="ri-calendar-fill mr-1"></i>
                    <span className="font-bold">{prettierUnsealDate(daysUntilUnseal)}</span>에 봉인이 해제됩니다.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Link
                href="/inbox"
                className="flex-1 px-4 py-3 bg-gray-200 border-2 border-black text-center font-bold hover:bg-gray-300 transition-colors pixel-shadow"
              >
                <i className="ri-close-line mr-1"></i>
                취소
              </Link>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-purple-500 text-white border-2 border-black font-bold hover:bg-purple-600 transition-colors pixel-shadow"
              >
                <i className="ri-send-plane-fill mr-1"></i>
                전송하기
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />

      {showRecipientSelector && (
        <RecipientSelector
          onSelect={handleRecipientSelect}
          onClose={() => setShowRecipientSelector(false)}
        />
      )}
    </div>
  );
}
