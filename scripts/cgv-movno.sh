#!/bin/bash
# launchd(com.moviemania.cgv-movno)가 30분마다 깨우고, 하루 한 번(06:00 이후 첫 깨어 있는 시점)만
# 그날 CGV 상영작 movNo를 조회해 cgvMovNoCache.json을 main에 자동 배포한다.
# 실행 조건은 automation-guard.sh 참고.
set -uo pipefail

PROJECT_ROOT="/Users/choedam-eun/Desktop/work/Movie/movie_mania"
STATE_DIR="$PROJECT_ROOT/.cgv-movno"
# scheduleService.js가 쓰는 cheerio/undici가 Node 18의 전역 File 누락으로 깨져서
# (ReferenceError: File is not defined) Node 22가 반드시 필요함.
export PATH="/Users/choedam-eun/.nvm/versions/node/v22.23.2/bin:/usr/bin:/bin:/usr/sbin:/sbin"

cd "$PROJECT_ROOT"
source scripts/automation-guard.sh

PERIOD=$(date +%F)
(( 10#$(date +%H%M) >= 600 )) || exit 0
guard_should_run "$STATE_DIR" "$PERIOD" 3 || exit 0

# caffeinate -i: 작업이 끝날 때까지 idle sleep을 막는다(덮개를 닫으면 못 막음 → 마감 시간으로 끊음).
if run_with_deadline 2700 caffeinate -i npx tsx src/scripts/batchFetchCgvMovNo.ts; then
  guard_mark_success "$STATE_DIR" "$PERIOD"
fi
