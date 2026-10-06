// 인스타그램 기획전 자동 반영 스크립트.
//
// scan-instagram-events.ts가 만든 review 파일(후보 게시물)을 claude -p로 정리해서
// events.json에 넣을 추가/수정안을 받고, 코드 규칙으로 검증해 통과한 것만 반영한 뒤
// origin/main에 바로 배포한다. 통과 못 한 건 반영하지 않고 sync-<날짜>.json에 "보류"로
// 남기며, 다음 실행 때 claude에게 다시 보여줘서 정보가 채워지면 그때 반영되게 한다.
//
// 실행: npm run sync:instagram            (가장 최근 review 파일)
//       npm run sync:instagram -- --dry-run  (반영/배포 없이 결과만 출력)
//       npm run sync:instagram -- .instagram-scan/review-20261006.json
//
// 보통은 scripts/instagram-scan.sh가 스캔 직후 자동으로 실행한다.

import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

import type { CuratedEvent } from "../mock/events";
import { ScheduleService } from "../services/scheduleService";
import { getLocalDateString } from "../utils/date";
import { instagramScanTargets } from "./instagramTargets";

const STATE_DIR = path.join(process.cwd(), ".instagram-scan");
const EVENTS_REL_PATH = "src/mock/events.json";
const DRY_RUN = process.argv.includes("--dry-run");
// 시간표 데이터로 상영작을 검증할 기간(오늘 포함). 그 뒤에 시작하는 기획전은 시간표가
// 아직 없으므로 상영작 검증을 건너뛴다.
const SCHEDULE_WINDOW_DAYS = 7;
// 너무 먼 미래 날짜는 연도 오인식 같은 파싱 실수일 가능성이 높아 보류한다.
const MAX_DAYS_AHEAD = 90;
const MAX_CAPTION_CHARS = 2500;
// 기획전 전체 기간은 첫 공지 게시물에만 있고 이후 게시물(시간표·작품 소개)에는 없는 경우가 많아서,
// 지난 몇 주의 review 파일도 참고 자료로 함께 넘긴다.
const EARLIER_REVIEW_FILES = 3;
const MAX_EARLIER_CAPTION_CHARS = 1200;
const CLAUDE_TIMEOUT_MS = 10 * 60 * 1000;

interface ReviewEntry {
  theaterName: string;
  postUrl: string;
  title: string;
  period: string;
  movieTitles: string[];
  rawCaption: string;
}

type EventChanges = Partial<Omit<CuratedEvent, "id">>;

type Operation =
  | { type: "add"; event: CuratedEvent; sources: string[]; reason: string }
  | { type: "update"; id: string; changes: EventChanges; sources: string[]; reason: string };

interface RejectedOperation {
  operation: Operation;
  problems: string[];
}

interface SyncResult {
  date: string;
  reviewFile: string;
  applied: Operation[];
  rejected: RejectedOperation[];
  deploy: "완료" | "스킵" | "실패" | "변경 없음" | "dry-run";
}

const UPDATABLE_FIELDS: (keyof EventChanges)[] = [
  "title",
  "theaterNames",
  "period",
  "startDate",
  "endDate",
  "summary",
  "description",
  "movieTitles",
  "note",
];

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return getLocalDateString(d);
}

