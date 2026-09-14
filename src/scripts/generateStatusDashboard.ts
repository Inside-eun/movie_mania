// 로컬 자동화(인스타그램 크롤링, CGV movNo 조회) + Vercel Cron(포스터/상영 스케줄
// 프리페치) 상태를 한 번에 점검해 .status-dashboard/index.html로 렌더링한다.
//
// 사용법:
//   npx tsx src/scripts/generateStatusDashboard.ts   (생성만)
//   npm run status:dashboard                          (생성 후 open까지, package.json 참고)
//
// launchd(com.moviemania.status-dashboard)로 매일 자동 재생성되며, 결과 파일은
// 이 컴퓨터 로컬에만 존재한다(외부 배포/호스팅 없음).

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { Redis } from "@upstash/redis";
import { instagramScanTargets } from "./instagramTargets";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const OUT_DIR = path.resolve(process.cwd(), ".status-dashboard");
const OUT_FILE = path.join(OUT_DIR, "index.html");

function todayKST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

function addDaysKST(base: string, days: number): string {
  const d = new Date(`${base}T00:00:00+09:00`);
  d.setDate(d.getDate() + days);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(d);
}

function nowKSTString(): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
}

function fmtMtime(p: string): string | null {
  if (!fs.existsSync(p)) return null;
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(fs.statSync(p).mtime);
}

