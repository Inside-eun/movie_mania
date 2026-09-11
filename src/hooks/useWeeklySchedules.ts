"use client";

import { useEffect, useState } from "react";
import { MovieSchedule, ScheduleResponse } from "@/types";
import { getLocalDateString } from "@/utils/date";

const DAYS_AHEAD = 7;
const SESSION_STORAGE_PREFIX = "weeklySchedules:";

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
// 하루치만 조회 가능한 /api/schedules를 날짜별로 순차 호출해서 모은다.
// 캐시 미스인 날짜가 겹칠 때 서버에서 동시에 여러 크롤링이 도는 걸 피하려고
// Promise.all이 아니라 순차 호출로 간다.
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

    async function loadWeek() {
      const result: Record<string, MovieSchedule[]> = {};
      for (const date of dates) {
        if (cancelled) return;
        try {
          const res = await fetch(`/api/schedules?type=integrated&date=${date}`);
          const data: ScheduleResponse = await res.json();
          result[date] = data.success ? data.data : [];
        } catch {
          result[date] = [];
        }
        if (cancelled) return;
        setLoadedDays((prev) => prev + 1);
        setScheduleByDate({ ...result });
      }
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
