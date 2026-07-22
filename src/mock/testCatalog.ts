// 프로토타입 /test 페이지 전용: 스냅샷 상영 데이터 + TMDB 평점 top 100을 합쳐
// 카탈로그(중복 제거된 영화 목록) 형태로 제공한다.
import { MovieSchedule } from "@/types";

import { getMovieMeta, MovieMeta } from "./movieMeta";
import { getSnapshotMovies } from "./snapshot";
import topMovieTitles from "./topMovieTitles.json";

export interface CatalogMovie {
  title: string;
  theater: string | null;
  time: string | null;
  posterUrl: string | null;
  meta: MovieMeta | null;
}

let cached: CatalogMovie[] | null = null;

export function getTestCatalog(): CatalogMovie[] {
  if (cached) return cached;

  const seen = new Map<string, MovieSchedule>();
  for (const movie of getSnapshotMovies()) {
    if (!seen.has(movie.title)) seen.set(movie.title, movie);
  }

  const scheduled: CatalogMovie[] = Array.from(seen.values()).map((movie) => {
    const meta = getMovieMeta(movie.title);
    return {
      title: movie.title,
      theater: movie.theater,
      time: movie.time,
      posterUrl: meta?.posterUrl ?? movie.tmdbPosterUrl ?? movie.posterUrl ?? null,
      meta,
    };
  });

  const scheduledTitles = new Set(scheduled.map((m) => m.title));
  const extra: CatalogMovie[] = (topMovieTitles as string[])
    .filter((title) => !scheduledTitles.has(title))
    .map((title) => {
      const meta = getMovieMeta(title);
      return {
        title,
        theater: null,
        time: null,
        posterUrl: meta?.posterUrl ?? null,
        meta,
      };
    });

  cached = [...scheduled, ...extra];
  return cached;
}

export function getCatalogMovie(title: string): CatalogMovie | null {
  return getTestCatalog().find((m) => m.title === title) ?? null;
}
