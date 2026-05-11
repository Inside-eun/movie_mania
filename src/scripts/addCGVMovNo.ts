// CGV API 응답에서 movNo를 추출해 cgvMovNoCache.json에 자동 추가
//
// 사용법:
//   파일로:   npx tsx src/scripts/addCGVMovNo.ts response.json
//   붙여넣기: npx tsx src/scripts/addCGVMovNo.ts   (실행 후 JSON 붙여넣고 Ctrl+D)

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const CACHE_PATH = path.resolve(process.cwd(), 'src/lib/cgvMovNoCache.json');

interface CGVItem {
  movNm?: string;
  movNo?: string;
  [key: string]: unknown;
}

interface CGVResponse {
  data?: CGVItem[];
  [key: string]: unknown;
}

function extractFromJson(raw: string): Record<string, string> {
  let parsed: CGVResponse | CGVItem[];
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error('❌ JSON 파싱 실패: 올바른 JSON인지 확인해주세요.');
    process.exit(1);
  }

  const items: CGVItem[] = Array.isArray(parsed)
    ? parsed
    : (parsed.data ?? []);

  if (!Array.isArray(items) || items.length === 0) {
    console.error('❌ data 배열이 비어있거나 찾을 수 없습니다.');
    process.exit(1);
  }

  const result: Record<string, string> = {};
  for (const item of items) {
    if (item.movNm && item.movNo) {
      result[item.movNm] = item.movNo;
    }
  }
  return result;
}

function run(raw: string) {
  const extracted = extractFromJson(raw);

  if (Object.keys(extracted).length === 0) {
    console.error('❌ movNm/movNo 필드를 찾지 못했습니다.');
    process.exit(1);
  }

  const existing: Record<string, string> = JSON.parse(
    fs.readFileSync(CACHE_PATH, 'utf-8'),
  );

  const added: string[] = [];
  const skipped: string[] = [];

  for (const [title, movNo] of Object.entries(extracted)) {
    if (existing[title]) {
      skipped.push(`  이미 있음: ${title} (${existing[title]})`);
    } else {
      existing[title] = movNo;
      added.push(`  추가됨:   ${title} → ${movNo}`);
    }
  }

  // 가나다 순 정렬 후 저장
  const sorted = Object.fromEntries(
    Object.entries(existing).sort(([a], [b]) => a.localeCompare(b, 'ko')),
  );
  fs.writeFileSync(CACHE_PATH, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');

  console.log(`\n✅ 완료: ${added.length}편 추가, ${skipped.length}편 스킵\n`);
  [...added, ...skipped].forEach(line => console.log(line));
  console.log('');
}

// 파일 인수가 있으면 파일에서 읽기, 없으면 stdin
const filePath = process.argv[2];
if (filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 파일 없음: ${filePath}`);
    process.exit(1);
  }
  run(fs.readFileSync(filePath, 'utf-8'));
} else {
  console.log('JSON 응답을 붙여넣고 Enter 후 Ctrl+D (Mac: Ctrl+D, Windows: Ctrl+Z+Enter):\n');
  const rl = readline.createInterface({ input: process.stdin });
  const lines: string[] = [];
  rl.on('line', line => lines.push(line));
  rl.on('close', () => run(lines.join('\n')));
}
