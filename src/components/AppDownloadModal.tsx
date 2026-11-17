"use client";

import { useEffect, useState } from "react";

import Image from "next/image";

import { getLocalDateString } from "@/utils/date";
import {
  trackAppDownloadModalClicked,
  trackAppDownloadModalDismissed,
} from "@/utils/gtm";

const APP_STORE_URL =
  "https://apps.apple.com/kr/app/%EC%98%81%ED%99%94%EB%B0%A9%EB%9E%91%EC%9E%90-%EC%84%9C%EC%9A%B8%EC%8B%9C-%EC%98%88%EC%88%A0%EC%98%81%ED%99%94%EA%B4%80-%ED%86%B5%ED%95%A9-%ED%94%8C%EB%9E%AB%ED%8F%BC/id6810974287";

// 닫은 날짜(YYYY-MM-DD, 로컬 기준). 같은 날에는 다시 띄우지 않는다.
const DISMISSED_DATE_KEY = "appDownloadModalDismissedDate";

interface AppDownloadModalProps {
  /** 스플래시가 걷힌 뒤에만 띄우기 위한 신호 */
  ready: boolean;
}

/**
 * 웹 방문자에게 iOS 앱 출시를 알리는 모달.
 *
 * 앱(Capacitor WebView), Android 기기(설치할 앱이 없음), 오늘 이미 닫은 사용자에게는 띄우지 않는다.
 * 네이티브 여부는 layout.tsx 인라인 스크립트가 첫 페인트 전에 찍는 html[data-native]로 판단한다
 * (useIsNativeApp은 비동기라 모달이 먼저 떠버릴 수 있음).
 */
export default function AppDownloadModal({ ready }: AppDownloadModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (document.documentElement.dataset.native === "true") return;
    if (/android/i.test(navigator.userAgent)) return;
    try {
      if (localStorage.getItem(DISMISSED_DATE_KEY) === getLocalDateString(new Date())) return;
    } catch {
      // 스토리지 접근이 막힌 환경에서는 그냥 띄운다.
    }
    setOpen(true);
  }, [ready]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // 닫기(✕, 바깥 클릭, ESC, 닫기 버튼)와 '앱 받기' 모두 오늘 하루는 다시 띄우지 않는다.
  const close = (reason?: "download") => {
    setOpen(false);
    if (reason !== "download") trackAppDownloadModalDismissed();
    try {
      localStorage.setItem(DISMISSED_DATE_KEY, getLocalDateString(new Date()));
    } catch {
      // 저장 실패 시 이번 방문에서만 닫힌다.
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-download-modal-title"
    >
      <div className="absolute inset-0 bg-black/70" onClick={() => close()} />

      <div className="relative w-full max-w-xs border border-gray-800 bg-gray-950 px-6 pt-8 pb-5 text-center shadow-2xl">
        <button
          onClick={() => close()}
          aria-label="닫기"
          className="absolute top-3 right-3 p-1 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <Image
          src="/images/app-icon.png"
          alt=""
          width={72}
          height={72}
          className="mx-auto rounded-2xl"
        />
        <h2 id="app-download-modal-title" className="mt-4 text-base font-bold text-white">
          영화방랑자 iOS 앱이 출시됐어요
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-gray-400">
          상영 알림을 받고
          <br />
          시간표를 더 빠르게 확인하세요
        </p>

        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            trackAppDownloadModalClicked();
            close("download");
          }}
          className="mt-5 block w-full bg-orange-500 py-2.5 text-sm font-bold text-black hover:bg-orange-400 transition-colors"
        >
          App Store에서 받기
        </a>
        <button
          onClick={() => close()}
          className="mt-2 w-full py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
