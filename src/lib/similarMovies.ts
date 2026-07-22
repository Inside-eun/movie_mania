// 프로토타입 /test 페이지 전용: "함께 보면 좋은 작품" 추천 알고리즘.
// 같은 감독 / 같은 장르 / 같은 배우 / 같은 개봉년도 네 가지 중 하나를 무작위로 골라
// 해당 기준에 맞는 작품을 최대 4편 반환한다. 실제 추천 시스템이 아닌 목업 로직이다.
import { CatalogMovie, getTestCatalog } from "@/mock/testCatalog";

export type SimilarAlgorithm = "director" | "genre" | "cast" | "year" | "random";

export interface SimilarMoviesResult {
  algorithm: SimilarAlgorithm;
  label: string;
  matchedValue: string | null;
  items: CatalogMovie[];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function bestByDirector(source: CatalogMovie, pool: CatalogMovie[]) {
  const director = source.meta?.director;
  if (!director) return null;
  const matches = pool.filter((m) => m.meta?.director === director);
  if (matches.length === 0) return null;
  return { value: director, matches, label: `"${director}" 감독의 다른 작품` };
}

function bestByGenre(source: CatalogMovie, pool: CatalogMovie[]) {
  const genres = source.meta?.genres ?? [];
  let best: { genre: string; matches: CatalogMovie[] } | null = null;
  for (const genre of genres) {
    const matches = pool.filter((m) => m.meta?.genres?.includes(genre));
    if (matches.length > 0 && (!best || matches.length > best.matches.length)) {
      best = { genre, matches };
    }
  }
  if (!best) return null;
  return { value: best.genre, matches: best.matches, label: `${best.genre} 장르 추천작` };
}

function bestByCast(source: CatalogMovie, pool: CatalogMovie[]) {
  const cast = source.meta?.cast ?? [];
  let best: { actor: string; matches: CatalogMovie[] } | null = null;
  for (const actor of cast) {
    const matches = pool.filter((m) => m.meta?.cast?.includes(actor));
    if (matches.length > 0 && (!best || matches.length > best.matches.length)) {
      best = { actor, matches };
    }
  }
  if (!best) return null;
  return { value: best.actor, matches: best.matches, label: `"${best.actor}"가 출연한 다른 작품` };
}

function bestByYear(source: CatalogMovie, pool: CatalogMovie[]) {
  const year = source.meta?.year;
  if (!year) return null;
  const matches = pool.filter((m) => m.meta?.year === year);
  if (matches.length === 0) return null;
  return { value: year, matches, label: `${year}년 개봉작` };
}

const RESOLVERS: Record<
  Exclude<SimilarAlgorithm, "random">,
  (source: CatalogMovie, pool: CatalogMovie[]) => { value: string; matches: CatalogMovie[]; label: string } | null
> = {
  director: bestByDirector,
  genre: bestByGenre,
  cast: bestByCast,
  year: bestByYear,
};

const COUNT = 4;

export function pickSimilarMovies(sourceTitle: string): SimilarMoviesResult | null {
  const catalog = getTestCatalog();
  const source = catalog.find((m) => m.title === sourceTitle);
  if (!source) return null;

  const pool = catalog.filter((m) => m.title !== sourceTitle);
  const order = shuffle(Object.keys(RESOLVERS) as Array<keyof typeof RESOLVERS>);

  for (const algorithm of order) {
    const result = RESOLVERS[algorithm](source, pool);
    if (!result) continue;
    return {
      algorithm,
      label: result.label,
      matchedValue: result.value,
      items: shuffle(result.matches).slice(0, COUNT),
    };
  }

  // 네 알고리즘 모두 매칭되는 작품이 없을 때의 최후 폴백
  if (pool.length === 0) return null;
  return {
    algorithm: "random",
    label: "함께 보면 좋은 작품",
    matchedValue: null,
    items: shuffle(pool).slice(0, COUNT),
  };
}
