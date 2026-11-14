#!/bin/bash
# launchd 자동화(cgv-movno.sh, instagram-scan.sh)가 source해서 쓰는 공통 가드.
#
# 노트북을 덮어두면 launchd가 몇 초짜리 DarkWake 틈에 작업을 깨워서, 작업이 조각조각 돌다가
# 네트워크 끊김·타임아웃으로 실패하거나 한 번 시작한 실행이 일주일 동안 안 끝나 다음 실행까지
# 막았다(2026-11-03 ~ 11-14 실제 발생). 그래서 launchd는 30분마다 깨우기만 하고, 실제 작업은
# 아래 조건을 모두 만족할 때만 돈다. 놓친 실행은 다음에 노트북을 열었을 때 따라잡는다.
#   1) 완전히 깨어난 상태 (DarkWake에는 Graphics 능력이 없다)
#   2) 이번 주기(오늘 / 이번 주)에 아직 성공한 적이 없음
#   3) 이번 주기 시도 횟수가 최대치 미만 (계속 실패해도 30분마다 두드리지 않도록)

is_fully_awake() {
  pmset -g systemstate | grep -q "Graphics"
}

# guard_should_run <상태 폴더> <주기 키> <최대 시도 횟수>
# 돌아야 하면 시도 횟수를 1 올리고 0을 반환한다.
guard_should_run() {
  local dir=$1 key=$2 max=$3
  mkdir -p "$dir"
  [ "$(cat "$dir/guard-success" 2>/dev/null)" = "$key" ] && return 1
  is_fully_awake || return 1

  local prev_key="" count=0
  [ -f "$dir/guard-attempts" ] && read -r prev_key count < "$dir/guard-attempts"
  [ "$prev_key" = "$key" ] || count=0
  [ "${count:-0}" -ge "$max" ] && return 1
  echo "$key $((count + 1))" > "$dir/guard-attempts"
  echo ""
  echo "[$(date '+%F %T')] 자동 실행 시작 (주기 $key, 시도 $((count + 1))/$max)"
  return 0
}

guard_mark_success() {
  echo "$2" > "$1/guard-success"
}

# caffeinate → npx → node → Chrome처럼 여러 단계로 뜬 자식까지 전부 끈다.
kill_tree() {
  local child
  for child in $(pgrep -P "$1"); do
    kill_tree "$child"
  done
  kill -TERM "$1" 2>/dev/null
}

# run_with_deadline <초> <명령...>
# 실행 중에 노트북이 잠들면 sleep/타이머가 멈춰서 안 끝나므로, 실제 시계(date)로 마감을 잰다.
run_with_deadline() {
  local limit=$1
  shift
  local deadline=$(($(date +%s) + limit))
  "$@" &
  local pid=$!
  while kill -0 "$pid" 2>/dev/null; do
    if [ "$(date +%s)" -ge "$deadline" ]; then
      echo "❌ ${limit}초 안에 끝나지 않아 중단 (실행 중 잠자기 등) — 다음 주기에 다시 시도"
      kill_tree "$pid"
      wait "$pid" 2>/dev/null
      return 124
    fi
    sleep 15
  done
  wait "$pid"
}
