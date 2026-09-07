// 인스타그램 기획전 스캔 스크립트.
//
// 지정된 극장 인스타그램 계정을 돌면서 새 게시물 중 "기획전"/"특별전" 키워드가
// 포함된 캡션을 찾아 정규식 기반으로 제목/기간/상영작을 뽑아
// .instagram-scan/review-<날짜>.json 에 검토용으로 저장한다.
//
// 실행: npm run scan:instagram
// 최초 1회는 로그인 챌린지를 직접 통과해야 하므로 headless 모드를 꺼서 실행할 것:
//   IG_SCRAPER_HEADLESS=false npm run scan:instagram
//
// 주의: 인스타그램 마크업은 예고 없이 바뀐다. 이 스크립트의 셀렉터가 깨지면
// 아래 SELECTORS 상수 위주로 다시 확인해서 고칠 것.
// 정규식 파서는 계정마다 캡션 포맷이 다르면 놓치거나 잘못 뽑을 수 있다 —
// review 파일을 항상 눈으로 확인하고 src/mock/events.ts에는 검수 후 반영할 것.

import "dotenv/config";
import fs from "fs";
import path from "path";
import puppeteer, { Browser, Page, Cookie } from "puppeteer";

import { instagramScanTargets } from "./instagramTargets";

const STATE_DIR = path.join(process.cwd(), ".instagram-scan");
const SESSION_FILE = path.join(STATE_DIR, "session.json");
const SEEN_POSTS_FILE = path.join(STATE_DIR, "seen-posts.json");

const HEADLESS = process.env.IG_SCRAPER_HEADLESS !== "false";
// 주 1회 스캔이라 한 번에 최대 40개까지 확인 (게시물이 잦은 계정도 일주일치를 놓치지 않도록).
const MAX_POSTS_PER_ACCOUNT = 40;
const EVENT_KEYWORDS = ["기획전", "특별전"];
// "#라이카기획전", "#모모기획전"처럼 해시태그에 붙어 나오는 경우도 일반 텍스트와
// 동일하게 매칭되어야 한다. includes()는 "#라이카기획전" 안의 "기획전"도 부분
// 문자열로 잡아내므로 해시태그 여부와 무관하게 이미 매칭되지만, 의도를 명확히
// 하기 위해 전용 헬퍼로 통일해서 쓴다.
function containsEventKeyword(text: string): boolean {
  return EVENT_KEYWORDS.some((kw) => text.includes(kw));
}
// 페이지 이동마다 최소 이만큼 쉰다. 계정 수가 많아질수록(현재 14개) 쉬지 않고
// 연달아 요청하면 자동화로 감지될 위험이 커서 사람이 넘기듯 랜덤 텀을 둔다.
const MIN_REQUEST_DELAY_MS = 1500;
const MAX_REQUEST_DELAY_MS = 4000;
// "[썸머 비트를 타고] 기획전 종료와 ..." 처럼 이미 끝난 기획전을 회고하는 게시물은
// 새 기획전 공지가 아니므로 제외한다.
const ENDED_EVENT_PATTERN = /(기획전|특별전)\s*종료|종료.{0,6}(기획전|특별전)/;

// 인스타그램 마크업이 바뀌면 여기부터 확인.
const SELECTORS = {
  loginUsername: 'input[name="username"]',
  loginPassword: 'input[name="password"]',
  loginSubmit: 'button[type="submit"]',
  postLink: 'main a[href*="/p/"], main a[href*="/reel/"]',
  captionMeta: 'meta[property="og:description"]',
};

type SeenPostsState = Record<string, string>; // username -> 마지막으로 처리한 post shortcode

interface CandidatePost {
  username: string;
  theaterName: string;
  shortcode: string;
  postUrl: string;
  caption: string;
}

interface ExtractedEvent {
  title: string;
  period: string;
  movieTitles: string[];
}

interface ReviewEntry {
  theaterName: string;
  postUrl: string;
  title: string;
  period: string;
  movieTitles: string[];
  rawCaption: string;
}

function ensureStateDir() {
  fs.mkdirSync(STATE_DIR, { recursive: true });
}

