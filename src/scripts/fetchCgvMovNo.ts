// CGV 영화 제목으로 movNo를 자동 조회해 cgvMovNoCache.json에 병합.
//
// cgv.co.kr은 Cloudflare bot protection으로 서버사이드 fetch/curl이 도메인
// 전체에서 403을 받는다(확인 완료). 하지만 실제 브라우저(puppeteer)로
// 통합검색 페이지(/tme/itgrSrch)를 한 번 로드해 Cloudflare 챌린지를 통과시킨
// 뒤, 같은 페이지 컨텍스트 안에서 검색 API를 호출하면 Cloudflare 세션 쿠키를
// 그대로 타고 넘어가 정상 응답을 받을 수 있다. 이 방식으로 이전에 DevTools
// Network 탭에서 눈으로 찾아 addCGVMovNo.ts에 붙여넣던 과정을 자동화한다.
//
// 검색 API가 못 찾거나(신작이라 아직 색인 전) 제목이 여러 개로 갈리면
// addCGVMovNo.ts(DevTools 수동 방식)로 폴백.
//
// 사용법:
//   npx tsx src/scripts/fetchCgvMovNo.ts "영화 제목1" "영화 제목2" ...
//   인자 없이 실행하면 줄바꿈으로 구분된 제목을 stdin으로 입력받음 (Ctrl+D로 종료)

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import puppeteer from 'puppeteer';

const CACHE_PATH = path.resolve(process.cwd(), 'src/lib/cgvMovNoCache.json');
const SEARCH_PAGE_URL = 'https://cgv.co.kr/tme/itgrSrch';
const REQUEST_DELAY_MS = 1500;
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

interface CgvSearchMovie {
  movNm: string;
  movNo: string;
}

function normalizeTitle(title: string): string {
  return title.replace(/\s+/g, '');
}

// CGV가 예전에 쓰던 5자리 안팎의 구형 movNo는 다른 영화에 재할당된 사례가 확인됨
// (예: "기생충"→81774, "라디오 스타"→12413가 실제로는 전혀 다른 영화로 감).
// 지금 신작에 쓰이는 형식(30으로 시작하는 8자리)만 신뢰한다.
const SAFE_MOVNO_PATTERN = /^30\d{6}$/;

async function searchCgvMovie(
  page: import('puppeteer').Page,
  title: string,
): Promise<CgvSearchMovie[]> {
  return page.evaluate(async (swrd: string) => {
    const res = await fetch(
      `https://cgv.co.kr/api/v1/common/timeline/more/itgrSrch/searchItgrSrchAll?coCd=A420&swrd=${encodeURIComponent(swrd)}&lmtSrchYn=Y`,
    );
    if (!res.ok) return [];
    const json = await res.json();
    const movLst = json?.data?.movInfo?.movLst ?? [];
    const atktLst = json?.data?.atktPsblMovInfo?.atktPsblMovLst ?? [];
    const byMovNo = new Map<string, { movNm: string; movNo: string }>();
    for (const m of [...movLst, ...atktLst]) {
      if (m?.movNm && m?.movNo) byMovNo.set(m.movNo, { movNm: m.movNm, movNo: m.movNo });
    }
    return Array.from(byMovNo.values());
  }, title);
}

export async function run(titles: string[]) {
  if (titles.length === 0) {
    console.error('❌ 조회할 영화 제목이 없습니다.');
    return;
  }

  const existing: Record<string, string> = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent(USER_AGENT);

  console.log('Cloudflare 세션 준비 중...');
  await page.goto(SEARCH_PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise((r) => setTimeout(r, 2000));

  const added: string[] = [];
  const skipped: string[] = [];
  const notFound: string[] = [];
  const ambiguous: string[] = [];
  const unsafeFormat: string[] = [];

  for (const title of titles) {
    if (existing[title]) {
      skipped.push(`  이미 있음: ${title} (${existing[title]})`);
      continue;
    }

    const results = await searchCgvMovie(page, title);
    const exact = results.filter((r) => normalizeTitle(r.movNm) === normalizeTitle(title));
    // 같은 제목이 신형(30xxxxxx)/구형 ID로 중복 검색되는 경우가 있어, 신형을 우선
    // 신뢰하고 구형은 무시한다(구형은 다른 영화로 재할당됐을 위험이 있으므로).
    const safeExact = exact.filter((r) => SAFE_MOVNO_PATTERN.test(r.movNo));

    if (safeExact.length === 1) {
      existing[title] = safeExact[0].movNo;
      added.push(`  추가됨:   ${title} → ${safeExact[0].movNo}`);
    } else if (safeExact.length > 1) {
      ambiguous.push(
        `  다중 일치: ${title} → ${safeExact.map((r) => `${r.movNm}(${r.movNo})`).join(', ')}`,
      );
    } else if (exact.length > 0) {
      unsafeFormat.push(
        `  구형 ID(신뢰 불가): ${title} → ${exact.map((r) => r.movNo).join(', ')} — 다른 영화로 재할당됐을 수 있어 자동 추가 안 함`,
      );
    } else {
      notFound.push(`  못 찾음:  ${title}`);
    }

    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
  }

  await browser.close();

  const sorted = Object.fromEntries(
    Object.entries(existing).sort(([a], [b]) => a.localeCompare(b, 'ko')),
  );
  fs.writeFileSync(CACHE_PATH, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');

  console.log(
    `\n✅ 완료: ${added.length}편 추가, ${skipped.length}편 스킵, ${notFound.length}편 못 찾음, ${ambiguous.length}편 다중 일치, ${unsafeFormat.length}편 구형 ID\n`,
  );
  [...added, ...skipped, ...notFound, ...ambiguous, ...unsafeFormat].forEach((line) => console.log(line));

  if (notFound.length || ambiguous.length || unsafeFormat.length) {
    console.log(
      '\n못 찾았거나 다중 일치/구형 ID인 영화는 DevTools로 확인 후 addCGVMovNo.ts로 수동 추가해줘.',
    );
  }
  console.log('');
}

// batchFetchCgvMovNo.ts 등 다른 스크립트에서 run()을 import해 쓸 때는 아래 CLI
// 진입부가 실행되지 않도록 직접 실행된 경우에만 동작시킨다.
const isDirectRun = import.meta.url === `file://${process.argv[1]}`;
if (isDirectRun) {
  const args = process.argv.slice(2);
  if (args.length > 0) {
    run(args);
  } else {
    console.log('영화 제목을 한 줄에 하나씩 입력하고 Enter 후 Ctrl+D (Mac: Ctrl+D, Windows: Ctrl+Z+Enter):\n');
    const rl = readline.createInterface({ input: process.stdin });
    const titles: string[] = [];
    rl.on('line', (line) => {
      const t = line.trim();
      if (t) titles.push(t);
    });
    rl.on('close', () => run(titles));
  }
}