function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00`);
  return !Number.isNaN(d.getTime()) && getLocalDateString(d) === value;
}

function loadJSON<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function git(args: string[], options: { env?: NodeJS.ProcessEnv; input?: string } = {}): string {
  return execFileSync("git", args, { encoding: "utf-8", ...options }).trim();
}

function findLatestFile(prefix: string, exclude?: string): string | null {
  if (!fs.existsSync(STATE_DIR)) return null;
  const files = fs
    .readdirSync(STATE_DIR)
    .filter((f) => f.startsWith(prefix) && f.endsWith(".json") && f !== exclude)
    .sort();
  return files.length > 0 ? path.join(STATE_DIR, files[files.length - 1]) : null;
}

// 극장별로 앞으로 일주일간 시간표에 있는 영화 제목. 상영작 제목을 실제 데이터와
// 똑같이 쓰게 하고(claude에게 제공), 반영 전 검증하는 데 쓴다.
async function loadScheduleTitles(today: string): Promise<Map<string, Set<string>>> {
  const service = new ScheduleService();
  const titlesByTheater = new Map<string, Set<string>>();
  for (let i = 0; i < SCHEDULE_WINDOW_DAYS; i++) {
    const date = addDays(today, i);
    try {
      const movies: { title: string; theater: string }[] = await service.crawlArtCinemasWithKMDBByDate(
        new Date(`${date}T00:00:00`)
      );
      for (const movie of movies) {
        if (!titlesByTheater.has(movie.theater)) titlesByTheater.set(movie.theater, new Set());
        titlesByTheater.get(movie.theater)!.add(movie.title);
      }
    } catch (err) {
      console.warn(`⚠️ ${date} 시간표 조회 실패 (이 날짜는 검증에서 빠짐): ${err instanceof Error ? err.message : err}`);
    }
  }
  return titlesByTheater;
}

function buildPrompt(input: {
  today: string;
  events: CuratedEvent[];
  candidates: ReviewEntry[];
  earlierCandidates: ReviewEntry[];
  previouslyRejected: RejectedOperation[];
  scheduleTitles: Record<string, string[]>;
  knownTheaters: string[];
}): string {
  return `너는 독립·예술영화관 기획전 정보를 관리하는 편집자다. 오늘은 ${input.today}이다.
극장 인스타그램에서 "기획전/특별전" 키워드로 수집한 게시물(candidates)을 읽고, 앱의 기획전 목록(currentEvents)에
반영할 추가(add)/수정(update) 작업만 JSON으로 출력하라.

## 판단 규칙
- 같은 기획전을 다룬 여러 게시물(시간표, 굿즈 이벤트, 작품별 소개 등)은 하나의 기획전으로 묶는다.
- 이미 currentEvents에 있는 기획전이면 add하지 말고, 기간 연장·종료일 공지·상영작 추가처럼 실제로 바뀐 내용이 있을 때만 update한다.
- 같은 이름의 기획전이라도 극장마다 기간이 다르면 극장별로 별도 항목으로 만든다. 기간이 같으면 theaterNames에 함께 넣는다.
- 기획전이 아닌 것은 무시한다: 단발성 GV/상영회, 굿즈 이벤트만 있는 게시물, 일반 개봉작, 이미 끝난 기획전(종료일이 오늘 이전).
- 전체 기간을 게시물에서 확인할 수 없으면 추측하지 말고 endDate를 null로 둔다. startDate도 모르면 그 기획전은 출력하지 않는다.
- 연도가 생략된 날짜는 오늘 기준으로 가장 자연스러운 연도로 해석한다.
- theaterNames는 반드시 knownTheaters 중에서 고른다 (게시물의 계정 극장명 = candidates의 theaterName).
- movieTitles는 그 극장의 scheduleTitles에 같은 영화가 있으면 그 표기를 글자 그대로 쓴다. 없으면 게시물의 한국어 제목을 쓴다(괄호·연도·원제 제외).
- earlierCandidates는 지난 몇 주 동안 수집된 게시물이다. 이것만 보고 새 기획전을 만들지는 말고, 이번 주 candidates에 나온
  기획전의 전체 기간·상영작처럼 이번 게시물에 빠진 정보를 확인하는 참고 자료로만 쓴다.
- previouslyRejected는 지난번에 검증을 통과 못 해 보류된 작업이다. 이번 게시물로 빠진 정보가 채워졌으면 고쳐서 다시 출력하고, 아니면 무시한다.

## 필드 형식 (currentEvents와 같은 스타일)
- id: 영문 소문자·숫자·하이픈만 ("극장약칭-기획전약칭", 예: "momo-robert-bresson"). 기존 id와 겹치면 안 된다.
- title: 기획전 정식 이름 (이모지·해시태그·극장명 접두어 제외)
- period: "YYYY.MM.DD - YYYY.MM.DD", 종료일 미정이면 "YYYY.MM.DD - 상영 중"
- startDate / endDate: "YYYY-MM-DD" (endDate 미정이면 null)
- summary: 25자 안팎의 한 줄 소개, description: 2~3문장 소개 (게시물 내용만 근거로, 과장 금지)
- update의 changes에는 바뀌는 필드만 넣는다.

