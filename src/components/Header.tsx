"use client";

import DarkModeToggle from "./DarkModeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              영화방랑자
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              서울 예술영화관 상영시간표
            </p>
          </div>
          <DarkModeToggle />
        </div>
      </div>
    </header>
  );
}

