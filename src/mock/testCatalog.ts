// 프로토타입 /test 페이지 전용: 스냅샷 상영 데이터를 제목 기준으로 묶어
// 카탈로그(중복 제거된 영화 목록) 형태로 제공한다.
import { MovieSchedule } from "@/types";

import { getMovieMeta, MovieMeta } from "./movieMeta";
import { getSnapshotMovies } from "./snapshot";

export interface CatalogMovie {
  title: string;
  theater: string;
  time: string;
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

  cached = Array.from(seen.values()).map((movie) => {
    const meta = getMovieMeta(movie.title);
    return {
      title: movie.title,
      theater: movie.theater,
      time: movie.time,
      posterUrl: meta?.posterUrl ?? movie.tmdbPosterUrl ?? movie.posterUrl ?? null,
      meta,
    };
  });

  return cached;
}

export function getCatalogMovie(title: string): CatalogMovie | null {
  return getTestCatalog().find((m) => m.title === title) ?? null;
}
