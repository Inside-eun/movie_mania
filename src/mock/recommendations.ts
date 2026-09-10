// 영화 상세 페이지 하단 "추천작" 섹션을 위한 규칙 기반 추천 로직.
// 우선순위: 기획전 그룹핑 → 같은 감독 → 같은 주연 배우 → 동일 극장 상영작 → 무작위.
// 후보 movies는 호출부에서 해당 날짜의 실제 상영 데이터를 넘겨받아 사용한다
// (포스터/시간이 실제 값이 되도록). 감독/배우 매칭은 TMDB 크레딧(title 기준)을 넘겨받아 사용한다.
import { MovieSchedule } from "@/types";
import { TMDBMovieCredits } from "@/services/tmdbApi";

import { mockEvents } from "./events";

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

export type CreditsByTitle = Record<string, TMDBMovieCredits | null | undefined>;

function toItems(movies: MovieSchedule[]): RecommendedItem[] {
  return movies.map((m) => ({
    title: m.title,
    theater: m.theater,
    time: m.time,
    posterUrl: m.tmdbPosterUrl || m.posterUrl,
    showing: true,
  }));
}

function uniqueByTitle(movies: MovieSchedule[]): MovieSchedule[] {
  return Array.from(new Map(movies.map((m) => [m.title, m])).values());
}

export function getRecommendations(
  movie: MovieSchedule,
  allMovies: MovieSchedule[],
  creditsByTitle: CreditsByTitle = {}
): RecommendationGroup {
  const others = allMovies.filter((m) => m.title !== movie.title);

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

  // 1순위: 같은 감독
  const movieDirector = creditsByTitle[movie.title]?.director;
  if (movieDirector) {
    const sameDirector = uniqueByTitle(
      others.filter((m) => creditsByTitle[m.title]?.director === movieDirector)
    ).slice(0, 6);

    if (sameDirector.length > 0) {
      return {
        reason: `"${movieDirector}" 감독의 다른 상영작`,
        items: toItems(sameDirector),
      };
    }
  }

  // 2순위: 같은 주연 배우 (겹치는 배우 중 가장 많이 매칭되는 배우 기준)
  const movieCast = creditsByTitle[movie.title]?.cast ?? [];
  if (movieCast.length > 0) {
    let bestActor: string | null = null;
    let bestMatches: MovieSchedule[] = [];

    for (const actor of movieCast) {
      const matches = uniqueByTitle(
        others.filter((m) => creditsByTitle[m.title]?.cast?.includes(actor))
      );
      if (matches.length > bestMatches.length) {
        bestActor = actor;
        bestMatches = matches;
      }
    }

    if (bestActor && bestMatches.length > 0) {
      return {
        reason: `"${bestActor}"가 출연한 다른 상영작`,
        items: toItems(bestMatches.slice(0, 6)),
      };
    }
  }

  // 3순위: 동일 극장 상영작
  const sameTheater = uniqueByTitle(
    others.filter((m) => m.theater === movie.theater)
  ).slice(0, 6);

  if (sameTheater.length > 0) {
    return {
      reason: `${movie.theater}의 다른 상영작`,
      items: toItems(sameTheater),
    };
  }

  // 4순위: 무작위 폴백
  const fallback = uniqueByTitle(others)
    .sort(() => 0.5 - Math.random())
    .slice(0, 6);

  return {
    reason: "함께 보면 좋은 작품",
    items: toItems(fallback),
  };
}
