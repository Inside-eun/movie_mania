"use client";

import { useEffect, useState } from "react";
import { MovieSchedule, ScheduleResponse } from "@/types";
import { getLocalDateString } from "@/utils/date";

const DAYS_AHEAD = 7;
const SESSION_STORAGE_PREFIX = "weeklySchedules:";
// 캐시가 미리 채워져 있으면(매일 새벽 크론이 오늘~+6일을 전부 예열) 대부분 캐시 히트라
// 병렬로 불러도 문제 없지만, 캐시가 비어 있는 날짜가 여러 개 겹치면 동시에 여러 건의
// 실시간 크롤링이 걸릴 수 있으니 완전 병렬 대신 동시 요청 수를 제한한다.
const CONCURRENCY = 3;

function getWeekDates(): string[] {
  const today = new Date();
  return Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return getLocalDateString(d);
  });
}

export interface WeeklySchedules {
  scheduleByDate: Record<string, MovieSchedule[]>;
  dates: string[];
  loading: boolean;
  loadedDays: number;
  totalDays: number;
  error: string | null;
}

// 기획전 상영작이 이번 주(오늘 포함 7일) 안에 실제로 상영되는지 확인하기 위해,
// 하루치만 조회 가능한 /api/schedules를 날짜별로 호출해서 모은다.
// 완전 순차 호출은 캐시 히트일 때도 왕복 지연이 7번 그대로 누적돼 배너 등장이
// 체감상 오래 걸리므로, CONCURRENCY개씩 묶어서 병렬로 호출한다.
export function useWeeklySchedules(): WeeklySchedules {
  const [scheduleByDate, setScheduleByDate] = useState<Record<string, MovieSchedule[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadedDays, setLoadedDays] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const dates = getWeekDates();

  useEffect(() => {
    let cancelled = false;
    const storageKey = `${SESSION_STORAGE_PREFIX}${dates[0]}`;

    const cached = sessionStorage.getItem(storageKey);
    if (cached) {
      try {
        setScheduleByDate(JSON.parse(cached));
        setLoadedDays(dates.length);
        setLoading(false);
        return;
      } catch {
        // 캐시가 깨졌으면 무시하고 새로 받는다.
      }
    }

    async function fetchDate(date: string): Promise<MovieSchedule[]> {
      try {
        const res = await fetch(`/api/schedules?type=integrated&date=${date}`);
        const data: ScheduleResponse = await res.json();
        return data.success ? data.data : [];
      } catch {
        return [];
      }
    }

    async function loadWeek() {
      const result: Record<string, MovieSchedule[]> = {};
      const queue = [...dates];

      async function worker() {
        while (queue.length > 0) {
          if (cancelled) return;
          const date = queue.shift();
          if (!date) return;
          result[date] = await fetchDate(date);
          if (cancelled) return;
          setLoadedDays((prev) => prev + 1);
          setScheduleByDate({ ...result });
        }
      }

      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, dates.length) }, worker)
      );
      if (cancelled) return;
      sessionStorage.setItem(storageKey, JSON.stringify(result));
      setLoading(false);
    }

    loadWeek().catch(() => {
      if (!cancelled) {
        setError("이번 주 상영 정보를 불러오지 못했습니다");
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { scheduleByDate, dates, loading, loadedDays, totalDays: dates.length, error };
}
