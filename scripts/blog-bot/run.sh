#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="/Users/choedam-eun/Desktop/work/Movie/movie_mania"
DATA_DIR="$PROJECT_ROOT/.blog-bot"
RAW_DIR="$DATA_DIR/raw"
DRAFT_DIR="$DATA_DIR/drafts"
LOG_FILE="$DATA_DIR/log.txt"

# launchd는 로그인 셸 환경을 로드하지 않으므로 PATH를 직접 지정한다.
export PATH="/Users/choedam-eun/.nvm/versions/node/v22.23.2/bin:/usr/bin:/bin:/usr/sbin:/sbin"

mkdir -p "$RAW_DIR" "$DRAFT_DIR"

DATE="${1:-$(date -v-1d +%F)}"

log() { echo "[$(date '+%F %T')] $1" >> "$LOG_FILE"; }

RAW_FILE="$RAW_DIR/$DATE.txt"
DRAFT_FILE="$DRAFT_DIR/$DATE.md"

if ! node "$SCRIPT_DIR/collect.cjs" "$DATE" > "$RAW_FILE"; then
  status=$?
  if [ "$status" -eq 1 ]; then
    log "$DATE: 활동 기록 없음, 초안 생성 스킵"
    rm -f "$RAW_FILE"
    exit 0
  fi
  log "$DATE: collect.js 실행 실패 (exit $status)"
  exit "$status"
fi

PROMPT="$(cat "$SCRIPT_DIR/prompt.txt")"

# 작업 레포 바깥(.blog-bot)에서 실행하고 모든 에이전트 툴을 막아서,
# 순수 텍스트 요약만 하도록 강제한다 (파일 탐색/수정 방지).
cd "$DATA_DIR"
if claude -p "$PROMPT" \
  --model sonnet \
  --output-format text \
  --no-session-persistence \
  --disallowedTools "Bash Read Write Edit Glob Grep WebFetch WebSearch Agent Task NotebookEdit" \
  < "$RAW_FILE" > "$DRAFT_FILE.tmp" 2>>"$LOG_FILE"; then
  mv "$DRAFT_FILE.tmp" "$DRAFT_FILE"
  log "$DATE: 초안 생성 완료 -> $DRAFT_FILE"
else
  log "$DATE: claude -p 실행 실패"
  rm -f "$DRAFT_FILE.tmp"
  exit 1
fi
