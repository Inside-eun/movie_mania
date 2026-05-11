import { NextResponse } from "next/server";
import { MovieSchedule } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 10; // Vercel Hobby 플랜 제한

interface TMDBMovieSummary {
  title: string;
  tmdbId: number;
  originalTitle: string;
  overview: string;
  posterUrl: string | null;
  releaseDate: string | null;
  voteAverage: number;
}

async function getCacheService() {
  const { cacheService } = await import("@/services/cacheService");
  return cacheService;
}

function verifyToken(request: Request): boolean {
  const { searchParams } = new URL(request.url);
  return searchParams.get("token") === process.env.PREFETCH_TOKEN;
}

async function handlePrefetchTMDB(request: Request) {
  if (!verifyToken(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: "TMDB_API_KEY 미설정" }, { status: 500 });
  }

  const cache = await getCacheService();
  const { searchMovieByTitle, getTMDBImageUrl } = await import("@/services/tmdbApi");

  console.log("=== [Cron 2] TMDB 프리페치 시작 ===");
  const startTime = Date.now();

  // 오늘 하루치만 처리 (Hobby 플랜 10초 제한)
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0];
  const dayMovies: Array<{ dateStr: string; movies: MovieSchedule[] }> = [];

  const movies = await cache.get<MovieSchedule[]>("integrated", dateStr);
  if (movies && movies.length > 0) {
    dayMovies.push({ dateStr, movies });
  }

  if (dayMovies.length === 0) {
    return NextResponse.json({
      success: false,
      error: "크롤링 캐시 없음. Cron 1이 먼저 실행되어야 합니다.",
    }, { status: 400 });
  }

  // 전체 날짜에 걸친 고유 영화 제목 수집 (TMDB 요청 최소화)
  const allTitles = new Set<string>();
  for (const { movies } of dayMovies) {
    for (const m of movies) {
      const title = (m.title ?? "").trim().replace(/\s+/g, " ");
      if (title) allTitles.add(title);
    }
  }

  // tmdb_db에 없는 영화만 검색
  const db = await cache.getTmdbDb() as Record<string, TMDBMovieSummary>;
  const newTitles = Array.from(allTitles).filter((t) => !db[t]);

  console.log(`총 ${allTitles.size}개 고유 영화, ${newTitles.length}개 신규 TMDB 검색 필요`);

  let newCount = 0;
  const BATCH_SIZE = 10;
  for (let i = 0; i < newTitles.length; i += BATCH_SIZE) {
    const batch = newTitles.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map((title) => searchMovieByTitle(title))
    );
    for (let j = 0; j < batch.length; j++) {
      const title = batch[j];
      const settled = batchResults[j];
      if (settled.status === "fulfilled" && settled.value) {
        const result = settled.value;
        db[title] = {
          title,
          tmdbId: result.id,
          originalTitle: result.original_title,
          overview: result.overview,
          posterUrl: getTMDBImageUrl(result.poster_path, "w342"),
          releaseDate: result.release_date ?? null,
          voteAverage: result.vote_average,
        };
        newCount++;
      } else if (settled.status === "rejected") {
        console.warn(`TMDB 검색 실패 (${title}):`, settled.reason);
      }
    }
  }

  if (newCount > 0) {
    await cache.saveTmdbDb(db);
    console.log(`TMDB DB 업데이트: ${newCount}개 신규 저장`);
  }

  // 각 날짜의 "integrated" 캐시에 tmdbPosterUrl 주입하여 덮어쓰기
  const results = [];
  for (const { dateStr, movies } of dayMovies) {
    const enriched = movies.map((movie) => {
      const normalizedTitle = (movie.title ?? "").trim().replace(/\s+/g, " ");
      const tmdbData = db[normalizedTitle];
      return {
        ...movie,
        tmdbPosterUrl: tmdbData?.posterUrl ?? (movie as any).tmdbPosterUrl ?? null,
      };
    });

    await cache.set("integrated", dateStr, enriched);
    results.push({ date: dateStr, count: enriched.length, success: true });
    console.log(`${dateStr}: tmdbPosterUrl 머지 완료 (${enriched.length}개)`);
  }

  const elapsedTime = Date.now() - startTime;
  console.log(`\n=== [Cron 2] TMDB 완료 (${elapsedTime}ms) ===`);

  return NextResponse.json({
    success: true,
    tmdbNew: newCount,
    results,
    elapsedTime,
    timestamp: new Date().toISOString(),
  });
}

export async function GET(request: Request) {
  try {
    return await handlePrefetchTMDB(request);
  } catch (error) {
    console.error("TMDB 프리페치 API 에러:", error);
    return NextResponse.json(
      {
        success: false,
        error: "TMDB 프리페치 중 오류 발생",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    return await handlePrefetchTMDB(request);
  } catch (error) {
    console.error("TMDB 프리페치 API 에러:", error);
    return NextResponse.json(
      {
        success: false,
        error: "TMDB 프리페치 중 오류 발생",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}
