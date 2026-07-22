// 프로토타입 /test 페이지 전용: 클릭 이벤트를 저장/집계하는 스토어.
// cacheService와 동일한 패턴 — Upstash Redis(UPSTASH_REDIS_REST_URL/TOKEN)가 설정되어 있으면
// 그쪽에 저장해 서버리스 인스턴스 간에도 공유되고, 없으면 로컬 파일(.cache, Vercel은 /tmp)로 폴백한다.
import { Redis } from "@upstash/redis";
import fs from "fs";
import path from "path";

import { SimilarAlgorithm } from "./similarMovies";

export type ClickEvent =
  | { type: "list_click"; movieTitle: string; timestamp: number }
  | {
      type: "recommendation_click";
      algorithm: SimilarAlgorithm;
      sourceTitle: string;
      targetTitle: string;
      timestamp: number;
    };

const MAX_EVENTS = 1000;
const EVENTS_KEY = "test_analytics_events";

function createRedisClient(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

const redis = createRedisClient();

// ── 파일 폴백 (Redis 미설정 시) ──────────────────────────────
function getStorePath(): string {
  const isVercel = process.env.VERCEL === "1";
  const dir = isVercel ? "/tmp/cache" : path.join(process.cwd(), ".cache");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "test_analytics.json");
}

function readFileEvents(): ClickEvent[] {
  const filePath = getStorePath();
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.events) ? parsed.events : [];
  } catch {
    return [];
  }
}

function writeFileEvents(events: ClickEvent[]): void {
  try {
    fs.writeFileSync(getStorePath(), JSON.stringify({ events }), "utf-8");
  } catch (e) {
    console.warn("analytics 파일 저장 실패:", e);
  }
}

// ── 공개 API ──────────────────────────────────────────────
export async function recordEvent(event: ClickEvent): Promise<void> {
  if (redis) {
    try {
      await redis.rpush(EVENTS_KEY, event);
      await redis.ltrim(EVENTS_KEY, -MAX_EVENTS, -1);
      return;
    } catch (e) {
      console.warn("analytics Redis 저장 실패:", e);
      return;
    }
  }

  const events = readFileEvents();
  events.push(event);
  writeFileEvents(events.length > MAX_EVENTS ? events.slice(events.length - MAX_EVENTS) : events);
}

export interface AnalyticsSummary {
  totalEvents: number;
  backend: "redis" | "file";
  listClicks: Array<{ title: string; count: number }>;
  byAlgorithm: Array<{ algorithm: SimilarAlgorithm; count: number }>;
  recommendationClicks: Array<{
    algorithm: SimilarAlgorithm;
    targetTitle: string;
    count: number;
  }>;
}

async function loadEvents(): Promise<ClickEvent[]> {
  if (redis) {
    try {
      return await redis.lrange<ClickEvent>(EVENTS_KEY, 0, -1);
    } catch (e) {
      console.warn("analytics Redis 조회 실패:", e);
      return [];
    }
  }
  return readFileEvents();
}

export async function getSummary(): Promise<AnalyticsSummary> {
  const events = await loadEvents();

  const listCounts = new Map<string, number>();
  const algoCounts = new Map<SimilarAlgorithm, number>();
  const recCounts = new Map<string, { algorithm: SimilarAlgorithm; targetTitle: string; count: number }>();

  for (const event of events) {
    if (event.type === "list_click") {
      listCounts.set(event.movieTitle, (listCounts.get(event.movieTitle) ?? 0) + 1);
    } else {
      algoCounts.set(event.algorithm, (algoCounts.get(event.algorithm) ?? 0) + 1);
      const key = `${event.algorithm}:${event.targetTitle}`;
      const existing = recCounts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        recCounts.set(key, { algorithm: event.algorithm, targetTitle: event.targetTitle, count: 1 });
      }
    }
  }

  return {
    totalEvents: events.length,
    backend: redis ? "redis" : "file",
    listClicks: Array.from(listCounts.entries())
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    byAlgorithm: Array.from(algoCounts.entries())
      .map(([algorithm, count]) => ({ algorithm, count }))
      .sort((a, b) => b.count - a.count),
    recommendationClicks: Array.from(recCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  };
}
