import { NextResponse } from "next/server";
import { getMovieCredits, TMDBMovieCredits } from "@/services/tmdbApi";
import { cacheService } from "@/services/cacheService";

const CACHE_TYPE = "movie-credits";
const CACHE_DATE = "static"; // 감독/출연진은 날짜와 무관 — 24시간 TTL로 고정 키 사용
const CONCURRENCY = 5;

async function getCreditsWithCache(title: string): Promise<TMDBMovieCredits | null> {
  const cached = await cacheService.get<TMDBMovieCredits>(CACHE_TYPE, CACHE_DATE, { title });
  if (cached) return cached;

  const credits = await getMovieCredits(title);
  if (credits) {
    await cacheService.set(CACHE_TYPE, CACHE_DATE, credits, { title });
  }
  return credits;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index++;
      results[current] = await fn(items[current]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const titles: unknown = body?.titles;

    if (!Array.isArray(titles) || titles.some((t) => typeof t !== "string")) {
      return NextResponse.json(
        { success: false, error: "titles(string[])가 필요합니다." },
        { status: 400 },
      );
    }

    const uniqueTitles = Array.from(new Set(titles as string[])).slice(0, 100);
    const results = await mapWithConcurrency(uniqueTitles, CONCURRENCY, getCreditsWithCache);

    const data: Record<string, TMDBMovieCredits | null> = {};
    uniqueTitles.forEach((title, i) => {
      data[title] = results[i];
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("영화 크레딧 API 에러:", error);
    return NextResponse.json(
      { success: false, error: "크레딧 정보를 가져오는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
