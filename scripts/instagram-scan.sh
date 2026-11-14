#!/bin/bash
# launchd(com.moviemania.instagram-scan)가 30분마다 깨우고, 주 1회(월요일 07:30 이후 첫 깨어 있는 시점)만 실행한다.
# 실행 조건은 automation-guard.sh 참고.
# 1) 극장 인스타그램 스캔 → .instagram-scan/review-<날짜>.json
# 2) 후보를 claude -p로 정리·검증해서 통과한 기획전만 events.json에 반영하고 main에 자동 배포
#    (보류된 건은 .instagram-scan/sync-<날짜>.json과 상태 대시보드에서 확인)
set -uo pipefail

PROJECT_ROOT="/Users/choedam-eun/Desktop/work/Movie/movie_mania"
STATE_DIR="$PROJECT_ROOT/.instagram-scan"

# launchd는 로그인 셸 환경을 로드하지 않으므로 PATH를 직접 지정한다 (claude CLI도 여기 있음).
export PATH="/Users/choedam-eun/.nvm/versions/node/v22.23.2/bin:/usr/bin:/bin:/usr/sbin:/sbin"

cd "$PROJECT_ROOT"
source scripts/automation-guard.sh

# 주기 키 = 이번 주 월요일 날짜. 월요일은 07:30부터, 화~일은 바로 대상이 된다.
PERIOD=$(date -v-$(( $(date +%u) - 1 ))d +%F)
if [ "$(date +%u)" = "1" ]; then
  (( 10#$(date +%H%M) >= 730 )) || exit 0
fi
# 인스타 계정 자동화 탐지가 걱정돼서 주당 시도는 2번까지만.
guard_should_run "$STATE_DIR" "$PERIOD" 2 || exit 0

echo "[$(date '+%F %T')] 인스타그램 기획전 스캔 시작"

if ! run_with_deadline 3600 caffeinate -i npx tsx src/scripts/scan-instagram-events.ts; then
  echo "스캔이 실패해서 기획전 자동 반영은 건너뜀"
  exit 1
fi

if run_with_deadline 1800 caffeinate -i npx tsx src/scripts/sync-instagram-events.ts; then
  guard_mark_success "$STATE_DIR" "$PERIOD"
fi
