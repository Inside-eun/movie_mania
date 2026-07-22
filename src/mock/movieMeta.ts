// 프로토타입 /test 페이지 전용: TMDB에서 수집한 영화 메타데이터(감독/장르/출연진/개봉년도) 로더.
// src/scripts/buildMovieMeta.cjs 로 생성된 movieMeta.json을 읽어 제공한다.
import raw from "./movieMeta.json";

export interface MovieMeta {
  tmdbId: number;
  director: string | null;
  cast: string[];
  genres: string[];
  year: string | null;
  releaseDate: string | null;
  posterUrl: string | null;
  overview: string | null;
  voteAverage: number | null;
}

const metaByTitle = raw as Record<string, MovieMeta>;

export function getMovieMeta(title: string): MovieMeta | null {
  return metaByTitle[title] ?? null;
}

export function hasMovieMeta(title: string): boolean {
  return title in metaByTitle;
}

export function getAllMetaTitles(): string[] {
  return Object.keys(metaByTitle);
}
