// 오늘(또는 지정한 날짜) CGV_CINEMAS에 등록된 극장에서 상영 중인 영화 제목을
// 전부 모아 fetchCgvMovNo.ts로 일괄 조회 → cgvMovNoCache.json에 병합.
//
// 예매 클릭 시점에 movNo가 캐시에 없으면 통합검색 폴백으로 빠지므로, 미리
// 이 스크립트를 돌려서 캐시를 채워두면 실제 사용자가 폴백을 만날 일이 줄어든다.
//
// 사용법:
//   npx tsx src/scripts/batchFetchCgvMovNo.ts            (오늘 날짜)
//   npx tsx src/scripts/batchFetchCgvMovNo.ts 2026-09-11  (특정 날짜)

import { ScheduleService } from '../services/scheduleService';
import { CGV_CINEMAS } from '../lib/cgvBooking';
import { run } from './fetchCgvMovNo';

interface MovieSchedule {
  title: string;
  theater: string;
  [key: string]: unknown;
}

async function main() {
  const dateArg = process.argv[2];
  const targetDate = dateArg ? new Date(dateArg) : new Date();

  if (Number.isNaN(targetDate.getTime())) {
    console.error(`❌ 날짜 형식이 올바르지 않습니다: ${dateArg} (예: 2026-09-11)`);
    process.exit(1);
  }

  console.log(`${targetDate.toISOString().split('T')[0]} 기준 CGV 상영작 조회 중...`);

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
}

main();
