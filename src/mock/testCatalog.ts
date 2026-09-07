// 프로토타입 /test 페이지 전용: 스냅샷 상영 데이터 + TMDB 평점 top 100을 합쳐
// 카탈로그(중복 제거된 영화 목록) 형태로 제공한다. 상영 스케줄 여부는 노출하지 않고
// 목록에서 뒤섞여 보이도록 제목 해시 기반으로 정렬한다(SSR/CSR 간 동일한 순서 유지).
import { getMovieMeta, MovieMeta } from "./movieMeta";
import { getSnapshotMovies } from "./snapshot";
import topMovieTitles from "./topMovieTitles.json";

export interface CatalogMovie {
  title: string;
  posterUrl: string | null;
  meta: MovieMeta | null;
}

let cached: CatalogMovie[] | null = null;

function hashTitle(title: string): number {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getTestCatalog(): CatalogMovie[] {
  if (cached) return cached;

  const posterFallback = new Map<string, string | null>();
  for (const movie of getSnapshotMovies()) {
    if (!posterFallback.has(movie.title)) {
      posterFallback.set(movie.title, movie.tmdbPosterUrl ?? movie.posterUrl ?? null);
    }
  }

  const titles = new Set<string>([...posterFallback.keys(), ...(topMovieTitles as string[])]);

  cached = Array.from(titles)
    .map((title) => {
      const meta = getMovieMeta(title);
      return {
        title,
        posterUrl: meta?.posterUrl ?? posterFallback.get(title) ?? null,
        meta,
      };
    })
    .sort((a, b) => hashTitle(a.title) - hashTitle(b.title));

  return cached;
}

export function getCatalogMovie(title: string): CatalogMovie | null {
  return getTestCatalog().find((m) => m.title === title) ?? null;
}
