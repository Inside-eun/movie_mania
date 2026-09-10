export interface GeoCoords {
  latitude: number;
  longitude: number;
}

/**
 * 네이티브 앱(iOS/Android)에서는 @capacitor/geolocation(CoreLocation)을 쓰고,
 * 웹에서는 브라우저 표준 navigator.geolocation을 쓴다.
 * WKWebView는 iOS 16.4 미만에서 navigator.geolocation이 동작하지 않아 네이티브 플러그인이 필요함.
 */
export async function getCurrentPosition(): Promise<GeoCoords> {
  const { Capacitor } = await import('@capacitor/core');

  if (Capacitor.isNativePlatform()) {
    const { Geolocation } = await import('@capacitor/geolocation');
    const position = await Geolocation.getCurrentPosition();
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  }

  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('브라우저에서 위치 정보를 지원하지 않습니다'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      (error) => reject(error)
    );
  });
}
