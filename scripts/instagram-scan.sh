#!/bin/bash
# 매주 launchd(com.moviemania.instagram-scan)가 실행한다.
# 1) 극장 인스타그램 스캔 → .instagram-scan/review-<날짜>.json
# 2) 후보를 claude -p로 정리·검증해서 통과한 기획전만 events.json에 반영하고 main에 자동 배포
#    (보류된 건은 .instagram-scan/sync-<날짜>.json과 상태 대시보드에서 확인)
set -uo pipefail

PROJECT_ROOT="/Users/choedam-eun/Desktop/work/Movie/movie_mania"

# launchd는 로그인 셸 환경을 로드하지 않으므로 PATH를 직접 지정한다 (claude CLI도 여기 있음).
export PATH="/Users/choedam-eun/.nvm/versions/node/v22.23.2/bin:/usr/bin:/bin:/usr/sbin:/sbin"

cd "$PROJECT_ROOT"
echo ""
echo "[$(date '+%F %T')] 인스타그램 기획전 스캔 시작"

if ! npx tsx src/scripts/scan-instagram-events.ts; then
  echo "스캔이 실패해서 기획전 자동 반영은 건너뜀"
  exit 1
fi

npx tsx src/scripts/sync-instagram-events.ts
