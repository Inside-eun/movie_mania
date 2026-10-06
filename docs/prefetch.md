# 상영 스케줄 프리페치 (Vercel Cron)

예술영화관 상영 스케줄은 KOBIS(극장별 시간표)와 KMDB(한국영상자료원)에서 크롤링해 오는데, 사용자가 날짜를 열 때마다 크롤링하면 느리다. 그래서 Vercel Cron이 매일 오늘부터 7일치를 미리 크롤링해 Upstash Redis에 넣어두고, 사용자 요청은 캐시에서 바로 응답한다.

## 전체 흐름

```text
[Cron 1] /api/schedules/prefetch?daysAhead=N   (N = 0~6, 날짜별로 따로 호출)
   → 그 날짜 캐시 삭제 → 크롤링 → Redis에 저장
        integrated_YYYYMMDD_   (예술영화관 + KOFA 통합)
        art_cinemas_YYYYMMDD_  (예술영화관만)
        kofa_api_YYYYMMDD_     (KOFA만)

[Cron 2] /api/schedules/prefetch-tmdb?daysAhead=N
   → integrated 캐시의 영화 제목 중 tmdb_db에 없는 것만 TMDB 검색
   → tmdb_db 갱신, integrated 캐시에 tmdbPosterUrl을 넣어 덮어쓰기

[사용자] /api/schedules?date=YYYY-MM-DD
   → 캐시 히트: 바로 반환
   → 캐시 미스: 그 자리에서 크롤링 후 캐시에 저장 (첫 요청만 느림)
```

| 항목 | 값 |
| --- | --- |
| 캐시 저장소 | Upstash Redis (`UPSTASH_REDIS_REST_URL/TOKEN`이 없으면 로컬 `.cache/` 파일) |
| 스케줄 캐시 TTL | 24시간 |
| `tmdb_db` TTL | 7일 |
| 함수 최대 실행 시간 | 60초 (`maxDuration`). 한 번 호출에 하루치만 처리하는 이유 |

## 크론 일정

[vercel.json](../vercel.json)의 `crons`에 정의돼 있다. **Vercel Cron 시간은 UTC 기준**이다.

| 크론 | 설정(UTC) | 한국 시간 |
| --- | --- | --- |
| Cron 1 크롤링 (daysAhead 0~6) | 매일 06:00 ~ 06:30, 5분 간격 | 15:00 ~ 15:30 |
| Cron 2 TMDB 포스터 (daysAhead 0~6) | 매일 07:00 ~ 07:30, 5분 간격 | 16:00 ~ 16:30 |

Hobby 플랜이라 크론은 설정한 시각이 아니라 **그 시간대(1시간) 안 아무 때나** 실행된다. 예를 들어 15:00으로 잡힌 크론이 15:52에 돌기도 한다. Cron 2가 해당 날짜의 Cron 1보다 먼저 돌면 "크롤링 캐시 없음"(400)으로 끝나고, 그날은 포스터가 다음 날 크론이나 사용자 요청 때 채워진다.

## 인증 (`CRON_SECRET`)

두 프리페치 API는 `Authorization: Bearer <CRON_SECRET>` 헤더로만 인증한다 ([src/lib/cronAuth.ts](../src/lib/cronAuth.ts)). Vercel 프로젝트에 `CRON_SECRET` 환경 변수가 있으면 Vercel Cron이 이 헤더를 자동으로 붙인다.

> 토큰을 URL 쿼리스트링(`?token=...`)에 넣지 않는다. 이 저장소는 공개라 `vercel.json`에 적으면 누구나 볼 수 있고, URL은 Vercel 요청 로그와 Referer에도 남는다. (2026-10-06에 예전 `PREFETCH_TOKEN` 방식을 폐기했다.)

설정 위치:

- **Vercel**: Settings → Environment Variables → `CRON_SECRET` (Production, Sensitive)
- **로컬 `.env.local`**: 같은 값의 `CRON_SECRET=` — 아래 수동 실행 스크립트가 읽는다

시크릿을 바꿀 때:

```bash
openssl rand -hex 32                                   # 새 값 생성
npx vercel env rm CRON_SECRET production --yes
printf '%s' '<새 값>' | npx vercel env add CRON_SECRET production --sensitive
# .env.local의 CRON_SECRET도 같은 값으로 바꾼 뒤, main에 아무 커밋이나 배포해야 새 값이 적용된다
```

## 수동 실행

```bash
# 프로덕션 (오늘 날짜만)
npm run prefetch:prod moviemania-olive.vercel.app

# 로컬 dev 서버 (npm run dev 실행 중이어야 함, .env.local을 바꿨다면 dev 서버 재시작)
npm run prefetch:local
```

다른 날짜는 `daysAhead`를 붙여 직접 호출한다:

```bash
CRON_SECRET=$(grep '^CRON_SECRET=' .env.local | cut -d= -f2-)
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://moviemania-olive.vercel.app/api/schedules/prefetch?daysAhead=3"
```

응답 예시: `{"success":true,"results":[{"date":"2026-10-12","count":68,"success":true}],"elapsedTime":7151}`

## 조회 API

```bash
curl "https://moviemania-olive.vercel.app/api/schedules?date=2026-10-08"             # 캐시 우선
curl "https://moviemania-olive.vercel.app/api/schedules?date=2026-10-08&force=true"  # 캐시 무시하고 새로 크롤링
```

`/api/cache`(`npm run cache:stats` / `cache:cleanup` / `cache:clear`)는 로컬 파일 캐시용이다. Redis를 쓰는 환경에서는 TTL이 알아서 만료시키므로 `cleanup`/`clear`가 아무것도 하지 않는다.

## 상태 확인과 문제 해결

**상태 대시보드**: `npm run status:dashboard:open` → "포스터 · 상영 스케줄 조회 (Vercel Cron)" 카드가 Redis를 직접 조회해 오늘부터 7일치 중 비어 있는 날짜를 보여준다.

**Vercel 로그**: Hobby 플랜은 실행 로그를 1시간만 보관하므로 크론이 돈 직후에 확인해야 한다.

```bash
npx vercel logs --environment production --since 1h --query prefetch
```

| 증상 | 확인할 것 |
| --- | --- |
| prefetch가 401 | Vercel에 `CRON_SECRET`이 있는지, 추가/변경 후 재배포했는지 |
| prefetch가 504 (60초 타임아웃) | 로그가 "크롤링 중..."에서 끊기면 크롤링 전 캐시 삭제 단계에서 멈춘 것. 2026-10-06에 고친 `deleteAllByTypeDate`의 SCAN 커서 버그(문자열 `"0"`을 숫자 `0`과 비교해 무한 반복)가 다시 생기지 않았는지 확인 |
| prefetch-tmdb가 400 | 같은 날짜의 Cron 1이 아직 안 돌았거나 실패한 것 (위 Hobby 실행 시각 참고) |
| 특정 날짜만 비어 있음 | 수동 실행으로 그 날짜를 채우고, 로그에서 그날 Cron 1 응답 코드 확인 |
