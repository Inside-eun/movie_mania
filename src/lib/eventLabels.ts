/** GA4가 자동 수집하는 이벤트. 서비스 지표가 아니라 접어서 보여준다. */
const SYSTEM_EVENTS = new Set([
  "page_view",
  "session_start",
  "first_visit",
  "scroll",
  "user_engagement",
  "click",
]);

const EVENT_LABELS: Record<string, string> = {
  page_view: "페이지 조회",
  session_start: "세션 시작",
  first_visit: "첫 방문",
  scroll: "스크롤",
  user_engagement: "참여",
  click: "외부 링크 클릭",

  movie_detail_opened: "영화 상세 열람",
  movie_detail_load_time: "영화 상세 로딩",
  date_changed: "날짜 변경",
  search_clicked: "검색",
  engagement_time: "체류 시간",
  tab_changed: "탭 전환",
  sort_changed: "정렬 변경",

  wishlist_added: "찜 추가",
  wishlist_removed: "찜 해제",
  wishlist_cleared: "찜 전체 삭제",
  wishlist_view_mode_changed: "찜 보기 전환",

  booking_clicked: "예매 링크 클릭",
  movie_share_clicked: "영화 공유",
  recommendation_clicked: "추천작 클릭",
  quiz_banner_clicked: "퀴즈 배너 클릭",
  banner_indicator_clicked: "배너 인디케이터",

  event_list_item_clicked: "기획전 목록 클릭",
  event_movie_clicked: "기획전 영화 클릭",

  favorite_theater_saved: "영화관 즐겨찾기",
  favorite_group_filter_clicked: "즐겨찾기 그룹 필터",
  favorite_view_mode_changed: "즐겨찾기 보기 전환",
  theater_name_clicked: "영화관명 클릭",

  filter_opened: "필터 열기",
  filter_tab_changed: "필터 탭 전환",
  filter_reset: "필터 초기화",

  map_icon_clicked: "지도 열기",
  map_zoom_clicked: "지도 확대/축소",

  calendar_month_changed: "캘린더 월 이동",
  calendar_date_clicked: "캘린더 날짜 클릭",

  settings_section_toggled: "설정 항목 펼침",
  notifications_toggled: "알림 설정 변경",
  dark_mode_toggled: "다크모드 전환",

  notification_permission_result: "알림 권한 응답",
  notification_scheduled: "상영 알림 예약",
  notification_schedule_failed: "알림 예약 실패",
  notification_opened: "알림 열람",

  app_background: "앱 백그라운드",
  app_foreground: "앱 복귀",
  back_button_clicked: "뒤로가기",
  app_error: "앱 오류",
  api_load_failed: "API 로딩 실패",
};

const CHANNEL_LABELS: Record<string, string> = {
  Direct: "직접 방문",
  "Organic Search": "검색 유입",
  "Organic Social": "SNS 유입",
  "Organic Video": "동영상 유입",
  Referral: "외부 링크",
  Email: "이메일",
  "Paid Search": "검색 광고",
  "Paid Social": "SNS 광고",
  Unassigned: "미분류",
};

export function isSystemEvent(eventName: string): boolean {
  return SYSTEM_EVENTS.has(eventName);
}

export function eventLabel(eventName: string): string {
  return EVENT_LABELS[eventName] ?? eventName;
}

export function channelLabel(channel: string): string {
  return CHANNEL_LABELS[channel] ?? channel;
}

/** GA4 date 차원(YYYYMMDD)을 M/D로. */
export function formatDateLabel(yyyymmdd: string): string {
  return `${Number(yyyymmdd.slice(4, 6))}/${Number(yyyymmdd.slice(6, 8))}`;
}
