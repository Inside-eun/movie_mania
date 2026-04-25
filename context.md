# Movie Mania - Context

## Project Overview
예술영화관 + 한국영상자료원(KOFA) 상영 스케줄을 크롤링하고,
TMDB API로 포스터를 가져와 영화 카드에 표시하는 Next.js 앱.
배포: Vercel (Hobby 플랜), 캐시: Upstash Redis

## Architecture
- `/api/schedules` → 크롤링 결과 반환 + `mergeTMDBData`로 tmdb_db에서 포스터 머지
- `/api/schedules/prefetch` → Vercel Cron이 매일 오전 6시 호출, 크롤링 + TMDB 검색 수행
- `/api/tmdb-movies` → tmdb_db 기반 포스터 목록 반환 (현재 미사용)
- `cacheService` → Upstash Redis (운영) / 로컬 파일 캐시 (개발)
- Redis 키: `"integrated_{날짜}_"` (스케줄), `"tmdb_db"` (TMDB 포스터 DB)

## Data Flow (설계)
```
Cron → crawlArtCinemasWithKMDBByDate() → Redis "integrated" 저장
     → prefetchTMDBForMovies()         → Redis "tmdb_db" 저장 (posterUrl 포함)

사용자 요청 → /api/schedules
  → "integrated" 캐시 히트
  → mergeTMDBData()로 tmdb_db에서 tmdbPosterUrl 머지
  → MovieGrid에서 movie.tmdbPosterUrl || movie.posterUrl 표시
```

## Completed
- `prefetch/route.ts` 캐시 키 버그 수정: `"art_cinema_kfcc"` → 제거 (crawlArtCinemasWithKMDBByDate 내부에서 이미 `"integrated"`로 저장)
- `prefetchTMDBForMovies` 반환값 개선: TMDB 검색 후 각 movie 객체에 `tmdbPosterUrl` 주입한 `enrichedMovies` 반환 → `"integrated"` 캐시 덮어쓰기
- `schedules/route.ts`에 `mergeTMDBData` 함수 이미 존재 확인 (tmdb_db → tmdbPosterUrl 머지)

## In Progress
- Vercel Cron 타임아웃 문제 해결 중
  - Hobby 플랜 제한: Serverless Function 최대 10초
  - 크롤링(예술영화관 29개 + KOFA) 자체가 ~6-8초 → TMDB 검색까지 실행 못 함
  - Cron 로그 확인: 배치 2/3 도중 TMDB 로그 없이 끊김

## Blockers / Next Steps
- **핵심 문제**: Hobby 플랜 10초 타임아웃으로 TMDB 검색이 실행되지 않아 포스터 미표시
- **해결 방안 A (코드)**: Cron을 2단계로 분리
  - Cron 1 (오전 6시): 크롤링만 → `"integrated"` 저장
  - Cron 2 (오전 6시 5분): TMDB 검색만 → `tmdb_db` 저장
  - `vercel.json`에 Cron 추가, TMDB 전용 `/api/schedules/prefetch-tmdb` 엔드포인트 생성
- **해결 방안 B (플랜)**: Vercel Pro 업그레이드 ($20/월) → `maxDuration = 300` 유효
- 사용자가 A/B 중 결정 필요
