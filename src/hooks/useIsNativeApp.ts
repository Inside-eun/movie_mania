"use client";

import { useEffect, useState } from "react";

/**
 * Capacitor 네이티브 앱(iOS WebView) 안에서 실행 중인지 여부.
 *
 * 앱은 웹과 같은 배포본(Vercel URL)을 그대로 띄우기 때문에 빌드 타임 분기가 불가능하고,
 * 런타임에만 구분할 수 있다. SSR/하이드레이션 시점에는 항상 false를 돌려주고(=웹 기준),
 * 마운트 후에 네이티브면 true로 바뀐다. 앱에서 첫 페인트 때 잠깐 보였다 사라지는 것을
 * 막으려면 globals.css의 `html[data-native="true"]` 규칙(레이아웃 인라인 스크립트가 설정)을
 * 함께 쓴다.
 */
export function useIsNativeApp() {
  const [isNativeApp, setIsNativeApp] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("@capacitor/core").then(({ Capacitor }) => {
      if (!cancelled) setIsNativeApp(Capacitor.isNativePlatform());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return isNativeApp;
}
