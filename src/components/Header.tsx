"use client";

interface HeaderNavProps {
  isHomeView: boolean;
  showWishlistView: boolean;
  showEventsView: boolean;
  showInfoView: boolean;
  wishlistCount: number;
  onGoHome: () => void;
  onGoWishlist: () => void;
  onGoEvents: () => void;
  onGoInfo: () => void;
}

export default function Header({
  isHomeView,
  showWishlistView,
  showEventsView,
  showInfoView,
  wishlistCount,
  onGoHome,
  onGoWishlist,
  onGoEvents,
  onGoInfo,
}: HeaderNavProps) {
  return (
    <header className="sticky top-0 z-50 bg-black border-b border-gray-800 shadow-sm">
      <div className="container mx-auto px-4 py-2 max-w-4xl">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-orange-500 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
            />
          </svg>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-white tracking-wide leading-tight">
              영화방랑자
            </h1>
            <p className="text-[10px] text-gray-500 leading-tight">
              서울 예술영화관 상영시간표
            </p>
          </div>

          {/* 웹(데스크톱) 전용 상단 메뉴 */}
          <nav className="hidden lg:flex items-center gap-6 flex-shrink-0">
            <button
              onClick={onGoHome}
              className={`text-sm font-semibold transition-colors ${
                isHomeView ? "text-orange-500" : "text-gray-300 hover:text-white"
              }`}
            >
              홈
            </button>
            <button
              onClick={onGoWishlist}
              className={`relative text-sm font-semibold transition-colors ${
                showWishlistView ? "text-orange-500" : "text-gray-300 hover:text-white"
              }`}
            >
              찜
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-orange-500 text-black text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {wishlistCount}
                </span>
              )}
            </button>
            <button
              onClick={onGoEvents}
              className={`text-sm font-semibold transition-colors ${
                showEventsView ? "text-orange-500" : "text-gray-300 hover:text-white"
              }`}
            >
              기획전
            </button>
            <button
              onClick={onGoInfo}
              className={`text-sm font-semibold transition-colors ${
                showInfoView ? "text-orange-500" : "text-gray-300 hover:text-white"
              }`}
            >
              설정
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
