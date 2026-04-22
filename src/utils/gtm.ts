/**
 * Google Tag Manager 이벤트 추적 유틸리티
 */

declare global {
  interface Window {
    dataLayer: any[];
  }
}

export const GTM_EVENTS = {
  // 날짜 선택 관련
  DATE_CHANGED: 'date_changed',
  SEARCH_CLICKED: 'search_clicked',
  
  // 찜 기능 관련
  WISHLIST_ADDED: 'wishlist_added',
  WISHLIST_REMOVED: 'wishlist_removed',
  WISHLIST_CLEARED: 'wishlist_cleared',
  
  // 다크모드 관련
  DARK_MODE_TOGGLED: 'dark_mode_toggled',
} as const;

interface GTMEventParams {
  [key: string]: string | number | boolean | undefined;
}

/**
 * GTM 이벤트 전송
 */
export const trackEvent = (
  eventName: string,
  params?: GTMEventParams
) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...params,
    });
  }
};

/**
 * 날짜 변경 이벤트
 */
export const trackDateChange = (selectedDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const selected = new Date(selectedDate);
  selected.setHours(0, 0, 0, 0);
  
  const daysFromToday = Math.floor(
    (selected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  trackEvent(GTM_EVENTS.DATE_CHANGED, {
    date: selectedDate,
    days_from_today: daysFromToday,
    is_today: daysFromToday === 0,
  });
};

/**
 * 조회 버튼 클릭 이벤트
 */
export const trackSearchClick = (selectedDate: string) => {
  trackEvent(GTM_EVENTS.SEARCH_CLICKED, {
    date: selectedDate,
  });
};

/**
 * 찜 추가 이벤트
 */
export const trackWishlistAdd = (
  movieTitle: string,
  theater: string,
  time: string
) => {
  trackEvent(GTM_EVENTS.WISHLIST_ADDED, {
    movie_title: movieTitle,
    theater,
    time,
  });
};

/**
 * 찜 제거 이벤트
 */
export const trackWishlistRemove = (
  movieTitle: string,
  theater: string,
  time: string
) => {
  trackEvent(GTM_EVENTS.WISHLIST_REMOVED, {
    movie_title: movieTitle,
    theater,
    time,
  });
};

/**
 * 찜 목록 전체 삭제 이벤트
 */
export const trackWishlistClear = (count: number) => {
  trackEvent(GTM_EVENTS.WISHLIST_CLEARED, {
    items_count: count,
  });
};

/**
 * 다크모드 토글 이벤트
 */
export const trackDarkModeToggle = (isDarkMode: boolean) => {
  trackEvent(GTM_EVENTS.DARK_MODE_TOGGLED, {
    mode: isDarkMode ? 'dark' : 'light',
  });
};
