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

async function run(titles: string[]) {
  if (titles.length === 0) {
    console.error('❌ 조회할 영화 제목이 없습니다.');
    process.exit(1);
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

  for (const title of titles) {
    if (existing[title]) {
      skipped.push(`  이미 있음: ${title} (${existing[title]})`);
      continue;
    }

    const results = await searchCgvMovie(page, title);
    const exact = results.filter((r) => normalizeTitle(r.movNm) === normalizeTitle(title));

    if (exact.length === 1) {
      existing[title] = exact[0].movNo;
      added.push(`  추가됨:   ${title} → ${exact[0].movNo}`);
    } else if (exact.length > 1) {
      ambiguous.push(
        `  다중 일치: ${title} → ${exact.map((r) => `${r.movNm}(${r.movNo})`).join(', ')}`,
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
    `\n✅ 완료: ${added.length}편 추가, ${skipped.length}편 스킵, ${notFound.length}편 못 찾음, ${ambiguous.length}편 다중 일치\n`,
  );
  [...added, ...skipped, ...notFound, ...ambiguous].forEach((line) => console.log(line));

  if (notFound.length || ambiguous.length) {
    console.log(
      '\n못 찾았거나 다중 일치한 영화는 DevTools로 확인 후 addCGVMovNo.ts로 수동 추가해줘.',
    );
  }
  console.log('');
}

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
