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

type ResolverKey = Exclude<SimilarAlgorithm, "random">;
type ResolverResult = { value: string; matches: CatalogMovie[]; label: string } | null;

const RESOLVERS: Record<ResolverKey, (source: CatalogMovie, pool: CatalogMovie[]) => ResolverResult> = {
  director: bestByDirector,
  genre: bestByGenre,
  cast: bestByCast,
  year: bestByYear,
};

const ALGO_KEYS = Object.keys(RESOLVERS) as ResolverKey[];
const COUNT = 4;

// 장르/개봉년도는 대부분의 영화에 매칭되는 반면 감독/배우는 카탈로그 규모상 겹치는 경우가
// 훨씬 적다(장르 매칭 가능 ~99% vs 감독 ~30%). 매칭 가능한 알고리즘 중 균등 추첨만 하면
// 장르·연도 쪽으로 선택이 크게 쏠리므로, 전역 매칭 가능 비율의 역수 제곱으로 가중치를 줘서
// 노출 빈도를 보정한다.
let cachedWeights: Record<ResolverKey, number> | null = null;

function getAlgorithmWeights(): Record<ResolverKey, number> {
  if (cachedWeights) return cachedWeights;

  const catalog = getTestCatalog();
  const availability: Record<ResolverKey, number> = { director: 0, genre: 0, cast: 0, year: 0 };
  for (const movie of catalog) {
    const pool = catalog.filter((m) => m.title !== movie.title);
    for (const key of ALGO_KEYS) {
      if (RESOLVERS[key](movie, pool)) availability[key] += 1;
    }
  }

  const weights = {} as Record<ResolverKey, number>;
  for (const key of ALGO_KEYS) {
    const rate = availability[key] / catalog.length;
    weights[key] = rate > 0 ? (1 / rate) ** 2 : 0;
  }
  cachedWeights = weights;
  return weights;
}

function pickWeighted(candidates: Array<{ algorithm: ResolverKey; result: NonNullable<ResolverResult> }>) {
  const weights = getAlgorithmWeights();
  const totalWeight = candidates.reduce((sum, c) => sum + weights[c.algorithm], 0);
  let r = Math.random() * totalWeight;
  for (const c of candidates) {
    r -= weights[c.algorithm];
    if (r <= 0) return c;
  }
  return candidates[candidates.length - 1];
}

export function pickSimilarMovies(sourceTitle: string): SimilarMoviesResult | null {
  const catalog = getTestCatalog();
  const source = catalog.find((m) => m.title === sourceTitle);
  if (!source) return null;

  const pool = catalog.filter((m) => m.title !== sourceTitle);

  const candidates = ALGO_KEYS.reduce<Array<{ algorithm: ResolverKey; result: NonNullable<ResolverResult> }>>(
    (acc, algorithm) => {
      const result = RESOLVERS[algorithm](source, pool);
      if (result) acc.push({ algorithm, result });
      return acc;
    },
    [],
  );

  if (candidates.length > 0) {
    const chosen = pickWeighted(candidates);
    return {
      algorithm: chosen.algorithm,
      label: chosen.result.label,
      matchedValue: chosen.result.value,
      items: shuffle(chosen.result.matches).slice(0, COUNT),
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
