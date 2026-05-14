'use client';

import { useEffect } from 'react';

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
      await StatusBar.setBackgroundColor({ color: '#000000' });
      await SplashScreen.hide();

      // 안드로이드 백버튼: 뒤로 갈 곳 없으면 앱 종료
      const backListener = await App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) App.exitApp();
      });

      cleanup = () => backListener.remove();
    }

    init();
    return () => cleanup?.();
  }, []);

  return null;
}
