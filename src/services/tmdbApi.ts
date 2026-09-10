import axios from "axios";

export interface TMDBMovieResult {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number;
}

interface TMDBSearchResponse {
  page: number;
  results: TMDBMovieResult[];
  total_results: number;
  total_pages: number;
}

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export function getTMDBImageUrl(
  path: string | null | undefined,
  size: "w185" | "w342" | "w500" | "original" = "w342",
): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
}

export interface TMDBMovieCredits {
  director: string | null;
  cast: string[];
  posterUrl: string | null;
  overview: string | null;
  releaseDate: string | null;
}

interface TMDBCreditsResponse {
  cast: Array<{ name: string; order: number }>;
  crew: Array<{ name: string; job: string }>;
}

/** 제목으로 TMDB에서 검색 후 감독/출연진(상위 5명)·포스터·줄거리·개봉일을 조회한다. 매칭 실패 시 null. */
export async function getMovieCredits(title: string): Promise<TMDBMovieCredits | null> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return null;

  const movie = await searchMovieByTitle(title);
  if (!movie) return null;

  try {
    const response = await axios.get<TMDBCreditsResponse>(
      `${TMDB_BASE_URL}/movie/${movie.id}/credits`,
      {
        params: { api_key: apiKey, language: "ko-KR" },
        timeout: 8000,
        headers: { Accept: "application/json" },
      },
    );

    const director = response.data.crew?.find((c) => c.job === "Director")?.name ?? null;
    const cast = (response.data.cast ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .slice(0, 5)
      .map((c) => c.name);

    return {
      director,
      cast,
      posterUrl: getTMDBImageUrl(movie.poster_path, "w342"),
      overview: movie.overview || null,
      releaseDate: movie.release_date || null,
    };
  } catch (error) {
    console.error("TMDB 크레딧 조회 실패:", error);
    return null;
  }
}

export async function searchMovieByTitle(
  title: string,
): Promise<TMDBMovieResult | null> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    console.warn("TMDB_API_KEY 환경 변수가 설정되지 않았습니다.");
    return null;
  }

  try {
    const response = await axios.get<TMDBSearchResponse>(
      `${TMDB_BASE_URL}/search/movie`,
      {
        params: {
          api_key: apiKey,
          query: title,
          language: "ko-KR",
          include_adult: false,
        },
        timeout: 8000,
        headers: {
          Accept: "application/json",
        },
      },
    );

    const results = response.data?.results ?? [];
    if (!results.length) {
      return null;
    }

    // 일단 첫 번째 결과를 사용
    return results[0];
  } catch (error) {
    console.error("TMDB 검색 실패:", error);
    return null;
  }
}

