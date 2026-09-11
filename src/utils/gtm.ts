/**
 * GA4 이벤트 추적 유틸리티 (gtag.js로 직접 전송, GTM 태그 설정 불필요)
 */

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: unknown[]) => void;
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

  // 하단 네비게이션 탭 전환
  TAB_CHANGED: 'tab_changed',

  // 찜 뷰(달력/리스트) 전환
  WISHLIST_VIEW_MODE_CHANGED: 'wishlist_view_mode_changed',

  // 추천작 클릭
  RECOMMENDATION_CLICKED: 'recommendation_clicked',

  // 뒤로가기 버튼
  BACK_BUTTON_CLICKED: 'back_button_clicked',

  // 영화관명 클릭
  THEATER_NAME_CLICKED: 'theater_name_clicked',

  // 지도(소요시간) 아이콘 클릭
  MAP_ICON_CLICKED: 'map_icon_clicked',

  // 필터 관련
  FILTER_OPENED: 'filter_opened',
  FILTER_TAB_CHANGED: 'filter_tab_changed',
  FILTER_RESET: 'filter_reset',
  FAVORITE_GROUP_FILTER_CLICKED: 'favorite_group_filter_clicked',

  // 설정 화면 관련
  SETTINGS_SECTION_TOGGLED: 'settings_section_toggled',
  FAVORITE_VIEW_MODE_CHANGED: 'favorite_view_mode_changed',

  // 기획전 관련
  EVENT_LIST_ITEM_CLICKED: 'event_list_item_clicked',
  EVENT_MOVIE_CLICKED: 'event_movie_clicked',

  // 배너 인디케이터 클릭
  BANNER_INDICATOR_CLICKED: 'banner_indicator_clicked',

  // 찜 목록 캘린더 관련
  CALENDAR_MONTH_CHANGED: 'calendar_month_changed',
  CALENDAR_DATE_CLICKED: 'calendar_date_clicked',

  // 지도 확대/축소
  MAP_ZOOM_CLICKED: 'map_zoom_clicked',
} as const;

interface GTMEventParams {
  [key: string]: string | number | boolean | undefined;
}

/**
 * GA4 이벤트 전송
 *
 * gtag.js를 통해 GA4로 바로 전송한다. GTM 태그/트리거 설정 없이도
 * 코드에서 새 이벤트를 추가하는 즉시 GA4로 파라미터가 자동으로 실린다.
 * (GTM에서 관리하는 마케팅 픽셀용 dataLayer는 건드리지 않는다.)
 */
export const trackEvent = (
  eventName: string,
  params?: GTMEventParams
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
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

/**
 * 하단 네비게이션 탭 전환 이벤트
 */
export const trackTabChanged = (tabName: 'home' | 'wishlist' | 'events' | 'settings') => {
  trackEvent(GTM_EVENTS.TAB_CHANGED, { tab_name: tabName });
};

/**
 * 찜 목록 뷰(달력/리스트) 전환 이벤트
 */
export const trackWishlistViewModeChanged = (viewMode: 'calendar' | 'list') => {
  trackEvent(GTM_EVENTS.WISHLIST_VIEW_MODE_CHANGED, { view_mode: viewMode });
};

/**
 * 추천작 클릭 이벤트
 */
export const trackRecommendationClicked = (movieTitle: string) => {
  trackEvent(GTM_EVENTS.RECOMMENDATION_CLICKED, { movie_title: movieTitle });
};

/**
 * 뒤로가기 버튼 클릭 이벤트
 */
export const trackBackButtonClicked = (page: string) => {
  trackEvent(GTM_EVENTS.BACK_BUTTON_CLICKED, { page });
};

/**
 * 영화관명 클릭 이벤트
 */
export const trackTheaterNameClicked = (theater: string) => {
  trackEvent(GTM_EVENTS.THEATER_NAME_CLICKED, { theater });
};

/**
 * 지도(소요시간) 아이콘 클릭 이벤트
 */
export const trackMapIconClicked = (theater: string) => {
  trackEvent(GTM_EVENTS.MAP_ICON_CLICKED, { theater });
};

/**
 * 필터 바텀시트 열기 이벤트
 */
export const trackFilterOpened = () => {
  trackEvent(GTM_EVENTS.FILTER_OPENED);
};

/**
 * 필터 탭(영화별/영화관별) 전환 이벤트
 */
export const trackFilterTabChanged = (tab: 'movie' | 'theater') => {
  trackEvent(GTM_EVENTS.FILTER_TAB_CHANGED, { tab });
};

/**
 * 필터 초기화 이벤트
 */
export const trackFilterReset = () => {
  trackEvent(GTM_EVENTS.FILTER_RESET);
};

/**
 * 즐겨찾기 영화관 그룹 필터 클릭 이벤트
 */
export const trackFavoriteGroupFilterClicked = (activated: boolean) => {
  trackEvent(GTM_EVENTS.FAVORITE_GROUP_FILTER_CLICKED, { activated });
};

/**
 * 설정 화면 아코디언 섹션 토글 이벤트
 */
export const trackSettingsSectionToggled = (section: string) => {
  trackEvent(GTM_EVENTS.SETTINGS_SECTION_TOGGLED, { section });
};

/**
 * 즐겨찾는 영화관 목록/지도 뷰 전환 이벤트
 */
export const trackFavoriteViewModeChanged = (viewMode: 'list' | 'map') => {
  trackEvent(GTM_EVENTS.FAVORITE_VIEW_MODE_CHANGED, { view_mode: viewMode });
};

/**
 * 기획전 목록에서 개별 기획전 클릭 이벤트
 */
export const trackEventListItemClicked = (eventTitle: string) => {
  trackEvent(GTM_EVENTS.EVENT_LIST_ITEM_CLICKED, { event_title: eventTitle });
};

/**
 * 기획전 상세 내 상영작 클릭 이벤트
 */
export const trackEventMovieClicked = (movieTitle: string, eventTitle: string) => {
  trackEvent(GTM_EVENTS.EVENT_MOVIE_CLICKED, {
    movie_title: movieTitle,
    event_title: eventTitle,
  });
};

/**
 * 배너 인디케이터(페이지네이션 점) 클릭 이벤트
 */
export const trackBannerIndicatorClicked = (bannerType: 'event' | 'news', index: number) => {
  trackEvent(GTM_EVENTS.BANNER_INDICATOR_CLICKED, { banner_type: bannerType, index });
};

/**
 * 찜 목록 캘린더 월 이동 이벤트
 */
export const trackCalendarMonthChanged = (direction: 'prev' | 'next') => {
  trackEvent(GTM_EVENTS.CALENDAR_MONTH_CHANGED, { direction });
};

/**
 * 찜 목록 캘린더 날짜 클릭 이벤트
 */
export const trackCalendarDateClicked = (movieCount: number) => {
  trackEvent(GTM_EVENTS.CALENDAR_DATE_CLICKED, { movie_count: movieCount });
};

/**
 * 지도 확대/축소 버튼 클릭 이벤트
 */
export const trackMapZoomClicked = (direction: 'in' | 'out') => {
  trackEvent(GTM_EVENTS.MAP_ZOOM_CLICKED, { direction });
};