## 출력
설명 없이 아래 형태의 JSON 하나만 출력한다. 반영할 것이 없으면 {"operations": []}.
{"operations": [
  {"type": "add", "event": {"id": "...", "title": "...", "theaterNames": ["..."], "period": "...", "startDate": "...", "endDate": "...", "summary": "...", "description": "...", "movieTitles": ["..."]}, "sources": ["게시물 URL"], "reason": "판단 근거 한 줄"},
  {"type": "update", "id": "기존 id", "changes": {"endDate": "..."}, "sources": ["게시물 URL"], "reason": "판단 근거 한 줄"}
]}

## 입력
${JSON.stringify(
  {
    knownTheaters: input.knownTheaters,
    currentEvents: input.events,
    scheduleTitles: input.scheduleTitles,
    previouslyRejected: input.previouslyRejected,
    candidates: input.candidates.map((c) => ({
      theaterName: c.theaterName,
      postUrl: c.postUrl,
      caption: c.rawCaption.slice(0, MAX_CAPTION_CHARS),
    })),
    earlierCandidates: input.earlierCandidates.map((c) => ({
      theaterName: c.theaterName,
      postUrl: c.postUrl,
      caption: c.rawCaption.slice(0, MAX_EARLIER_CAPTION_CHARS),
    })),
  },
  null,
  1
)}`;
}

function runClaude(prompt: string): string {
  // 블로그봇과 같은 방식: 모든 툴을 막고 레포 밖 상태 폴더에서 실행해 텍스트 응답만 받는다.
  return execFileSync(
    "claude",
    [
      "-p",
      "--model",
      "sonnet",
      "--output-format",
      "text",
      "--no-session-persistence",
      "--disallowedTools",
      "Bash Read Write Edit Glob Grep WebFetch WebSearch Agent Task NotebookEdit",
    ],
    { cwd: STATE_DIR, input: prompt, encoding: "utf-8", timeout: CLAUDE_TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 }
  );
}

function parseOperations(output: string): Operation[] {
  const start = output.indexOf("{");
  const end = output.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error(`claude 응답에서 JSON을 찾지 못함: ${output.slice(0, 200)}`);
  const parsed = JSON.parse(output.slice(start, end + 1)) as { operations?: unknown };
  if (!Array.isArray(parsed.operations)) throw new Error("claude 응답에 operations 배열이 없음");
  return parsed.operations as Operation[];
}

// 반영될 기획전 하나가 규칙을 지키는지 확인하고, 문제 목록을 돌려준다(빈 배열이면 통과).
function validateEvent(
  event: CuratedEvent,
  ctx: { today: string; knownTheaters: Set<string>; titlesByTheater: Map<string, Set<string>> },
  checkMovies: boolean
): string[] {
  const problems: string[] = [];
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(event.id ?? "")) problems.push(`id 형식 오류: ${event.id}`);
  for (const field of ["title", "period", "summary", "description"] as const) {
    if (typeof event[field] !== "string" || event[field].trim() === "") problems.push(`${field} 비어 있음`);
  }
  if (!Array.isArray(event.theaterNames) || event.theaterNames.length === 0) {
    problems.push("theaterNames 비어 있음");
  } else {
    const unknown = event.theaterNames.filter((name) => !ctx.knownTheaters.has(name));
    if (unknown.length > 0) problems.push(`알 수 없는 극장명: ${unknown.join(", ")}`);
  }
  if (!isValidDate(event.startDate)) problems.push(`startDate 형식 오류: ${event.startDate}`);
  if (event.endDate === null) {
    problems.push("종료일이 공지되지 않음 (기간 미확정)");
  } else if (!isValidDate(event.endDate)) {
    problems.push(`endDate 형식 오류: ${event.endDate}`);
  } else if (isValidDate(event.startDate) && event.endDate < event.startDate) {
    problems.push(`종료일(${event.endDate})이 시작일(${event.startDate})보다 앞섬`);
  }
  if (isValidDate(event.startDate) && event.startDate > addDays(ctx.today, MAX_DAYS_AHEAD)) {
    problems.push(`시작일이 ${MAX_DAYS_AHEAD}일 넘게 남음 (날짜 오인식 의심)`);
  }

  if (!Array.isArray(event.movieTitles) || event.movieTitles.length === 0) {
    problems.push("movieTitles 비어 있음");
  } else if (checkMovies && isValidDate(event.startDate)) {
    // 시간표가 있는 기간에 상영 중이거나 곧 시작하는 기획전은, 상영작 중 하나라도 그 극장
    // 시간표에 있어야 한다. 이미 끝난 기획전(종료일 수정 등)과 시간표 데이터가 없는 극장
    // (CGV아트하우스 계정 등)은 확인할 수 없어 넘어간다.
    const windowEnd = addDays(ctx.today, SCHEDULE_WINDOW_DAYS - 1);
    const stillRunning = event.endDate === null || event.endDate >= ctx.today;
    const theaterTitles = event.theaterNames
      .map((name) => ctx.titlesByTheater.get(name))
      .filter((titles): titles is Set<string> => titles !== undefined);
    if (stillRunning && event.startDate <= windowEnd && theaterTitles.length > 0) {
      const matched = event.movieTitles.some((title) => theaterTitles.some((titles) => titles.has(title)));
      if (!matched) problems.push("상영작이 해당 극장 시간표(앞으로 7일)에 하나도 없음");
    }
  }
  return problems;
}

function applyOperations(
  baseEvents: CuratedEvent[],
  operations: Operation[],
  ctx: { today: string; knownTheaters: Set<string>; titlesByTheater: Map<string, Set<string>> }
): { events: CuratedEvent[]; applied: Operation[]; rejected: RejectedOperation[] } {
  let events = [...baseEvents];
  const applied: Operation[] = [];
  const rejected: RejectedOperation[] = [];

  for (const op of operations) {
    if (op?.type === "add") {
      const problems = validateEvent(op.event, ctx, true);
      if (events.some((e) => e.id === op.event?.id)) problems.push(`이미 있는 id: ${op.event.id}`);
      if (op.event?.endDate && op.event.endDate < ctx.today) problems.push("이미 끝난 기획전");
      if (problems.length > 0) {
        rejected.push({ operation: op, problems });
        continue;
      }
      const { id, title, theaterNames, period, startDate, endDate, summary, description, movieTitles } = op.event;
      // 새 기획전은 목록 맨 앞에 둔다(목록 화면은 종료 여부로만 다시 정렬한다).
      events = [{ id, title, theaterNames, period, startDate, endDate, summary, description, movieTitles }, ...events];
      applied.push(op);
    } else if (op?.type === "update") {
      const current = events.find((e) => e.id === op.id);
      if (!current) {
        rejected.push({ operation: op, problems: [`없는 id: ${op.id}`] });
        continue;
      }
      const changes: EventChanges = {};
      for (const field of UPDATABLE_FIELDS) {
        if (op.changes && field in op.changes) (changes as Record<string, unknown>)[field] = op.changes[field];
      }
      if (Object.keys(changes).length === 0) {
        rejected.push({ operation: op, problems: ["바꿀 필드가 없음"] });
        continue;
      }
      const next: CuratedEvent = { ...current, ...changes };
      // 이미 반영돼 있는 기획전의 수정이라 종료일 미정(null)으로 두는 건 허용한다.
      const problems = validateEvent(next, ctx, "movieTitles" in changes || "theaterNames" in changes).filter(
        (p) => !(next.endDate === null && p.startsWith("종료일이 공지되지 않음"))
      );
      if (problems.length > 0) {
        rejected.push({ operation: op, problems });
        continue;
      }
      events = events.map((e) => (e.id === op.id ? next : e));
      applied.push(op);
    } else {
      rejected.push({ operation: op, problems: ["알 수 없는 작업 형식"] });
    }
  }
  return { events, applied, rejected };
}

function describeOperation(op: Operation, events: CuratedEvent[]): string {
  if (op.type === "add") return `추가: ${op.event?.title} (${op.event?.theaterNames?.join(", ")}, ${op.event?.period})`;
  const title = events.find((e) => e.id === op.id)?.title ?? op.id;
  return `수정: ${title} (${Object.keys(op.changes ?? {}).join(", ")})`;
}

// batchFetchCgvMovNo.ts와 같은 방식: 로컬 체크아웃/인덱스는 건드리지 않고 origin/main 위에
// events.json 하나만 바꾼 커밋을 만들어 바로 push한다(작업 중인 브랜치가 오염되지 않도록).
function deployToMain(content: string, baseSha: string, message: string): "완료" | "스킵" | "실패" {
  try {
    const blobSha = git(["hash-object", "-w", "--stdin"], { input: content });
    const tmpIndex = path.join(os.tmpdir(), `instagram-events-index-${Date.now()}`);
    const env = { ...process.env, GIT_INDEX_FILE: tmpIndex };
    try {
      git(["read-tree", baseSha], { env });
      git(["update-index", "--add", "--cacheinfo", `100644,${blobSha},${EVENTS_REL_PATH}`], { env });
      const newTree = git(["write-tree"], { env });
      if (newTree === git(["rev-parse", `${baseSha}^{tree}`])) {
        console.log("events.json: origin/main과 내용이 같음 — 배포 스킵");
        return "스킵";
      }
      const newCommit = git(["commit-tree", newTree, "-p", baseSha, "-m", message]);
      git(["push", "origin", `${newCommit}:refs/heads/main`]);
      console.log(`✅ events.json → main 자동 배포 완료 (${newCommit.slice(0, 7)})`);
      return "완료";
    } finally {
      fs.rmSync(tmpIndex, { force: true });
    }
  } catch (err) {
    console.error(`⚠️ events.json 자동 배포 실패: ${err instanceof Error ? err.message : err}`);
    return "실패";
  }
}

async function main() {
  const today = getLocalDateString(new Date());
  const reviewArg = process.argv.slice(2).find((arg) => arg.endsWith(".json"));
  const reviewFile = reviewArg ? path.resolve(reviewArg) : findLatestFile("review-");
  if (!reviewFile || !fs.existsSync(reviewFile)) {
    console.log("처리할 review 파일이 없음 — 종료");
    return;
  }
  console.log(`\n=== 기획전 자동 반영 시작 (${today}${DRY_RUN ? ", dry-run" : ""}) ===`);
  console.log(`review 파일: ${reviewFile}`);

  const candidates = loadJSON<ReviewEntry[]>(reviewFile, []);
  const candidateUrls = new Set(candidates.map((c) => c.postUrl));
  const earlierReviewFiles = fs
    .readdirSync(STATE_DIR)
    .filter((f) => /^review-\d{8}\.json$/.test(f) && path.join(STATE_DIR, f) < reviewFile)
    .sort()
    .slice(-EARLIER_REVIEW_FILES);
  const earlierByUrl = new Map<string, ReviewEntry>();
  for (const file of earlierReviewFiles) {
    for (const entry of loadJSON<ReviewEntry[]>(path.join(STATE_DIR, file), [])) {
      if (!candidateUrls.has(entry.postUrl)) earlierByUrl.set(entry.postUrl, entry);
    }
  }
  const earlierCandidates = [...earlierByUrl.values()];
  const resultFile = path.join(STATE_DIR, `sync-${today.replace(/-/g, "")}.json`);
  const previousResultFile = findLatestFile("sync-", path.basename(resultFile));
  const previouslyRejected = previousResultFile
    ? loadJSON<SyncResult | null>(previousResultFile, null)?.rejected ?? []
    : [];

  // 로컬 파일이 아니라 origin/main의 events.json을 기준으로 삼는다. 로컬에서 고치다 만
  // 내용이 섞여 배포되거나, 이미 배포된 수정을 덮어쓰지 않도록.
  git(["fetch", "origin", "main", "--quiet"]);
  const baseSha = git(["rev-parse", "origin/main"]);
  let baseContent: string;
  try {
    baseContent = git(["show", `${baseSha}:${EVENTS_REL_PATH}`]) + "\n";
  } catch {
    if (!DRY_RUN) throw new Error(`${EVENTS_REL_PATH}이 origin/main에 아직 없음 — 먼저 커밋·푸시해야 자동 반영할 수 있음`);
    console.warn(`⚠️ origin/main에 ${EVENTS_REL_PATH}이 없어 로컬 파일로 dry-run`);
    baseContent = fs.readFileSync(path.join(process.cwd(), EVENTS_REL_PATH), "utf-8");
  }
  const baseEvents = JSON.parse(baseContent) as CuratedEvent[];

  if (candidates.length === 0 && previouslyRejected.length === 0) {
    console.log("후보 게시물도, 보류된 작업도 없음 — 종료");
    return;
  }

  const titlesByTheater = await loadScheduleTitles(today);
  const knownTheaters = new Set<string>([
    ...titlesByTheater.keys(),
    ...instagramScanTargets.map((t) => t.theaterName),
    ...baseEvents.flatMap((e) => e.theaterNames),
  ]);
  // 프롬프트가 너무 커지지 않도록 스캔 대상 극장의 시간표만 넘긴다.
  const scanTheaters = new Set([...instagramScanTargets.map((t) => t.theaterName), ...baseEvents.flatMap((e) => e.theaterNames)]);
  const scheduleTitles = Object.fromEntries(
    [...titlesByTheater.entries()].filter(([theater]) => scanTheaters.has(theater)).map(([t, s]) => [t, [...s].sort()])
  );

  console.log(`후보 게시물 ${candidates.length}건(참고용 지난 게시물 ${earlierCandidates.length}건), 지난번 보류 ${previouslyRejected.length}건 → claude로 정리 중...`);
  const prompt = buildPrompt({
    today,
    events: baseEvents,
    candidates,
    earlierCandidates,
    previouslyRejected,
    scheduleTitles,
    knownTheaters: [...knownTheaters].sort(),
  });
  const operations = parseOperations(runClaude(prompt));
  console.log(`claude 제안 ${operations.length}건`);

  const ctx = { today, knownTheaters, titlesByTheater };
  const { events, applied, rejected } = applyOperations(baseEvents, operations, ctx);

  for (const op of applied) console.log(`  ✓ ${describeOperation(op, baseEvents)}`);
  for (const r of rejected) console.log(`  · 보류: ${describeOperation(r.operation, baseEvents)} — ${r.problems.join("; ")}`);

  let deploy: SyncResult["deploy"] = "변경 없음";
  if (applied.length > 0) {
    const newContent = JSON.stringify(events, null, 2) + "\n";
    if (DRY_RUN) {
      deploy = "dry-run";
    } else {
      const message = [
        `기획전 자동 반영 (${today}): ${applied.length}건`,
        "",
        ...applied.map((op) => `- ${describeOperation(op, baseEvents)}`),
        "",
        "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>",
      ].join("\n");
      deploy = deployToMain(newContent, baseSha, message);

      // 로컬 파일이 배포 전 main과 같았을 때만 같이 갱신한다(로컬에서 고치던 내용은 건드리지 않음).
      const localPath = path.join(process.cwd(), EVENTS_REL_PATH);
      if (deploy === "완료" && fs.existsSync(localPath) && fs.readFileSync(localPath, "utf-8") === baseContent) {
        fs.writeFileSync(localPath, newContent, "utf-8");
      } else if (deploy === "완료") {
        console.log("로컬 events.json이 main과 달라서 로컬 파일은 그대로 둠 — git pull로 받아야 함");
      }
    }
  }

  if (!DRY_RUN) {
    const result: SyncResult = { date: today, reviewFile, applied, rejected, deploy };
    fs.writeFileSync(resultFile, JSON.stringify(result, null, 2), "utf-8");
  }
  console.log(`=== 기획전 자동 반영 완료: 반영 ${applied.length}건, 보류 ${rejected.length}건, 배포 ${deploy} ===`);
}

main().catch((err) => {
  console.error("❌ 기획전 자동 반영 실패:", err instanceof Error ? err.message : err);
  process.exit(1);
});
