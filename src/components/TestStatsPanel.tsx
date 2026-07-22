"use client";

import { useCallback, useEffect, useState } from "react";

import { AnalyticsSummary } from "@/lib/analyticsStore";

const ALGORITHM_LABEL: Record<string, string> = {
  director: "같은 감독",
  genre: "같은 장르",
  cast: "같은 배우",
  year: "같은 개봉년도",
  random: "무작위 폴백",
};

export default function TestStatsPanel() {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);

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
    if (open) load();
  }, [open, load]);

  return (
    <div className="mt-8 border border-gray-800 bg-gray-950">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-white"
      >
        <span>📊 클릭 통계 (테스트용)</span>
        <span className="text-gray-500 text-xs">{open ? "접기 ▲" : "펼치기 ▼"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          {loading && <p className="text-xs text-gray-500">불러오는 중...</p>}

          {!loading && summary && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-gray-500">
                누적 이벤트 {summary.totalEvents}건 · 저장소:{" "}
                {summary.backend === "redis" ? "Redis (공유)" : "로컬 파일"}
                <button onClick={load} className="ml-2 text-orange-400 underline">
                  새로고침
                </button>
              </p>

              <div>
                <h3 className="text-xs font-bold text-orange-500 mb-1.5">알고리즘별 클릭 수</h3>
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
                <h3 className="text-xs font-bold text-orange-500 mb-1.5">추천작 중 많이 클릭된 영화</h3>
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
                <h3 className="text-xs font-bold text-orange-500 mb-1.5">메인 목록에서 많이 클릭된 영화</h3>
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
        </div>
      )}
    </div>
  );
}
