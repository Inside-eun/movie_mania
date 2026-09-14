// 오늘(또는 지정한 날짜) CGV_CINEMAS에 등록된 극장에서 상영 중인 영화 제목을
// 전부 모아 fetchCgvMovNo.ts로 일괄 조회 → cgvMovNoCache.json에 병합.
//
// 예매 클릭 시점에 movNo가 캐시에 없으면 통합검색 폴백으로 빠지므로, 미리
// 이 스크립트를 돌려서 캐시를 채워두면 실제 사용자가 폴백을 만날 일이 줄어든다.
//
// 사용법:
//   npx tsx src/scripts/batchFetchCgvMovNo.ts            (오늘 날짜)
//   npx tsx src/scripts/batchFetchCgvMovNo.ts 2026-09-11  (특정 날짜)

import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { ScheduleService } from '../services/scheduleService';
import { CGV_CINEMAS } from '../lib/cgvBooking';
import { run } from './fetchCgvMovNo';
import { getLocalDateString } from '../utils/date';

interface MovieSchedule {
  title: string;
  theater: string;
  [key: string]: unknown;
}

const CACHE_REL_PATH = 'src/lib/cgvMovNoCache.json';

// cgvMovNoCache.json은 cgvBooking.ts에 정적 import돼서 빌드에 박히기 때문에,
// 로컬 파일만 갱신하고 커밋/푸시를 사람이 깜빡하면 자동화 결과가 프로덕션에
// 영원히 반영되지 않는다(실제로 주말 동안 이 문제로 반영이 안 됐음). 그렇다고
// 현재 로컬에서 작업 중인 브랜치(develop 등)에 자동 커밋을 얹으면 작업 중인
// 브랜치가 오염되므로, git plumbing으로 로컬 체크아웃/인덱스를 전혀 건드리지
// 않고 origin/main 위에 이 파일 하나만 갱신하는 커밋을 만들어 바로 push한다.
function deployCacheFileToMain(): void {
  try {
    execFileSync('git', ['fetch', 'origin', 'main', '--quiet']);
    const baseSha = execFileSync('git', ['rev-parse', 'origin/main'], { encoding: 'utf-8' }).trim();
    const baseTree = execFileSync('git', ['rev-parse', `${baseSha}^{tree}`], { encoding: 'utf-8' }).trim();

    const tmpIndex = path.join(os.tmpdir(), `cgv-movno-index-${Date.now()}`);
    const env = { ...process.env, GIT_INDEX_FILE: tmpIndex };
    try {
      execFileSync('git', ['read-tree', baseSha], { env });
      execFileSync('git', ['add', '--force', '--', CACHE_REL_PATH], { env });
      const newTree = execFileSync('git', ['write-tree'], { env, encoding: 'utf-8' }).trim();

      if (newTree === baseTree) {
        console.log('cgvMovNoCache.json: origin/main과 내용이 같음 — 배포 스킵');
        return;
      }

      const message = `CGV movNo 캐시 자동 갱신 (${getLocalDateString(new Date())})\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`;
      const newCommit = execFileSync(
        'git',
        ['commit-tree', newTree, '-p', baseSha, '-m', message],
        { encoding: 'utf-8' }
      ).trim();
      execFileSync('git', ['push', 'origin', `${newCommit}:refs/heads/main`]);
      console.log(`✅ cgvMovNoCache.json → main 자동 배포 완료 (${newCommit.slice(0, 7)})`);
    } finally {
      fs.rmSync(tmpIndex, { force: true });
    }
  } catch (err) {
    console.error(
      '⚠️ cgvMovNoCache.json 자동 배포 실패 — 로컬 파일은 갱신됐지만 main에는 반영 안 됨. 수동으로 커밋/push 필요:',
      err instanceof Error ? err.message : err
    );
  }
}

async function main() {
  const dateArg = process.argv[2];
  const targetDate = dateArg ? new Date(dateArg) : new Date();

  if (Number.isNaN(targetDate.getTime())) {
    console.error(`❌ 날짜 형식이 올바르지 않습니다: ${dateArg} (예: 2026-09-11)`);
    process.exit(1);
  }

  console.log(`${getLocalDateString(targetDate)} 기준 CGV 상영작 조회 중...`);

  const scheduleService = new ScheduleService();
  const movies: MovieSchedule[] = await scheduleService.crawlArtCinemasWithKMDBByDate(targetDate);

  const cgvTheaterNames = new Set(Object.keys(CGV_CINEMAS));
  const titles = Array.from(
    new Set(movies.filter((m) => cgvTheaterNames.has(m.theater)).map((m) => m.title)),
  );

  if (titles.length === 0) {
    console.log('해당 날짜에 CGV_CINEMAS 극장에서 상영 중인 영화가 없습니다.');
    return;
  }

  console.log(`대상 영화 ${titles.length}편: ${titles.join(', ')}\n`);
  await run(titles);
  deployCacheFileToMain();
}

main().catch((err) => {
  console.error('❌ CGV movNo 일괄 조회 실패:', err instanceof Error ? err.message : err);
  process.exit(1);
});
