"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";

import PosterImage from "@/components/PosterImage";
import { trackRecommendationClick } from "@/lib/analyticsClient";
import { pickSimilarMovies } from "@/lib/similarMovies";
import { getCatalogMovie } from "@/mock/testCatalog";

export default function TestMovieDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();

  const title = decodeURIComponent(params.slug);
  const movie = useMemo(() => getCatalogMovie(title), [title]);
  const recommendation = useMemo(() => pickSimilarMovies(title), [title]);

  if (!movie) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex flex-col items-center justify-center gap-3 px-4">
        <p className="text-sm text-gray-400">영화 정보를 찾을 수 없습니다.</p>
        <Link href="/test" className="text-xs text-orange-500 underline">
          테스트 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const meta = movie.meta;

  return (
    <div className="min-h-screen bg-black text-gray-100 pb-16">
      {/* 백드롭 헤더 */}
      <div className="relative w-full aspect-[3/4] sm:aspect-[16/9] max-h-[70vh] overflow-hidden">
        <PosterImage src={movie.posterUrl} alt={movie.title} priority className="object-cover blur-[1px] scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />

        <button
          onClick={() => router.back()}
          className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-black/60 backdrop-blur px-2.5 py-1.5 text-xs text-gray-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          뒤로
        </button>

        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 flex items-end gap-4">
          <div className="relative w-24 aspect-[2/3] flex-shrink-0 shadow-2xl">
            <PosterImage src={movie.posterUrl} alt={movie.title} sizes="96px" />
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-xl font-bold text-white leading-tight mb-1.5">{movie.title}</h1>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-300">
              {meta?.director && <span>{meta.director}</span>}
              {meta?.year && <span className="text-gray-500">{meta.year}</span>}
              {typeof meta?.voteAverage === "number" && meta.voteAverage > 0 && (
                <span className="text-orange-400 font-semibold">★ {meta.voteAverage.toFixed(1)}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 pt-4">
        {meta?.genres && meta.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {meta.genres.map((g) => (
              <span key={g} className="text-[11px] text-gray-300 border border-gray-700 px-2 py-0.5">
                {g}
              </span>
            ))}
          </div>
        )}

        {meta?.overview && (
          <p className="text-[13px] text-gray-300 leading-relaxed mb-5 whitespace-pre-line">{meta.overview}</p>
        )}

        {meta?.cast && meta.cast.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold text-orange-500 mb-1.5">출연</h2>
            <p className="text-[13px] text-gray-300">{meta.cast.join(", ")}</p>
          </div>
        )}

        {/* 함께 보면 좋은 작품 - 4가지 알고리즘 중 무작위 1개 */}
        {recommendation && recommendation.items.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-white mb-3">{recommendation.label}</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {recommendation.items.map((item) => (
                <Link
                  key={item.title}
                  href={`/test/movie/${encodeURIComponent(item.title)}`}
                  onClick={() =>
                    trackRecommendationClick(recommendation.algorithm, movie.title, item.title)
                  }
                  className="flex-shrink-0 w-24"
                >
                  <div className="relative w-24 aspect-[2/3] overflow-hidden bg-gray-800 mb-1.5">
                    <PosterImage src={item.posterUrl} alt={item.title} sizes="96px" />
                  </div>
                  <p className="text-[11px] text-gray-200 leading-tight truncate">{item.title}</p>
                  {item.meta?.director && (
                    <p className="text-[10px] text-gray-500 truncate">{item.meta.director}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
