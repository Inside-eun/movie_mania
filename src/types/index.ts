export interface Movie {
  id: string;
  title: string;
  theater: Theater;
  showtime: Date;
  isArtHouse: boolean;
  screenName?: string;  // 상영관명 (1관, 2관 등)
  ticketLink?: string;
}

export interface Theater {
  id: string;
  name: string;
  location: string;
  type: 'multiplex' | 'arthouse';
}

// 상영 스케줄 (크롤링 결과)
export interface MovieSchedule {
  title: string;
  theater: string;
  area: string;
  screen: string;
  time: string;
  showtime: string | Date;
  source?: string;
  movieCode?: string;
  director?: string;
  posterUrl?: string;
  prodYear?: string;
  runtime?: string;
  cActors?: string;
  cCodeSubName2?: string;
}

// API 응답 타입
export interface ScheduleResponse {
  success: boolean;
  count: number;
  data: MovieSchedule[];
  timestamp: string;
  error?: string;
}