function safeExec(cmd: string): string {
  try {
    return execSync(cmd, { cwd: process.cwd(), encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

type RunOutcome = { ok: boolean | null; detail: string };

// 로그 파일 전체에서 "마지막으로 등장한" 성공/실패 마커를 비교해 최신 실행 결과를 판단한다.
// (로그가 여러 번의 실행을 이어붙인 형태라 실행 경계를 정확히 못 나눠도, 파일 맨 끝의
//  상태만 보면 되므로 이 방식이 더 견고하다.)
// 실행 종료 판정용 패턴(크래시 트레일러 포함)과, 사람이 읽을 에러 메시지용 패턴을
// 분리한다 — 안 그러면 스택트레이스 맨 끝의 "Node.js v22.23.2" 같은 줄이 실제 에러
// 메시지("TimeoutError: ...")를 덮어써버린다.
function lastRunStatus(
  content: string,
  successPattern: RegExp,
  failureBoundaryPatterns: RegExp[],
  failureMessagePatterns: RegExp[] = failureBoundaryPatterns
): RunOutcome {
  const lines = content.split("\n");
  let lastSuccessIdx = -1;
  let successDetail = "";
  let lastFailureIdx = -1;
  let failureDetail = "";

  lines.forEach((line, idx) => {
    const sm = line.match(successPattern);
    if (sm) {
      lastSuccessIdx = idx;
      successDetail = (sm[1] ?? sm[0]).trim();
    }
    if (failureBoundaryPatterns.some((fp) => fp.test(line))) {
      lastFailureIdx = idx;
    }
    if (failureMessagePatterns.some((fp) => fp.test(line))) {
      failureDetail = line.trim();
    }
  });

  if (lastFailureIdx > lastSuccessIdx) return { ok: false, detail: failureDetail || "(에러 메시지를 찾지 못함)" };
  if (lastSuccessIdx >= 0) return { ok: true, detail: successDetail };
  return { ok: null, detail: "로그에서 완료/실패 마커를 찾지 못함" };
}

const FAILURE_BOUNDARY_PATTERNS = [/Error:/, /TimeoutError/, /^스캔 실패:/, /^❌/, /^Node\.js v\d/];
const FAILURE_MESSAGE_PATTERNS = [/Error:/, /TimeoutError/, /^스캔 실패:/, /^❌/];

interface CardData {
  title: string;
  status: "ok" | "fail" | "unknown";
  lastRun: string | null;
  lines: string[];
}

function checkCgvMovNo(): CardData {
  const logPath = path.resolve(process.cwd(), ".cgv-movno/log.txt");
  const lines: string[] = [];

  if (!fs.existsSync(logPath)) {
    return { title: "예매 코드 조회 (CGV movNo)", status: "unknown", lastRun: null, lines: ["로그 파일 없음"] };
  }

  const content = fs.readFileSync(logPath, "utf-8");
  const lastRun = fmtMtime(logPath);

  const dateMatches = [...content.matchAll(/^(\d{4}-\d{2}-\d{2}) 기준 CGV 상영작 조회 중/gm)];
  const targetDate = dateMatches.length > 0 ? dateMatches[dateMatches.length - 1][1] : null;

  const outcome = lastRunStatus(content, /✅ 완료: (.+)/, FAILURE_BOUNDARY_PATTERNS, FAILURE_MESSAGE_PATTERNS);

  if (targetDate) lines.push(`조회 대상 날짜(로그 기준): ${targetDate}`);
  const today = todayKST();
  if (targetDate && targetDate !== today) {
    lines.push(`⚠️ 오늘(${today})과 다름 — 06:00 실행 시 날짜가 하루 밀리는 버그 의심`);
  }

  if (outcome.ok === true) {
    lines.push(`마지막 실행 결과: ${outcome.detail}`);
  } else if (outcome.ok === false) {
    lines.push(`⚠️ 마지막 실행 에러: ${outcome.detail}`);
  } else {
    lines.push(outcome.detail);
  }

  // cgvMovNoCache.json은 정적 import라 배포(main에 push)해야만 프로덕션에 반영된다.
  // batchFetchCgvMovNo.ts가 매 실행 끝에 git plumbing으로 origin/main에 직접
  // push하므로(로컬 체크아웃 브랜치는 안 건드림), 로컬 git 상태가 아니라 로그에 남는
  // 배포 결과 줄로 판단해야 한다. 세 가지 결말(완료/스킵/실패) 중 로그에서 가장
  // 나중에 등장한 줄을 최신 상태로 본다.
  const deployLines = content
    .split("\n")
    .filter((l) => /자동 배포 완료|배포 스킵|자동 배포 실패/.test(l));
  const lastDeployLine = deployLines[deployLines.length - 1];
  if (!lastDeployLine) {
    lines.push("⚠️ 배포 로그를 찾지 못함 — 구버전 스크립트로 실행됐을 수 있음");
  } else if (/자동 배포 실패/.test(lastDeployLine)) {
    lines.push(`⚠️ ${lastDeployLine.trim()}`);
  } else {
    lines.push(lastDeployLine.trim());
  }

  const launchctlOut = safeExec("launchctl list | grep com.moviemania.cgv-movno");
  lines.push(launchctlOut ? "launchd 작업 등록됨 (매일 06:00)" : "⚠️ launchd 작업이 등록되어 있지 않음");

  const deployFailed = !!lastDeployLine && /자동 배포 실패/.test(lastDeployLine);
  const status: CardData["status"] =
    outcome.ok === false || deployFailed ? "fail" : outcome.ok === true ? "ok" : "unknown";
  return { title: "예매 코드 조회 (CGV movNo)", status, lastRun, lines };
}

function checkInstagramScan(): CardData {
  const logPath = path.resolve(process.cwd(), ".instagram-scan/log.txt");
  const lines: string[] = [];

  if (!fs.existsSync(logPath)) {
    return { title: "인스타그램 기획전 크롤링", status: "unknown", lastRun: null, lines: ["로그 파일 없음"] };
  }

  const content = fs.readFileSync(logPath, "utf-8");
  const lastRun = fmtMtime(logPath);

  const outcome = lastRunStatus(content, /=== 스캔 완료: (.+?) ===/, FAILURE_BOUNDARY_PATTERNS, FAILURE_MESSAGE_PATTERNS);

  lines.push(`대상 계정 수: 총 ${instagramScanTargets.length}개`);
  if (outcome.ok === true) {
    lines.push(`마지막 실행 결과: ${outcome.detail}`);
  } else if (outcome.ok === false) {
    lines.push(`⚠️ 마지막 실행 실패: ${outcome.detail}`);
    lines.push("계정 스캔 도중 중단됐을 수 있음 — 로그 전체를 확인해 어느 계정까지 처리됐는지 확인 필요");
  } else {
    lines.push(outcome.detail);
  }

  const launchctlOut = safeExec("launchctl list | grep com.moviemania.instagram-scan");
  lines.push(launchctlOut ? "launchd 작업 등록됨 (매주 월요일 07:30)" : "⚠️ launchd 작업이 등록되어 있지 않음");

  const status: CardData["status"] = outcome.ok === false ? "fail" : outcome.ok === true ? "ok" : "unknown";
  return { title: "인스타그램 기획전 크롤링", status, lastRun, lines };
}

async function checkPrefetchCron(): Promise<CardData> {
  const lines: string[] = [];
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return {
      title: "포스터 · 상영 스케줄 조회 (Vercel Cron)",
      status: "unknown",
      lastRun: null,
      lines: ["UPSTASH_REDIS_REST_URL/TOKEN이 .env.local에 없어 확인 불가"],
    };
  }

  const redis = new Redis({ url, token });
  const today = todayKST();
  const expectedDates = Array.from({ length: 7 }, (_, i) => addDaysKST(today, i));

  let missing: string[] = [];
  let totalScheduleItems = 0;
  try {
    for (const date of expectedDates) {
      const dateStr = date.replace(/-/g, "");
      const [integrated, artCinemas] = await Promise.all([
        redis.get<unknown[]>(`integrated_${dateStr}_`),
        redis.get<unknown[]>(`art_cinemas_${dateStr}_`),
      ]);
      if (integrated === null && artCinemas === null) {
        missing.push(date);
      } else {
        totalScheduleItems += (integrated?.length ?? 0);
      }
    }

    if (missing.length === 0) {
      lines.push(`오늘부터 7일치 상영 스케줄 캐시 정상 적재 (오늘 상영 ${totalScheduleItems}건)`);
    } else {
      lines.push(`⚠️ 캐시 누락된 날짜: ${missing.join(", ")}`);
    }

    const tmdbDb = await redis.get<Record<string, unknown>>("tmdb_db");
    const movieCount = tmdbDb ? Object.keys(tmdbDb).length : 0;
    lines.push(`TMDB 포스터 DB: ${movieCount}편 저장됨`);

    const status: CardData["status"] = missing.length > 0 ? "fail" : movieCount > 0 ? "ok" : "unknown";
    return {
      title: "포스터 · 상영 스케줄 조회 (Vercel Cron)",
      status,
      lastRun: `${nowKSTString()} 기준 확인 (Redis 직접 조회, 클라우드 실행이라 노트북 상태 무관)`,
      lines,
    };
  } catch (e) {
    return {
      title: "포스터 · 상영 스케줄 조회 (Vercel Cron)",
      status: "unknown",
      lastRun: null,
      lines: [`Redis 조회 실패: ${e instanceof Error ? e.message : String(e)}`],
    };
  }
}

function renderCard(card: CardData): string {
  const badge =
    card.status === "ok" ? `<span class="badge ok">정상</span>` :
    card.status === "fail" ? `<span class="badge fail">문제 있음</span>` :
    `<span class="badge unknown">확인 불가</span>`;

  return `
  <section class="card ${card.status}">
    <div class="card-head">
      <h2>${escapeHtml(card.title)}</h2>
      ${badge}
    </div>
    <div class="last-run">${card.lastRun ? escapeHtml(card.lastRun) : "실행 기록 없음"}</div>
    <ul class="detail-list">
      ${card.lines.map((l) => `<li class="${l.startsWith("⚠️") ? "warn" : ""}">${escapeHtml(l)}</li>`).join("\n      ")}
    </ul>
  </section>`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const cards = [checkCgvMovNo(), checkInstagramScan(), await checkPrefetchCron()];

  const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<title>Movie Mania 자동화 상태</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  :root {
    color-scheme: light dark;
    --bg: #f7f7f8;
    --card-bg: #ffffff;
    --text: #1a1a1a;
    --muted: #6b7280;
    --border: #e5e7eb;
    --ok: #16a34a;
    --ok-bg: #f0fdf4;
    --fail: #dc2626;
    --fail-bg: #fef2f2;
    --unknown: #d97706;
    --unknown-bg: #fffbeb;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0f1115;
      --card-bg: #1a1d24;
      --text: #e5e7eb;
      --muted: #9ca3af;
      --border: #2a2e37;
      --ok-bg: #052e16;
      --fail-bg: #2c0a0a;
      --unknown-bg: #2a1c04;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif;
    padding: 32px 20px 60px;
  }
  .wrap { max-width: 720px; margin: 0 auto; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .generated { color: var(--muted); font-size: 13px; margin-bottom: 28px; }
  .card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 18px 20px;
    margin-bottom: 16px;
  }
  .card-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .card-head h2 { font-size: 15px; margin: 0; }
  .badge { font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 999px; white-space: nowrap; }
  .badge.ok { color: var(--ok); background: var(--ok-bg); }
  .badge.fail { color: var(--fail); background: var(--fail-bg); }
  .badge.unknown { color: var(--unknown); background: var(--unknown-bg); }
  .last-run { color: var(--muted); font-size: 12.5px; margin: 6px 0 12px; }
  .detail-list { margin: 0; padding-left: 18px; font-size: 13.5px; line-height: 1.7; }
  .detail-list li.warn { color: var(--fail); }
  footer { color: var(--muted); font-size: 12px; margin-top: 24px; text-align: center; }
</style>
</head>
<body>
  <div class="wrap">
    <h1>Movie Mania 자동화 상태</h1>
    <div class="generated">생성 시각: ${escapeHtml(nowKSTString())} (KST) · 이 파일은 로컬에만 존재합니다</div>
    ${cards.map(renderCard).join("\n")}
    <footer>npx tsx src/scripts/generateStatusDashboard.ts 로 언제든 재생성 가능 · launchd로 매일 자동 갱신됨</footer>
  </div>
</body>
</html>`;

  fs.writeFileSync(OUT_FILE, html, "utf-8");
  console.log(`대시보드 생성 완료: ${OUT_FILE}`);
}

main();
