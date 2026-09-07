// 프로토타입 전용: 2026-07-20 시점 실제 상영 데이터를 얼려둔 스냅샷 로더.
// 실제 크롤러/DB 호출 없이 화면 목업을 그릴 때 이 데이터를 사용한다.
import { MovieSchedule } from "@/types";

import raw from "./movies-snapshot.json";

interface SnapshotFile {
  snapshotDate: string;
  capturedAt: number;
  count: number;
  data: MovieSchedule[];
}

const snapshot = raw as SnapshotFile;

export const SNAPSHOT_DATE = snapshot.snapshotDate;

export function getSnapshotMovies(): MovieSchedule[] {
  return snapshot.data;
}

export function getSnapshotMoviesByTheater(theaterName: string): MovieSchedule[] {
  return snapshot.data.filter((m) => m.theater === theaterName);
}

export function getSnapshotMoviesByTitles(titles: string[]): MovieSchedule[] {
  const set = new Set(titles);
  return snapshot.data.filter((m) => set.has(m.title));
}
