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

  // 정렬 관련
  SORT_CHANGED: 'sort_changed',

  // 영화 상세 관련
  MOVIE_DETAIL_OPENED: 'movie_detail_opened',
  MOVIE_DETAIL_LOAD_TIME: 'movie_detail_load_time',

  // 예매 관련
  BOOKING_CLICKED: 'booking_clicked',

  // 배너 관련
  QUIZ_BANNER_CLICKED: 'quiz_banner_clicked',

  // 영화관 즐겨찾기 관련
  FAVORITE_THEATER_SAVED: 'favorite_theater_saved',

  // 체류 시간 관련
  ENGAGEMENT_TIME: 'engagement_time',
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

/**
 * 정렬 변경 이벤트
 */
export const trackSortChanged = (sortType: 'time' | 'distance') => {
  trackEvent(GTM_EVENTS.SORT_CHANGED, { sort_type: sortType });
};

/**
 * 영화 상세 오픈 이벤트
 */
export const trackMovieDetailOpened = (movieTitle: string, theater: string) => {
  trackEvent(GTM_EVENTS.MOVIE_DETAIL_OPENED, {
    movie_title: movieTitle,
    theater,
  });
};

/**
 * 영화 상세 API 로딩 완료 이벤트 (대기 시간 ms)
 */
export const trackMovieDetailLoadTime = (
  movieTitle: string,
  loadTimeMs: number
) => {
  trackEvent(GTM_EVENTS.MOVIE_DETAIL_LOAD_TIME, {
    movie_title: movieTitle,
    load_time_ms: loadTimeMs,
  });
};

/**
 * 예매/극장 바로가기 클릭 이벤트
 */
export const trackBookingClicked = (
  movieTitle: string,
  theater: string,
  isFallback: boolean
) => {
  trackEvent(GTM_EVENTS.BOOKING_CLICKED, {
    movie_title: movieTitle,
    theater,
    button_type: isFallback ? 'theater_link' : 'booking',
  });
};

/**
 * 퀴즈 배너 클릭 이벤트
 */
export const trackQuizBannerClicked = () => {
  trackEvent(GTM_EVENTS.QUIZ_BANNER_CLICKED);
};

/**
 * 영화관 즐겨찾기 저장 이벤트
 */
export const trackFavoriteTheaterSaved = (theaterCount: number) => {
  trackEvent(GTM_EVENTS.FAVORITE_THEATER_SAVED, {
    theater_count: theaterCount,
  });
};

/**
 * 체류 시간 이벤트 (초 단위)
 */
export const trackEngagementTime = (durationSec: number) => {
  trackEvent(GTM_EVENTS.ENGAGEMENT_TIME, {
    duration_sec: durationSec,
  });
};
