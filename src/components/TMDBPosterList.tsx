"use client";

import { useEffect, useState } from "react";

interface TMDBMovieSummary {
  title: string;
  tmdbId: number;
  originalTitle: string;
  overview: string;
  posterUrl: string | null;
  releaseDate: string | null;
  voteAverage: number;
}

interface Props {
  date: string;
}

export default function TMDBPosterList({ date }: Props) {
  const [data, setData] = useState<TMDBMovieSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/tmdb-movies?date=${date}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        if (!cancelled && json?.success) {
          setData(json.data || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError("TMDB 영화 정보를 불러오는 중 오류가 발생했습니다.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [date]);

  if (loading) {
    return (
      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        TMDB에서 포스터 정보를 불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 text-center text-sm text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (!data.length) {
    return null;
  }

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
        TMDB 기준 오늘 상영작 포스터
      </h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        현재 상영 스케줄의 제목을 기준으로 TMDB에서 검색한 결과입니다. 일부
        작품은 검색되지 않을 수 있습니다.
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {data.map((movie) => (
          <div
            key={movie.tmdbId}
            className="flex flex-col items-center text-center text-xs"
          >
            {movie.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full rounded-lg shadow-sm mb-2 aspect-[2/3] object-cover bg-gray-200 dark:bg-gray-800"
                loading="lazy"
              />
            ) : (
              <div className="w-full rounded-lg mb-2 aspect-[2/3] flex items-center justify-center bg-gray-200 dark:bg-gray-800 text-[10px] text-gray-500 dark:text-gray-400">
                포스터 없음
              </div>
            )}
            <div className="font-medium line-clamp-2 text-gray-900 dark:text-gray-100">
              {movie.title}
            </div>
            {movie.releaseDate && (
              <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                {movie.releaseDate.slice(0, 4)}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

