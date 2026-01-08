"use client";

import { useState } from "react";

export default function InfoView() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">정보</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          업데이트 내역과 이용 안내를 확인하세요
        </p>
      </div>

      {/* 아코디언 섹션 */}
      <div className="space-y-3">
        {/* 업데이트 노트 */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
          <button
            onClick={() => toggleSection("updates")}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              업데이트 노트
            </span>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                expandedSection === "updates" ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
            {expandedSection === "updates" && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">v1.4.0 (2025-01-08)</p>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
                      <li>필터 다중 선택 기능 추가 (여러 영화/영화관 동시 선택)</li>
                      <li>찜 목록 전체 삭제 기능 추가</li>
                      <li>모바일 UI 최적화 (날짜/조회/필터 한 줄 배치)</li>
                      <li>필터 드롭다운 크기 증가 및 배경 오버레이</li>
                      <li>영화 리스트 2열 표시로 변경</li>
                      <li>하단 네비게이션 바 높이 증가</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">v1.3.0 (2025-01-08)</p>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
                      <li>PWA 지원 추가 (앱으로 설치 가능)</li>
                      <li>모바일 UI 전면 개선</li>
                      <li>하단 네비게이션 바 추가</li>
                      <li>정보 탭 분리</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">v1.2.0 (2024-10-22)</p>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
                      <li>다크모드 지원</li>
                      <li>찜 목록 기능 추가</li>
                      <li>캘린더 뷰 추가</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* 문의사항 */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
          <button
            onClick={() => toggleSection("contact")}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              문의 및 제안
            </span>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                expandedSection === "contact" ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === "contact" && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p>버그 리포트, 기능 제안, 기타 문의사항은 아래로 연락주세요:</p>
              <div className="space-y-1 text-xs">
                <p className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span>https://github.com/Inside-eun </span>
                </p>
                <p className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>dameun0808@gmail.com </span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 안내사항 */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
          <button
            onClick={() => toggleSection("notice")}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              이용 안내
            </span>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                expandedSection === "notice" ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === "notice" && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <div className="space-y-2 text-xs">
                <p className="font-semibold text-gray-900 dark:text-gray-100">📌 제작 방식</p>
                <p>
                  KOBIS(영화진흥위원회) 조회 방식을 사용하기 때문에 실제 상영내역과 일치하지 않을 수 있습니다. <br/>
                  따라서 각 전송사업자별 상영스케줄 운영방식에 따라 일부 정보가 제공되지 않을 수 있습니다. <br/>
                </p>
                <p className="font-semibold text-gray-900 dark:text-gray-100 mt-3">🎬 영화 방랑자란 ?</p>
                <p>
                  박스오피스 5위 이하의 작품들을 주로 상영하는 서울시 예술영화관 및 예술전용관의 정보를 제공합니다. <br/>
                </p>
                <p className="font-semibold text-gray-900 dark:text-gray-100 mt-3">💾 찜 목록 안내</p>
                <p>
                  찜 목록은 브라우저의 로컬 스토리지에 저장되며, 같은 브라우저에서만 유지됩니다. 
                  앱을 삭제하시면 데이터도 자동으로 삭제됩니다 <br/>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 제작자 정보 */}
      <div className="text-center pt-6 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          만든 사람: 제육볶음 달달볶아
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          © 2025 영화방랑자. All rights reserved.
        </p>
      </div>
    </div>
  );
}

