'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export default function CapacitorInit() {
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function init() {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) return;

      const [{ StatusBar, Style }, { SplashScreen }, { App }] = await Promise.all([
        import('@capacitor/status-bar'),
        import('@capacitor/splash-screen'),
        import('@capacitor/app'),
      ]);

      await StatusBar.setStyle({ style: Style.Dark });
      await SplashScreen.hide();

      const backListener = await App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) App.exitApp();
      });

      const pauseListener = await App.addListener('pause', () => {
        window.gtag?.('event', 'app_background', {
          screen_path: window.location.pathname + window.location.search,
        });
      });

      cleanup = () => {
        backListener.remove();
        pauseListener.remove();
      };
    }

    init();
    return () => cleanup?.();
  }, []);

  return null;
}