function loadJSON<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function saveJSON(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function extractShortcode(href: string): string | null {
  const match = href.match(/\/(p|reel)\/([^/]+)\//);
  return match ? match[2] : null;
}

function randomDelay(): Promise<void> {
  const ms = MIN_REQUEST_DELAY_MS + Math.random() * (MAX_REQUEST_DELAY_MS - MIN_REQUEST_DELAY_MS);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isLoggedIn(page: Page): Promise<boolean> {
  const url = page.url();
  if (url.includes("/accounts/login")) return false;
  const usernameInput = await page.$(SELECTORS.loginUsername);
  return usernameInput === null;
}

async function loginWithCredentials(page: Page): Promise<void> {
  const username = process.env.IG_SCRAPER_USERNAME;
  const password = process.env.IG_SCRAPER_PASSWORD;
  if (!username || !password) {
    throw new Error(
      "IG_SCRAPER_USERNAME / IG_SCRAPER_PASSWORD가 .env.local에 설정되어 있지 않습니다."
    );
  }

  await page.goto("https://www.instagram.com/accounts/login/", { waitUntil: "networkidle2" });
  await page.waitForSelector(SELECTORS.loginUsername, { timeout: 15000 });
  await page.type(SELECTORS.loginUsername, username, { delay: 30 });
  await page.type(SELECTORS.loginPassword, password, { delay: 30 });
  await Promise.all([
    page.click(SELECTORS.loginSubmit),
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {
      // 챌린지(2단계 인증 등) 화면으로 전환되면 navigation이 안 잡힐 수 있음 — 아래에서 별도 확인.
    }),
  ]);

  const loggedIn = await isLoggedIn(page);
  if (!loggedIn) {
    throw new Error(
      "로그인이 완료되지 않았습니다. 2단계 인증/사람 확인 챌린지가 떴을 가능성이 높습니다. " +
        "IG_SCRAPER_HEADLESS=false 로 실행해서 브라우저 창에서 직접 챌린지를 통과한 뒤 다시 시도하세요."
    );
  }

  // "로그인 정보 저장" / "알림 켜기" 팝업은 있으면 넘기고, 없으면 무시.
  await dismissDialogIfPresent(page, "저장");
  await dismissDialogIfPresent(page, "나중에");
}

async function dismissDialogIfPresent(page: Page, buttonTextHint: string) {
  try {
    const buttons = await page.$$("button");
    for (const button of buttons) {
      const text = await page.evaluate((el) => el.textContent ?? "", button);
      if (text.includes(buttonTextHint)) {
        await button.click();
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return;
      }
    }
  } catch {
    // 팝업이 없으면 그냥 지나간다.
  }
}

async function ensureSession(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const savedCookies = loadJSON<Cookie[] | null>(SESSION_FILE, null);
  if (savedCookies) {
    await page.setCookie(...savedCookies);
  }

  await page.goto("https://www.instagram.com/", { waitUntil: "networkidle2" });

  if (!(await isLoggedIn(page))) {
    console.log("세션이 없거나 만료됨 — 로그인 시도 중...");
    await loginWithCredentials(page);
  } else {
    console.log("기존 세션으로 로그인 확인됨.");
  }

  const cookies = await page.cookies();
  saveJSON(SESSION_FILE, cookies);

  return page;
}

async function collectRecentPostUrls(page: Page, username: string): Promise<string[]> {
  await randomDelay();
  await page.goto(`https://www.instagram.com/${username}/`, { waitUntil: "networkidle2" });
  await page.waitForSelector(SELECTORS.postLink, { timeout: 15000 }).catch(() => null);

  const hrefs = await page.$$eval(SELECTORS.postLink, (anchors) =>
    anchors.map((a) => (a as HTMLAnchorElement).href)
  );

  const uniqueOrdered: string[] = [];
  const seen = new Set<string>();
  for (const href of hrefs) {
    if (!seen.has(href)) {
      seen.add(href);
      uniqueOrdered.push(href);
    }
  }
  return uniqueOrdered;
}

// og:description은 보통 `"167 likes, 5 comments - username - August 27, 2026: "실제 캡션". "`
// 형태로 감싸져 온다. 이 래퍼를 벗겨내고 실제 캡션만 남긴다.
function stripOgWrapper(text: string): string {
  const wrapped = text.match(/^\d[\d,]*\s*likes?,\s*\d[\d,]*\s*comments?\s*-\s*.+?:\s*[“"]([\s\S]*)[”"]\.\s*$/i);
  return wrapped ? wrapped[1] : text;
}

async function fetchCaption(page: Page, postUrl: string): Promise<string> {
  await randomDelay();
  await page.goto(postUrl, { waitUntil: "networkidle2" });
  const metaContent = await page
    .$eval(SELECTORS.captionMeta, (el) => el.getAttribute("content") ?? "")
    .catch(() => "");
  if (metaContent) return stripOgWrapper(metaContent);

  // og:description이 비어있으면 본문 article에서 첫 텍스트 블록을 시도.
  const fallback = await page
    .$eval("article", (el) => el.textContent ?? "")
    .catch(() => "");
  return fallback;
}

async function scanAccount(
  page: Page,
  target: { username: string; theaterName: string },
  seenState: SeenPostsState
): Promise<CandidatePost[]> {
  console.log(`\n[${target.theaterName}] @${target.username} 스캔 중...`);
  const postUrls = await collectRecentPostUrls(page, target.username);
  const lastSeen = seenState[target.username];

  const newUrls: string[] = [];
  for (const url of postUrls) {
    const shortcode = extractShortcode(url);
    if (!shortcode) continue;
    if (shortcode === lastSeen) break; // 이전에 처리한 지점까지 왔으면 중단
    newUrls.push(url);
    if (newUrls.length >= MAX_POSTS_PER_ACCOUNT) break;
  }

  console.log(`  새 게시물 ${newUrls.length}개 발견 (전체 ${postUrls.length}개 중)`);

  const candidates: CandidatePost[] = [];
  for (const url of newUrls) {
    const shortcode = extractShortcode(url)!;
    const caption = await fetchCaption(page, url);
    const hasKeyword = containsEventKeyword(caption);
    const alreadyEnded = ENDED_EVENT_PATTERN.test(caption);
    if (hasKeyword && alreadyEnded) {
      console.log(`  · 종료된 기획전 언급으로 제외: ${url}`);
    } else if (hasKeyword) {
      console.log(`  ✓ 키워드 매칭: ${url}`);
      candidates.push({
        username: target.username,
        theaterName: target.theaterName,
        shortcode,
        postUrl: url,
        caption,
      });
    }
  }

  // 이번 실행에서 가장 최신 게시물(목록의 첫 항목)을 다음 실행의 기준점으로 저장.
  const newestShortcode = postUrls.length > 0 ? extractShortcode(postUrls[0]) : null;
  if (newestShortcode) {
    seenState[target.username] = newestShortcode;
  }

  return candidates;
}

// 기간처럼 보이는 텍스트 패턴들. 위에서부터 먼저 매칭되는 걸 채택한다.
const PERIOD_PATTERNS = [
  // 2026.07.18 - 2026.08.02 / 2026. 09. 16 - 10. 04 (두 번째 연도 생략 가능)
  /\d{4}\.\s?\d{1,2}\.\s?\d{1,2}\s*[-~]\s*(?:\d{4}\.\s?)?\d{1,2}\.\s?\d{1,2}/,
  // 2026년 8월 12일(수) ~ 2026년 8월 30일(일) — 요일 괄호는 있어도 없어도 매칭
  /\d{4}년\s*\d{1,2}월\s*\d{1,2}일(?:\([^)]*\))?\s*[-~]\s*\d{4}년\s*\d{1,2}월\s*\d{1,2}일(?:\([^)]*\))?/,
  /\d{1,2}\/\d{1,2}\s*[-~]\s*\d{1,2}\/\d{1,2}/, // 7/18 - 8/2
  /\d{4}\.\d{1,2}\s*[-~]\s*\d{1,2}(?!\.\d)/, // 2026.8 - 9 (월 단위)
];

