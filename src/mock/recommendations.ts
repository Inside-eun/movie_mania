// 프로토타입 전용: 영화 상세 페이지 하단 "추천작" 섹션을 위한 목업 추천 로직.
// 실제 추천 알고리즘이 아니며, 기획전 그룹핑 → 동일 극장 상영작 → 무작위 순으로
// 화면에 채울 후보를 골라주는 규칙 기반 목업이다.
import { MovieSchedule } from "@/types";

import { mockEvents } from "./events";
import { getSnapshotMovies } from "./snapshot";

export interface RecommendedItem {
  title: string;
  theater?: string;
  time?: string;
  posterUrl?: string;
  showing: boolean;
}

export interface RecommendationGroup {
  reason: string;
  items: RecommendedItem[];
}

export function getRecommendations(movie: MovieSchedule): RecommendationGroup {
  const allMovies = getSnapshotMovies();

  const event = mockEvents.find((e) => e.movieTitles.includes(movie.title));
  if (event) {
    const siblingTitles = event.movieTitles.filter((t) => t !== movie.title);
    const items: RecommendedItem[] = siblingTitles.map((title) => {
      const match = allMovies.find((m) => m.title === title);
      return {
        title,
        theater: match?.theater ?? event.theaterName,
        time: match?.time,
        posterUrl: match?.tmdbPosterUrl || match?.posterUrl,
        showing: Boolean(match),
      };
    });
    return { reason: `"${event.title}" 기획전 추천작`, items };
  }

  const sameTheater = allMovies.filter(
    (m) => m.theater === movie.theater && m.title !== movie.title
  );
  const uniqueByTitle = Array.from(
    new Map(sameTheater.map((m) => [m.title, m])).values()
  ).slice(0, 6);

  if (uniqueByTitle.length > 0) {
    return {
      reason: `${movie.theater}의 다른 상영작`,
      items: uniqueByTitle.map((m) => ({
        title: m.title,
        theater: m.theater,
        time: m.time,
        posterUrl: m.tmdbPosterUrl || m.posterUrl,
        showing: true,
      })),
    };
  }

  const fallback = Array.from(
    new Map(
      allMovies.filter((m) => m.title !== movie.title).map((m) => [m.title, m])
    ).values()
  )
    .sort(() => 0.5 - Math.random())
    .slice(0, 6);

  return {
    reason: "함께 보면 좋은 작품",
    items: fallback.map((m) => ({
      title: m.title,
      theater: m.theater,
      time: m.time,
      posterUrl: m.tmdbPosterUrl || m.posterUrl,
      showing: true,
    })),
  };
}
