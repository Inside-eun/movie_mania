"use client";

import Link from "next/link";
import { useMemo } from "react";

import PosterImage from "@/components/PosterImage";
import { trackListClick } from "@/lib/analyticsClient";
import { getTestCatalog } from "@/mock/testCatalog";

export default function TestHomePage() {
  const catalog = useMemo(() => getTestCatalog(), []);

  return (
    <div className="min-h-screen bg-black text-gray-100 pb-16">
      <div className="sticky top-0 z-40 bg-black border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-white">테스트 프로토타입</h1>
          <p className="text-[11px] text-gray-500">리뉴얼 상세 페이지 · 추천 알고리즘 실험용</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/test/stats"
            className="text-[10px] font-bold text-gray-300 border border-gray-700 px-2 py-0.5 hover:border-orange-500 hover:text-orange-400 transition-colors"
          >
            📊 통계
          </Link>
          <span className="text-[10px] font-bold text-black bg-orange-500 px-2 py-0.5">TEST</span>
        </div>
      </div>

      <main className="container mx-auto px-4 pt-4 max-w-4xl">
        <p className="text-xs text-gray-500 mb-3">{catalog.length}개 작품</p>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {catalog.map((movie) => (
            <Link
              key={movie.title}
              href={`/test/movie/${encodeURIComponent(movie.title)}`}
              onClick={() => trackListClick(movie.title)}
              className="overflow-hidden bg-gray-900 flex flex-col active:scale-[0.98] transition-transform"
            >
              <div className="relative w-full aspect-[2/3] bg-gray-800">
                <PosterImage src={movie.posterUrl} alt={movie.title} sizes="(max-width: 1024px) 50vw, 33vw" />
                {typeof movie.meta?.voteAverage === "number" && movie.meta.voteAverage > 0 && (
                  <span className="absolute top-1.5 left-1.5 text-[9px] font-bold text-white bg-black/70 px-1.5 py-0.5">
                    ★ {movie.meta.voteAverage.toFixed(1)}
                  </span>
                )}
              </div>
              <div className="p-2.5 flex flex-col gap-1">
                <h2 className="text-[13px] font-bold text-white leading-snug truncate">{movie.title}</h2>
                <div className="flex items-center gap-1 text-[11px] text-gray-400 truncate">
                  {movie.meta?.director && <span className="truncate">{movie.meta.director}</span>}
                  {movie.meta?.year && <span className="text-gray-600 flex-shrink-0">· {movie.meta.year}</span>}
                </div>
                {movie.meta?.genres && movie.meta.genres.length > 0 && (
                  <p className="text-[10px] text-orange-500 truncate">{movie.meta.genres.join(" · ")}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
