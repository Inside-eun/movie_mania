/**
 * 프로토타입 /test 페이지 전용: "같은 감독/장르/배우/개봉년도" 추천 알고리즘에
 * 쓸 영화 메타데이터(감독/장르/출연진/개봉년도)를 TMDB에서 받아와
 * src/mock/movieMeta.json 으로 저장하는 일회성 빌드 스크립트.
 *
 * 실행: node src/scripts/buildMovieMeta.js
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

if (!TMDB_API_KEY) {
  console.error("TMDB_API_KEY가 설정되어 있지 않습니다.");
  process.exit(1);
}

const snapshot = require(path.join(ROOT, "src/mock/movies-snapshot.json"));
const tmdbDb = require(path.join(ROOT, ".cache/tmdb_db.json"));

const uniqueTitles = Array.from(new Set(snapshot.data.map((m) => m.title)));

async function searchMovieId(title) {
  try {
    const res = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: { api_key: TMDB_API_KEY, query: title, language: "ko-KR", include_adult: false },
      timeout: 8000,
    });
    const results = res.data?.results ?? [];
    return results.length ? results[0].id : null;
  } catch (e) {
    console.warn(`  검색 실패: ${title}`, e.message);
    return null;
  }
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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const result = {};
  let idx = 0;

  for (const title of uniqueTitles) {
    idx += 1;
    process.stdout.write(`[${idx}/${uniqueTitles.length}] ${title} ... `);

    let tmdbId = tmdbDb[title]?.tmdbId ?? null;
    if (!tmdbId) {
      tmdbId = await searchMovieId(title);
      await sleep(150);
    }

    if (!tmdbId) {
      console.log("TMDB 매칭 없음");
      continue;
    }

    const detail = await fetchMovieDetail(tmdbId);
    await sleep(150);

    if (!detail) {
      console.log("상세 조회 실패");
      continue;
    }

    const director =
      detail.credits?.crew?.find((c) => c.job === "Director")?.name ?? null;
    const cast = (detail.credits?.cast ?? []).slice(0, 5).map((c) => c.name);
    const genres = (detail.genres ?? []).map((g) => g.name);
    const releaseDate = detail.release_date || tmdbDb[title]?.releaseDate || null;
    const year = releaseDate ? releaseDate.slice(0, 4) : null;
    const posterUrl = detail.poster_path
      ? `${TMDB_IMAGE_BASE_URL}/w342${detail.poster_path}`
      : tmdbDb[title]?.posterUrl ?? null;

    result[title] = {
      tmdbId,
      director,
      cast,
      genres,
      year,
      releaseDate,
      posterUrl,
      overview: detail.overview || tmdbDb[title]?.overview || null,
      voteAverage: detail.vote_average ?? tmdbDb[title]?.voteAverage ?? null,
    };

    console.log(`OK (감독: ${director ?? "-"}, 장르: ${genres.join("/") || "-"}, 연도: ${year ?? "-"})`);
  }

  const outPath = path.join(ROOT, "src/mock/movieMeta.json");
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), "utf-8");
  console.log(`\n저장 완료: ${outPath} (${Object.keys(result).length}/${uniqueTitles.length}건)`);
}

main();
