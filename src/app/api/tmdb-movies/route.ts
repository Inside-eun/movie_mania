import { NextResponse } from "next/server";
import { MovieSchedule } from "@/types";

export const dynamic = "force-dynamic";

function normalizeTitle(title: string): string {
  return title.trim().replace(/\s+/g, " ");
}

interface TMDBMovieSummary {
  title: string;
  tmdbId: number;
  originalTitle: string;
  overview: string;
  posterUrl: string | null;
  releaseDate: string | null;
  voteAverage: number;
}

async function getScheduleService() {
  const { ScheduleService } = await import("@/services/scheduleService");
  return new ScheduleService();
}

async function getCacheService() {
  const { cacheService } = await import("@/services/cacheService");
  return cacheService;
}

async function getTMDBService() {
  const { searchMovieByTitle, getTMDBImageUrl } = await import(
    "@/services/tmdbApi"
  );
  return { searchMovieByTitle, getTMDBImageUrl };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    let targetDate = new Date();
    if (dateParam) {
      const parsed = new Date(dateParam);
      if (!isNaN(parsed.getTime())) {
        targetDate = parsed;
      }
    }
    const dateStr = targetDate.toISOString().split("T")[0];

    const cache = await getCacheService();
    const scheduleService = await getScheduleService();

    let movies: MovieSchedule[] = [];
    const cachedSchedules = await cache.get<MovieSchedule[]>("integrated", dateStr);
    if (cachedSchedules) {
      movies = cachedSchedules;
    } else {
      movies = await (scheduleService as any).crawlArtCinemasWithKMDBByDate(
        targetDate,
      );
    }

    const titles = Array.from(
      new Set(
        movies
          .map((m) => normalizeTitle(m.title ?? ""))
          .filter((t) => t.length > 0),
      ),
    );

    const db = await cache.getTmdbDb() as Record<string, TMDBMovieSummary>;
    const { searchMovieByTitle, getTMDBImageUrl } = await getTMDBService();
    const results: TMDBMovieSummary[] = [];
    let changed = false;

    for (const title of titles) {
      const existing = db[title];
      if (existing) {
        results.push(existing);
        continue;
      }

      const result = await searchMovieByTitle(title);
      if (!result) continue;

      const summary: TMDBMovieSummary = {
        title,
        tmdbId: result.id,
        originalTitle: result.original_title,
        overview: result.overview,
        posterUrl: getTMDBImageUrl(result.poster_path, "w342"),
        releaseDate: result.release_date ?? null,
        voteAverage: result.vote_average,
      };
      db[title] = summary;
      results.push(summary);
      changed = true;
    }

    if (changed) {
      await cache.saveTmdbDb(db);
    }

    return NextResponse.json({
      success: true,
      fromCache: !changed,
      date: dateStr,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error("TMDB 영화 API 에러:", error);
    return NextResponse.json(
      {
        success: false,
        error: "TMDB 영화 정보를 가져오는 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 },
    );
  }
}

