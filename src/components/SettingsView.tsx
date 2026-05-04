"use client";

import { useState, useEffect } from "react";

const SEOUL_THEATERS = [
  { name: "서울아트시네마", area: "종로구" },
  { name: "아트나인", area: "종로구" },
  { name: "인디스페이스", area: "서대문구" },
  { name: "시네마테크KOFA", area: "마포구" },
  { name: "미디어극장 아이공", area: "종로구" },
  { name: "스폰지하우스", area: "종로구" },
  { name: "씨네큐브", area: "광화문" },
  { name: "CGV 아트하우스 압구정", area: "강남구" },
  { name: "에무시네마", area: "용산구" },
  { name: "광화문씨네큐브", area: "종로구" },
];

export default function SettingsView() {
  const [isDark, setIsDark] = useState(false);
  const [favoriteTheaters, setFavoriteTheaters] = useState<string[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(saved !== null ? saved === "true" : systemDark);

    const savedTheaters = localStorage.getItem("favoriteTheaters");
    if (savedTheaters) setFavoriteTheaters(JSON.parse(savedTheaters));
  }, []);

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("darkMode", String(next));
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const toggleTheater = (name: string) => {
    setFavoriteTheaters((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  };

  const saveTheaters = () => {
    localStorage.setItem("favoriteTheaters", JSON.stringify(favoriteTheaters));
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  const toggle = (section: string) =>
    setExpandedSection(expandedSection === section ? null : section);

  return (
    <div className="space-y-6 text-gray-100">
      <div className="mb-6">
        <h2 className="text-base font-bold text-white">설정</h2>
        <p className="text-xs text-gray-500 mt-0.5">앱 환경설정과 서비스 정보</p>
      </div>

      {/* ─── 화면 ─── */}
      <section>
        <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-2">화면</p>
        <div className="bg-gray-900 border border-gray-800 divide-y divide-gray-800">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <span className="text-sm text-gray-200">다크 모드</span>
            </div>
            <button
              onClick={toggleDark}
              className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
                isDark ? "bg-orange-500" : "bg-gray-700"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                  isDark ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* ─── 즐겨찾는 영화관 ─── */}
      <section>
        <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-2">즐겨찾는 영화관</p>
        <div className="bg-gray-900 border border-gray-800 p-4">
          <p className="text-xs text-gray-500 mb-3">
            자주 가는 영화관을 선택하면 거리 정렬 시 우선 표시됩니다.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SEOUL_THEATERS.map((theater) => {
              const selected = favoriteTheaters.includes(theater.name);
              return (
                <button
                  key={theater.name}
                  onClick={() => toggleTheater(theater.name)}
                  className={`flex items-center gap-2 px-3 py-2 border text-left transition-all ${
                    selected
                      ? "border-orange-500 bg-orange-500/10 text-orange-400"
                      : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 border flex-shrink-0 flex items-center justify-center ${
                      selected ? "border-orange-500 bg-orange-500" : "border-gray-600"
                    }`}
                  >
                    {selected && (
                      <svg className="w-2.5 h-2.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <div>
                    <p className="text-xs font-medium leading-tight">{theater.name}</p>
                    <p className="text-[10px] text-gray-500">{theater.area}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <button
            onClick={saveTheaters}
            className="mt-3 w-full py-2 bg-orange-500 text-black text-xs font-bold transition-all hover:bg-orange-400 active:scale-[0.98]"
          >
            {savedMsg ? "저장되었습니다 ✓" : "저장"}
          </button>
        </div>
      </section>

      {/* ─── 위치 정보 ─── */}
      <section>
        <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-2">위치 및 개인정보</p>
        <div className="bg-gray-900 border border-gray-800 overflow-hidden">
          <button
            onClick={() => toggle("location")}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800 transition-colors"
          >
            <span className="flex items-center gap-2.5 text-sm text-gray-200">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              위치 정보 이용 약관
            </span>
            <svg
              className={`w-4 h-4 text-gray-600 transition-transform ${expandedSection === "location" ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === "location" && (
            <div className="px-4 py-3 border-t border-gray-800 text-xs text-gray-400 space-y-2">
              <p className="font-semibold text-gray-300">📍 위치 정보 수집 및 이용</p>
              <ul className="space-y-1.5 list-disc list-inside">
                <li>위치 정보는 <span className="text-orange-400">거리순 정렬</span> 기능에만 사용됩니다.</li>
                <li>수집된 위치 정보는 서버로 전송되지 않으며, 기기 내에서만 처리됩니다.</li>
                <li>위치 권한을 허용하지 않아도 시간순 정렬로 앱을 정상적으로 이용할 수 있습니다.</li>
                <li>위치 정보는 브라우저 세션 중에만 임시 보관되며 저장되지 않습니다.</li>
              </ul>
              <p className="text-gray-500 mt-2">거리순 정렬 버튼을 누를 때에만 위치 정보 접근이 요청됩니다.</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── 서비스 정보 ─── */}
      <section>
        <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-2">서비스 정보</p>
        <div className="bg-gray-900 border border-gray-800 overflow-hidden divide-y divide-gray-800">
          {/* 업데이트 노트 */}
          <button
            onClick={() => toggle("updates")}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800 transition-colors"
          >
            <span className="flex items-center gap-2.5 text-sm text-gray-200">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              업데이트 노트
            </span>
            <svg
              className={`w-4 h-4 text-gray-600 transition-transform ${expandedSection === "updates" ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === "updates" && (
            <div className="px-4 py-3 text-xs text-gray-400 space-y-3">
              <div>
                <p className="font-semibold text-gray-300">v1.5.0 (2026-05-04)</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>UI 전면 개편 — 블랙/오렌지 테마</li>
                  <li>현재 상영 영화 히어로 배너 추가</li>
                  <li>설정 페이지 신설 (다크모드, 즐겨찾는 영화관, 위치 약관)</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-300">v1.4.0 (2025-01-08)</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>필터 다중 선택 기능 추가</li>
                  <li>찜 목록 전체 삭제 기능 추가</li>
                  <li>모바일 UI 최적화</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-300">v1.3.0 (2025-01-08)</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>PWA 지원 — 앱으로 설치 가능</li>
                  <li>하단 네비게이션 바 추가</li>
                </ul>
              </div>
            </div>
          )}

          {/* 문의 및 제안 */}
          <button
            onClick={() => toggle("contact")}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800 transition-colors"
          >
            <span className="flex items-center gap-2.5 text-sm text-gray-200">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              문의 및 제안
            </span>
            <svg
              className={`w-4 h-4 text-gray-600 transition-transform ${expandedSection === "contact" ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === "contact" && (
            <div className="px-4 py-3 text-xs text-gray-400 space-y-1.5">
              <p>버그 리포트, 기능 제안은 아래로 연락주세요.</p>
              <p className="flex items-center gap-2 text-gray-300">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                github.com/Inside-eun
              </p>
              <p className="flex items-center gap-2 text-gray-300">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                dameun0808@gmail.com
              </p>
            </div>
          )}

          {/* 이용 안내 */}
          <button
            onClick={() => toggle("notice")}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800 transition-colors"
          >
            <span className="flex items-center gap-2.5 text-sm text-gray-200">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              이용 안내
            </span>
            <svg
              className={`w-4 h-4 text-gray-600 transition-transform ${expandedSection === "notice" ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === "notice" && (
            <div className="px-4 py-3 text-xs text-gray-400 space-y-2">
              <p className="font-semibold text-gray-300">📌 제작 방식</p>
              <p>KOBIS(영화진흥위원회) 조회 방식을 사용하므로 실제 상영내역과 일치하지 않을 수 있습니다.</p>
              <p className="font-semibold text-gray-300 mt-2">🎬 영화방랑자란?</p>
              <p>박스오피스 5위 이하의 작품을 주로 상영하는 서울시 예술영화관 및 예술전용관 정보를 제공합니다.</p>
              <p className="font-semibold text-gray-300 mt-2">💾 찜 목록 안내</p>
              <p>찜 목록은 브라우저 로컬 스토리지에 저장되며, 같은 브라우저에서만 유지됩니다.</p>
            </div>
          )}
        </div>
      </section>

      {/* 푸터 */}
      <div className="text-center pt-4 pb-2">
        <p className="text-xs text-gray-600">만든 사람: 제육볶음 달달볶아</p>
        <p className="text-[10px] text-gray-700 mt-1">© 2025 영화방랑자. All rights reserved.</p>
      </div>
    </div>
  );
}
