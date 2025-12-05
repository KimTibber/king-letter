'use client';

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t-4 border-black">
      <div className="max-w-[500px] mx-auto px-4 py-3">
        <div className="flex items-center text-center justify-center text-white text-xs">
          <p className="font-PressStart2P text-[8px]">© 2025 INFLUDEO.</p>
          {/* <div className="flex gap-3">
            <button className="hover:text-yellow-400 transition-colors">
              <i className="ri-question-line text-base"></i>
            </button>
            <button className="hover:text-yellow-400 transition-colors">
              <i className="ri-settings-3-line text-base"></i>
            </button>
          </div> */}
        </div>
      </div>
    </footer>
  );
}
