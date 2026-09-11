"use client";

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import MapView, { MapPin } from '@/components/MapView';
import { artCinemas } from '@/data/artCinemas';

const SEOUL_THEATERS = artCinemas.map((c) => ({ name: c.cdNm, area: c.area }));

type FavoriteViewMode = "list" | "map";

export default function SettingsView() {
  const [favoriteTheaters, setFavoriteTheaters] = useState<string[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [favoriteViewMode, setFavoriteViewMode] = useState<FavoriteViewMode>("list");

  useEffect(() => {
    const savedTheaters = localStorage.getItem("favoriteTheaters");
    if (savedTheaters) setFavoriteTheaters(JSON.parse(savedTheaters));
  }, []);

  const toggleTheater = (name: string) => {
    setFavoriteTheaters((prev) => {
      const next = prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name];
      localStorage.setItem("favoriteTheaters", JSON.stringify(next));
      return next;
    });
  };

  const mapPins: MapPin[] = useMemo(
    () =>
      artCinemas.map((c) => ({
        id: c.cdNm,
        lat: c.lat,
        lng: c.lng,
        label: c.cdNm,
        selected: favoriteTheaters.includes(c.cdNm),
      })),
    [favoriteTheaters]
  );

  const toggle = (section: string) =>
    setExpandedSection(expandedSection === section ? null : section);

  return (
    <div className="space-y-6 text-gray-100">
      <div className="mb-6">
        <h2 className="text-base font-bold text-white">설정</h2>
        <p className="text-xs text-gray-500 mt-0.5">앱 환경설정과 서비스 정보</p>
      </div>

      {/* ─── 즐겨찾는 영화관 ─── */}
      <section>
        <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-2">즐겨찾는 영화관</p>
        <div className="bg-gray-900 border border-gray-800 overflow-hidden">
          <button
            onClick={() => toggle("theaters")}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800 transition-colors"
          >
            <span className="flex items-center gap-2.5 text-sm text-gray-200">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              즐겨찾는 영화관
              {favoriteTheaters.length > 0 && (
                <span className="text-[10px] text-orange-400 font-bold">{favoriteTheaters.length}개 선택됨</span>
              )}
            </span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === "theaters" ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === "theaters" && (
            <div className="px-4 pb-4 pt-3 border-t border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500">
                  자주 가는 영화관을 선택하면 거리 정렬 시 우선 표시됩니다.
                </p>
                <div className="flex gap-1 flex-shrink-0 ml-2">
                  <button
                    onClick={() => setFavoriteViewMode("list")}
                    className={`px-2 py-1 text-[10px] font-medium transition-all ${
                      favoriteViewMode === "list" ? "bg-orange-500 text-black" : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    목록
                  </button>
                  <button
                    onClick={() => setFavoriteViewMode("map")}
                    className={`px-2 py-1 text-[10px] font-medium transition-all ${
                      favoriteViewMode === "map" ? "bg-orange-500 text-black" : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    지도
                  </button>
                </div>
              </div>

              {favoriteViewMode === "map" && (
                <div className="mb-3">
                  <MapView pins={mapPins} onPinClick={toggleTheater} height={280} />
                </div>
              )}

              {favoriteTheaters.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3 pb-3 border-b border-gray-800">
                  {favoriteTheaters.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-full border border-orange-500 bg-orange-500/10 text-orange-400 text-xs font-medium"
                    >
                      {name}
                      <button
                        onClick={() => toggleTheater(name)}
                        aria-label={`${name} 즐겨찾기 해제`}
                        className="w-4 h-4 flex items-center justify-center rounded-full text-orange-400 hover:bg-orange-500/20"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5">
                {SEOUL_THEATERS.filter((theater) => !favoriteTheaters.includes(theater.name)).map((theater) => (
                  <button
                    key={theater.name}
                    onClick={() => toggleTheater(theater.name)}
                    title={theater.area}
                    className="px-3 py-1.5 rounded-full border border-gray-700 bg-gray-800 text-gray-400 text-xs font-medium transition-colors hover:border-gray-600 hover:text-gray-200"
                  >
                    {theater.name}
                  </button>
                ))}
              </div>
            </div>
          )}
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
              개인정보처리방침
            </span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === "location" ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === "location" && (
            <div className="px-4 py-3 border-t border-gray-800 text-xs text-gray-400 space-y-3">
              <div className="space-y-1.5">
                <p className="font-semibold text-gray-300">📍 위치 정보</p>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>위치 정보는 <span className="text-orange-400">거리순 정렬</span>과 <span className="text-orange-400">길찾기</span> 기능에만 사용됩니다.</li>
                  <li>수집된 위치 정보는 서버로 전송되지 않으며, 기기 내에서만 처리됩니다.</li>
                  <li>위치 권한은 기기의 설정에서 언제든 껐다 켤 수 있으며, 허용하지 않아도 시간순 정렬로 앱을 정상적으로 이용할 수 있습니다.</li>
                  <li>위치 정보는 세션 중에만 임시 보관되며 별도로 저장되지 않습니다.</li>
                </ul>
              </div>
              <div className="space-y-1.5">
                <p className="font-semibold text-gray-300">💾 즐겨찾기 · 찜 목록</p>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>즐겨찾는 영화관, 찜 목록은 기기(브라우저)의 로컬 스토리지에만 저장되며, 외부 서버로 전송되지 않습니다.</li>
                  <li>앱을 삭제하거나 저장공간을 초기화하면 해당 데이터도 함께 삭제됩니다.</li>
                </ul>
              </div>
              <div className="space-y-1.5">
                <p className="font-semibold text-gray-300">🔗 외부 데이터 제공</p>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>영화·상영 정보 조회를 위해 영화진흥위원회(KOBIS) 공공 API 및 TMDB API를 호출하며, 이 과정에서 이용자를 식별할 수 있는 개인정보는 전송되지 않습니다.</li>
                </ul>
              </div>
              <p className="text-gray-500 mt-2">문의: dameun0808@gmail.com</p>
              <a
                href="https://app.notion.com/p/dameun-inside/3d78a7d2d43d80d597dccf430f54b1cd?source=copy_link"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center justify-center gap-1.5 w-full py-2 border border-gray-700 text-gray-300 text-xs font-medium hover:border-orange-500 hover:text-orange-400 transition-colors"
              >
                전체 개인정보처리방침 보기
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
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
              className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === "updates" ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === "updates" && (
            <div className="px-4 py-3 text-xs text-gray-400 space-y-3">
              <div>
                <p className="font-semibold text-gray-300">v1.6.0 (2026-09-10)</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>iOS 앱 출시</li>
                  <li>위치 정보를 네이티브 위치 서비스로 조회하도록 개선</li>
                  <li>위치 권한 요청 시 이용 목적 안내 추가</li>
                  <li>iOS 상태바 하단 흰 여백 표시 오류 수정</li>
                </ul>
              </div>
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
              className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === "contact" ? "rotate-180" : ""}`}
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
              className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === "notice" ? "rotate-180" : ""}`}
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
              <p className="text-gray-500 mt-2">This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
            </div>
          )}
        </div>
      </section>

      {/* 푸터 */}
      <div className="text-center pt-4 pb-2">
        <p className="text-[10px] text-gray-500 mt-1">© 2025-2026 영화방랑자. All rights reserved.</p>
      </div>
    </div>
  );
}
