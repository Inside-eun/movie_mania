import { MovieSchedule } from '@/types';
import { Capacitor } from '@capacitor/core';

const ASK_FLAG_KEY = "notifPermissionAsked";
const ENABLED_KEY = "showtimeNotificationsEnabled";
const WISHLIST_MOVIES_KEY = "movieWishlistMovies";
const REMINDER_LEAD_MINUTES = 30;

// 설정에서 별도로 끄지 않는 한 기본값은 켜짐
export function isNotificationsEnabled(): boolean {
  return localStorage.getItem(ENABLED_KEY) !== "false";
}

export function setNotificationsEnabled(enabled: boolean): void {
  localStorage.setItem(ENABLED_KEY, String(enabled));
}

function getMovieKey(movie: MovieSchedule): string {
  return movie.movieCode
    ? `${movie.movieCode}-${movie.theater}-${movie.time}`
    : `${movie.title}-${movie.theater}-${movie.time}`;
}

// LocalNotifications는 32bit 정수 id를 요구하므로 문자열 키를 해시로 변환
function notificationId(movie: MovieSchedule): number {
  const key = getMovieKey(movie);
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
}

/**
 * 시스템 권한 팝업 전에 이용 목적을 먼저 설명하는 소프트 애스크.
 * 한 번 물어본 뒤에는(거절 포함) 다시 묻지 않는다.
 */
async function ensurePermission(): Promise<boolean> {
  const { LocalNotifications } = await import("@capacitor/local-notifications");

  const current = await LocalNotifications.checkPermissions();
  if (current.display === "granted") return true;
  if (current.display === "denied") return false;

  const alreadyAsked = localStorage.getItem(ASK_FLAG_KEY);
  if (!alreadyAsked) {
    localStorage.setItem(ASK_FLAG_KEY, "true");
    const agreed = window.confirm(
      "찜한 영화 상영 30분 전에 알림을 보내드릴까요?\n설정 앱의 알림 메뉴에서 언제든 끌 수 있습니다."
    );
    if (!agreed) return false;
  }

  const result = await LocalNotifications.requestPermissions();
  return result.display === "granted";
}

export async function scheduleShowtimeReminder(movie: MovieSchedule, showtime: Date) {
  if (!Capacitor.isNativePlatform()) return;
  if (!isNotificationsEnabled()) return;

  const fireAt = new Date(showtime.getTime() - REMINDER_LEAD_MINUTES * 60 * 1000);
  if (fireAt.getTime() <= Date.now()) return;

  try {
    const granted = await ensurePermission();
    if (!granted) return;

    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.schedule({
      notifications: [
        {
          id: notificationId(movie),
          title: "찜한 영화의 상영이 30분 후에 시작됩니다",
          body: `${movie.title} · ${movie.theater} · ${movie.time}`,
          schedule: { at: fireAt },
        },
      ],
    });
  } catch {
    // 알림 스케줄 실패는 찜 기능 자체를 막지 않는다
  }
}

export async function cancelShowtimeReminder(movie: MovieSchedule) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.cancel({ notifications: [{ id: notificationId(movie) }] });
  } catch {
    // no-op
  }
}

export async function cancelAllShowtimeReminders() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map((n) => ({ id: n.id })),
      });
    }
  } catch {
    // no-op
  }
}

// 알림을 다시 켰을 때 찜 목록에 남아있는 향후 상영에 대해 알림을 재예약
export async function rescheduleAllShowtimeReminders() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const saved = localStorage.getItem(WISHLIST_MOVIES_KEY);
    if (!saved) return;
    const movies: MovieSchedule[] = JSON.parse(saved);

    for (const movie of movies) {
      if (!movie.showtime) continue;
      const showtime = new Date(movie.showtime);
      if (isNaN(showtime.getTime())) continue;
      await scheduleShowtimeReminder(movie, showtime);
    }
  } catch {
    // no-op
  }
}
