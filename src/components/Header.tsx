"use client";

import { useEffect, useState } from "react";

interface HeaderProps {
  onAccountClick?: () => void;
}

export default function Header({ onAccountClick }: HeaderProps) {
  const [initial, setInitial] = useState<string | null>(null);

  useEffect(() => {
    const linked = localStorage.getItem("linkedAccount");
    if (linked) {
      const account = JSON.parse(linked);
      setInitial(account.name?.slice(0, 1) ?? null);
    }
  }, []);

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
          {onAccountClick && (
            <button
              onClick={onAccountClick}
              aria-label="계정"
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center border border-gray-700 hover:border-orange-500 transition-colors"
            >
              {initial ? (
                <span className="w-full h-full rounded-full bg-orange-500 text-black text-xs font-bold flex items-center justify-center">
                  {initial}
                </span>
              ) : (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
