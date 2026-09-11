"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AnalyticsSummary } from "@/lib/analyticsStore";

const ALGORITHM_LABEL: Record<string, string> = {
  director: "같은 감독",
  genre: "같은 장르",
  cast: "같은 배우",
  year: "같은 개봉년도",
  random: "무작위 폴백",
};

export default function TestStatsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics/track");
      const json = await res.json();
      if (json?.success) setSummary(json.data);
    } catch {
      // 무시
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleReset = useCallback(async () => {
    if (!window.confirm("지금까지 기록된 클릭 통계를 모두 초기화할까요?")) return;
    setResetting(true);
    try {
      await fetch("/api/analytics/track", { method: "DELETE" });
      await load();
    } finally {
      setResetting(false);
    }
  }, [load]);

  return (
    <div className="min-h-screen bg-black text-gray-100 pb-16">
      <div className="sticky top-0 z-40 bg-black border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/test" className="text-gray-400 hover:text-orange-400 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-base font-bold text-white">📊 클릭 통계</h1>
        </div>
        <button
          onClick={load}
          className="text-[10px] font-bold text-gray-300 border border-gray-700 px-2 py-0.5 hover:border-orange-500 hover:text-orange-400 transition-colors"
        >
          새로고침
        </button>
      </div>

      <main className="container mx-auto px-4 pt-4 max-w-2xl">
        {loading && <p className="text-xs text-gray-500">불러오는 중...</p>}

        {!loading && summary && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                누적 이벤트 {summary.totalEvents}건 · 저장소:{" "}
                {summary.backend === "redis" ? "Redis (공유)" : "로컬 파일"}
              </p>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="text-[11px] font-bold text-red-400 border border-red-900 px-2.5 py-1 hover:bg-red-950 transition-colors disabled:opacity-50"
              >
                {resetting ? "초기화 중..." : "전체 초기화"}
              </button>
            </div>

            <div>
              <h2 className="text-xs font-bold text-orange-500 mb-1.5">알고리즘별 클릭 수</h2>
              {summary.byAlgorithm.length === 0 ? (
                <p className="text-xs text-gray-600">아직 기록이 없습니다.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {summary.byAlgorithm.map((row) => (
                    <li key={row.algorithm} className="flex justify-between text-xs text-gray-300">
                      <span>{ALGORITHM_LABEL[row.algorithm] ?? row.algorithm}</span>
                      <span className="text-gray-500">{row.count}회</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h2 className="text-xs font-bold text-orange-500 mb-1.5">추천작 중 많이 클릭된 영화</h2>
              {summary.recommendationClicks.length === 0 ? (
                <p className="text-xs text-gray-600">아직 기록이 없습니다.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {summary.recommendationClicks.map((row) => (
                    <li
                      key={`${row.algorithm}:${row.targetTitle}`}
                      className="flex justify-between gap-2 text-xs text-gray-300"
                    >
                      <span className="truncate">
                        {row.targetTitle}
                        <span className="text-gray-600"> · {ALGORITHM_LABEL[row.algorithm] ?? row.algorithm}</span>
                      </span>
                      <span className="text-gray-500 flex-shrink-0">{row.count}회</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h2 className="text-xs font-bold text-orange-500 mb-1.5">메인 목록에서 많이 클릭된 영화</h2>
              {summary.listClicks.length === 0 ? (
                <p className="text-xs text-gray-600">아직 기록이 없습니다.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {summary.listClicks.map((row) => (
                    <li key={row.title} className="flex justify-between text-xs text-gray-300">
                      <span className="truncate">{row.title}</span>
                      <span className="text-gray-500 flex-shrink-0">{row.count}회</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
