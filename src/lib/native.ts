'use client';

import { Capacitor } from '@capacitor/core';

export const isNative = () => Capacitor.isNativePlatform();
export const isIOS = () => Capacitor.getPlatform() === 'ios';

export async function triggerHaptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
    await Haptics.impact({ style: map[style] });
  } catch {}
}

export async function shareMovie(title: string, theater: string, time: string) {
  try {
    const { Share } = await import('@capacitor/share');
    await Share.share({
      title: `${title} - ${theater}`,
      text: `🎬 ${title}\n📍 ${theater}\n🕐 ${time}\n\n영화방랑자 앱에서 확인하세요!`,
      url: 'https://moviemania-olive.vercel.app',
      dialogTitle: '영화 정보 공유',
    });
  } catch {}
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleMovieNotification(
  id: number,
  title: string,
  theater: string,
  notifyAt: Date
) {
  if (!isNative()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title: '🎬 영화 상영 알림',
          body: `${title} - ${theater} 상영 1시간 전입니다`,
          schedule: { at: notifyAt },
          sound: undefined,
          actionTypeId: '',
          extra: null,
        },
      ],
    });
  } catch {}
}

export async function cancelMovieNotification(id: number) {
  if (!isNative()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({ notifications: [{ id }] });
  } catch {}
}

export function movieNotificationId(title: string, time: string): number {
  let hash = 0;
  const str = `${title}-${time}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 2147483647;
}
