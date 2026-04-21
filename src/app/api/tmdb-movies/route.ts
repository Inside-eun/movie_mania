import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { MovieSchedule } from "@/types";

export const dynamic = "force-dynamic";

const TMDB_DB_FILENAME = "tmdb_db.json";

function getTMDBDbPath(): string {
  const isVercel = process.env.VERCEL === "1";
  const dir = isVercel ? "/tmp/cache" : path.join(process.cwd(), ".cache");
  return path.join(dir, TMDB_DB_FILENAME);
}

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

function loadTMDBDb(): Record<string, TMDBMovieSummary> {
  const filePath = getTMDBDbPath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw);
      return typeof data === "object" && data !== null ? data : {};
    }
  } catch (e) {
    console.warn("TMDB DB 로드 실패:", e);
  }
  return {};
}

function saveTMDBDb(db: Record<string, TMDBMovieSummary>): void {
  const filePath = getTMDBDbPath();
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.warn("TMDB DB 저장 실패:", e);
  }
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
    const cachedSchedules = cache.get<MovieSchedule[]>("integrated", dateStr);
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

    const db = loadTMDBDb();
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
      saveTMDBDb(db);
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

