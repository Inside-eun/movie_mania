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