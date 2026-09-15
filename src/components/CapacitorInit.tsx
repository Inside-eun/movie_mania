'use client';

import { useEffect } from 'react';

import { trackAppBackground, trackAppForeground, trackNotificationOpened } from '@/utils/gtm';

export default function CapacitorInit() {
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function init() {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) return;

      const [{ StatusBar, Style }, { SplashScreen }, { App }, { LocalNotifications }] = await Promise.all([
        import('@capacitor/status-bar'),
        import('@capacitor/splash-screen'),
        import('@capacitor/app'),
        import('@capacitor/local-notifications'),
      ]);

      await StatusBar.setStyle({ style: Style.Dark });
      await SplashScreen.hide();

      const backListener = await App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) App.exitApp();
      });

      const pauseListener = await App.addListener('pause', () => {
        trackAppBackground(window.location.pathname + window.location.search);
      });

      const resumeListener = await App.addListener('resume', () => {
        trackAppForeground(window.location.pathname + window.location.search);
      });

      const notificationOpenedListener = await LocalNotifications.addListener(
        'localNotificationActionPerformed',
        (action) => {
          const extra = action.notification.extra as
            | { movieTitle?: string; theater?: string }
            | undefined;
          trackNotificationOpened(extra?.movieTitle, extra?.theater);
        }
      );

      cleanup = () => {
        backListener.remove();
        pauseListener.remove();
        resumeListener.remove();
        notificationOpenedListener.remove();
      };
    }

    init();
    return () => cleanup?.();
  }, []);

  return null;
}
