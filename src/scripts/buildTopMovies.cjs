/**
 * 프로토타입 /test 페이지 전용: 오늘 상영 스케줄과 무관하게 TMDB "평점 top" 목록에서
 * 상위 100편을 받아와 movieMeta.json에 합치고, 카탈로그에 추가로 노출할 제목 목록을
 * src/mock/topMovieTitles.json 으로 저장하는 빌드 스크립트.
 *
 * 실행: node src/scripts/buildTopMovies.cjs
 */
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const ROOT = path.join(__dirname, "..", "..");

function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";
const PAGE_COUNT = 5; // 20편 x 5페이지 = 100편

if (!TMDB_API_KEY) {
  console.error("TMDB_API_KEY가 설정되어 있지 않습니다.");
  process.exit(1);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchTopRatedPage(page) {
  const res = await axios.get(`${TMDB_BASE_URL}/movie/top_rated`, {
    params: { api_key: TMDB_API_KEY, language: "ko-KR", page },
    timeout: 8000,
  });
  return res.data?.results ?? [];
}

async function fetchMovieDetail(tmdbId) {
  try {
    const res = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
      params: { api_key: TMDB_API_KEY, language: "ko-KR", append_to_response: "credits" },
      timeout: 8000,
    });
    return res.data;
  } catch (e) {
    console.warn(`  상세 조회 실패: ${tmdbId}`, e.message);
    return null;
  }
}

async function main() {
  const metaPath = path.join(ROOT, "src/mock/movieMeta.json");
  const existingMeta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, "utf-8")) : {};

  let candidates = [];
  for (let page = 1; page <= PAGE_COUNT; page++) {
    const results = await fetchTopRatedPage(page);
    candidates = candidates.concat(results);
    await sleep(150);
  }
  console.log(`top_rated 후보 ${candidates.length}편 수집`);

  const topTitles = [];

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    process.stdout.write(`[${i + 1}/${candidates.length}] ${c.title} ... `);

    const detail = await fetchMovieDetail(c.id);
    await sleep(150);

    if (!detail) {
      console.log("상세 조회 실패, 건너뜀");
      continue;
    }

    const title = detail.title || c.title;
    const director = detail.credits?.crew?.find((cr) => cr.job === "Director")?.name ?? null;
    const cast = (detail.credits?.cast ?? []).slice(0, 5).map((cc) => cc.name);
    const genres = (detail.genres ?? []).map((g) => g.name);
    const releaseDate = detail.release_date || null;
    const year = releaseDate ? releaseDate.slice(0, 4) : null;
    const posterUrl = detail.poster_path ? `${TMDB_IMAGE_BASE_URL}/w342${detail.poster_path}` : null;

    existingMeta[title] = {
      tmdbId: detail.id,
      director,
      cast,
      genres,
      year,
      releaseDate,
      posterUrl,
      overview: detail.overview || null,
      voteAverage: detail.vote_average ?? null,
      popularity: detail.popularity ?? null,
    };
    topTitles.push(title);

    console.log(`OK (감독: ${director ?? "-"}, 평점: ${detail.vote_average ?? "-"})`);
  }

  fs.writeFileSync(metaPath, JSON.stringify(existingMeta, null, 2), "utf-8");
  const titlesPath = path.join(ROOT, "src/mock/topMovieTitles.json");
  fs.writeFileSync(titlesPath, JSON.stringify(topTitles, null, 2), "utf-8");

  console.log(`\n저장 완료: movieMeta.json (총 ${Object.keys(existingMeta).length}건), topMovieTitles.json (${topTitles.length}건)`);
}

main();
