#!/bin/bash

# 프로덕션 환경에서 프리페치 실행 스크립트

if [ -z "$1" ]; then
  echo "사용법: ./scripts/prefetch-production.sh <your-domain.vercel.app>"
  echo "예시: ./scripts/prefetch-production.sh movie-schedule.vercel.app"
  exit 1
fi

DOMAIN=$1

echo "🚀 프로덕션 프리페치 시작..."
echo "🌐 도메인: $DOMAIN"
echo ""

# .env.local에서 크론 시크릿 읽기 (토큰은 URL이 아니라 Authorization 헤더로 보낸다)
if [ -f .env.local ]; then
  CRON_SECRET=$(grep '^CRON_SECRET=' .env.local | cut -d '=' -f2-)
else
  echo "❌ .env.local 파일을 찾을 수 없습니다."
  exit 1
fi

if [ -z "$CRON_SECRET" ]; then
  echo "❌ CRON_SECRET이 설정되지 않았습니다."
  exit 1
fi

# 프리페치 실행 (오늘 날짜만. 다른 날짜는 ?daysAhead=1~6)
echo "📡 API 호출 중... (최대 5분 소요)"
response=$(curl -X POST "https://$DOMAIN/api/schedules/prefetch" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  --max-time 300 \
  -w "\nHTTP_CODE:%{http_code}" \
  -s)

# HTTP 상태 코드 추출
http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d ':' -f2)
body=$(echo "$response" | grep -v "HTTP_CODE:")

echo ""
if [ "$http_code" = "200" ]; then
  echo "✅ 프리페치 성공!"
  echo ""
  echo "$body" | jq '.'
  echo ""
  echo "📊 요약:"
  echo "$body" | jq -r '.results[] | "  \(.date): \(.count)개 스케줄"'
  echo ""
  elapsed=$(echo "$body" | jq -r '.elapsedTime')
  elapsed_sec=$((elapsed / 1000))
  echo "⏱️  소요 시간: ${elapsed_sec}초"
else
  echo "❌ 프리페치 실패 (HTTP $http_code)"
  echo "$body" | jq '.'
  exit 1
fi