// 상영작 목록이 시작되는 지점을 찾기 위한 헤더 키워드.
const MOVIE_LIST_HEADER = /상영작|상영\s*라인업|프로그램/;
const BULLET_PREFIX = /^[·\-•▪]\s*/;

function cleanTitleLine(line: string): string {
  return line
    .replace(/#\S+/g, "") // 해시태그 제거 (줄 중간에 섞여 있어도 제거)
    .replace(/^[·\-•]+\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(caption: string): string {
  const lines = caption
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const keywordIdx = lines.findIndex((line) => containsEventKeyword(line));

  if (keywordIdx >= 0) {
    const cleaned = cleanTitleLine(lines[keywordIdx]);
    if (cleaned.length >= 5) return cleaned;

    // "#라이카기획전"처럼 해시태그 위주라 정리하고 나면 키워드만 남는 경우,
    // 이어지는 몇 줄 중 키워드가 다시 나오는 "정식 제목" 줄을 우선 찾는다
    // (예: "영원한 빛, 위대한 문장" 다음 줄의 "벨라 타르 X ... 특별전").
    // 그런 줄이 없으면 바로 다음 줄을 제목으로 쓴다("WENDERS: ON THE ROAD" 등).
    for (let i = keywordIdx + 1; i < Math.min(keywordIdx + 4, lines.length); i++) {
      if (containsEventKeyword(lines[i])) {
        return cleanTitleLine(lines[i]);
      }
    }
    return lines[keywordIdx + 1] ? cleanTitleLine(lines[keywordIdx + 1]) : cleaned;
  }

  return cleanTitleLine(lines[0] ?? "");
}

function extractPeriod(caption: string): string {
  for (const pattern of PERIOD_PATTERNS) {
    const match = caption.match(pattern);
    if (match) return match[0].replace(/\s+/g, " ").trim();
  }
  return "";
}

function extractBulletTitles(lines: string[]): string[] {
  const titles: string[] = [];
  for (const line of lines) {
    if (!BULLET_PREFIX.test(line)) {
      // 불릿 목록을 이미 모으고 있었는데 빈 줄/비불릿 줄을 만나면 목록이 끝난 것으로 본다.
      if (titles.length > 0) break;
      continue;
    }
    const withoutBullet = line.replace(BULLET_PREFIX, "");
    const withoutTime = withoutBullet.replace(/\s+\d{1,2}:\d{2}\s*$/, ""); // 시간표 줄의 "13:35" 같은 시각 제거
    const koreanTitle = withoutTime.split("|")[0].trim(); // "제목 | 원제 | 연도" 중 첫 부분만
    if (koreanTitle && !titles.includes(koreanTitle)) titles.push(koreanTitle);
  }
  return titles;
}

// "<파리텍사스>\n<안젤름>\n<피나>" 처럼 한 줄에 <제목>만 있는 줄이 연속되는 구간을 찾는다.
function extractBracketTitles(lines: string[], fromIdx: number): string[] {
  const isBracketOnly = (line: string) => /^<[^<>]+>$/.test(line);
  const titles: string[] = [];
  let started = false;
  for (let i = fromIdx; i < lines.length; i++) {
    if (isBracketOnly(lines[i])) {
      started = true;
      titles.push(lines[i].slice(1, -1).trim());
    } else if (started) {
      break;
    }
  }
  return titles;
}

// "#썸머필름을타고(2022) ,마츠모토 소우시 감독" 처럼 "#제목(연도) ,감독명" 형태가
// 연속되는 구간을 찾는다. 해시태그로 붙은 제목이라 띄어쓰기는 복원하지 못한다.
const HASHTAG_TITLE_LINE = /^#(\S+?)(?:\s*\(\d{4}\))?\s*,/;

function extractHashtagTitles(lines: string[]): string[] {
  const titles: string[] = [];
  let started = false;
  for (const line of lines) {
    const match = line.match(HASHTAG_TITLE_LINE);
    if (match) {
      started = true;
      titles.push(match[1].trim());
    } else if (started) {
      break;
    }
  }
  return titles;
}

function extractMovieTitles(caption: string): string[] {
  const lines = caption.split("\n").map((line) => line.trim());

  const headerIdx = lines.findIndex((line) => MOVIE_LIST_HEADER.test(line));
  if (headerIdx >= 0) {
    const bulletTitles = extractBulletTitles(lines.slice(headerIdx + 1));
    if (bulletTitles.length > 0) return bulletTitles;
  }

  // "상영작" 헤더가 없으면, 기획전/특별전 키워드가 있는 줄 바로 다음에서
  // "<제목>" 단독 줄이 연속으로 나오는 구간을 찾는다(개봉작 안내 게시물 등에서 흔한 형태).
  const keywordIdx = lines.findIndex((line) => containsEventKeyword(line));
  if (keywordIdx >= 0) {
    const bracketTitles = extractBracketTitles(lines, keywordIdx + 1);
    if (bracketTitles.length > 0) return bracketTitles;
  }

  // "#제목(연도) ,감독" 형태의 해시태그 목록도 시도한다(주로 캡션 상단에 위치).
  const hashtagTitles = extractHashtagTitles(lines);
  if (hashtagTitles.length > 0) return hashtagTitles;

  // 마지막 수단: 캡션 전체에서 첫 불릿 목록을 찾는다.
  return extractBulletTitles(lines);
}

function parseCaption(caption: string): ExtractedEvent {
  return {
    title: extractTitle(caption),
    period: extractPeriod(caption),
    movieTitles: extractMovieTitles(caption),
  };
}

async function main() {
  ensureStateDir();

  const seenState = loadJSON<SeenPostsState>(SEEN_POSTS_FILE, {});

  const browser = await puppeteer.launch({
    headless: HEADLESS,
    defaultViewport: null,
  });

  const reviewEntries: ReviewEntry[] = [];

  try {
    const page = await ensureSession(browser);

    for (const target of instagramScanTargets) {
      try {
        const candidates = await scanAccount(page, target, seenState);

        for (const candidate of candidates) {
          const extracted = parseCaption(candidate.caption);
          reviewEntries.push({
            theaterName: candidate.theaterName,
            postUrl: candidate.postUrl,
            title: extracted.title,
            period: extracted.period,
            movieTitles: extracted.movieTitles,
            rawCaption: candidate.caption,
          });
        }

        saveJSON(SEEN_POSTS_FILE, seenState);
      } catch (err) {
        // 계정 하나가 실패해도(비공개 전환, 페이지 구조 변경 등) 나머지 계정은 계속 스캔한다.
        const message = err instanceof Error ? err.message : String(err);
        console.error(`  ✗ [${target.theaterName}] @${target.username} 스캔 실패: ${message}`);
      }
    }
  } finally {
    await browser.close();
  }

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const reviewFile = path.join(STATE_DIR, `review-${dateStr}.json`);
  // 같은 날 여러 번 실행할 수 있으니(수동 재실행 등) 기존 파일을 빈 결과로
  // 덮어쓰지 않도록 postUrl 기준으로 합친다.
  const existingEntries = loadJSON<ReviewEntry[]>(reviewFile, []);
  const mergedByUrl = new Map(existingEntries.map((entry) => [entry.postUrl, entry]));
  for (const entry of reviewEntries) {
    mergedByUrl.set(entry.postUrl, entry);
  }
  const mergedEntries = Array.from(mergedByUrl.values());
  saveJSON(reviewFile, mergedEntries);

  console.log(
    `\n=== 스캔 완료: 이번 실행에서 새로 찾은 후보 ${reviewEntries.length}건 (오늘 누적 ${mergedEntries.length}건) ===`
  );
  for (const entry of mergedEntries) {
    console.log(`\n[${entry.theaterName}] ${entry.title}`);
    console.log(`  기간: ${entry.period}`);
    console.log(`  상영작: ${entry.movieTitles.join(", ")}`);
    console.log(`  원본: ${entry.postUrl}`);
  }
  console.log(`\n검토용 파일: ${reviewFile}`);
  console.log("src/mock/events.ts에 반영하기 전에 movieTitles가 src/mock/snapshot.ts 제목과 정확히 일치하는지 확인하세요.");
}

main().catch((err) => {
  console.error("스캔 실패:", err.message ?? err);
  process.exit(1);
});
