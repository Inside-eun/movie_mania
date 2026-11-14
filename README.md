# 영화방랑자 — 예술영화 상영시간표

서울 예술영화관·독립영화관의 상영 정보를 한곳에서 확인할 수 있는 웹 서비스.
프로덕션: <https://moviemania-olive.vercel.app> (iOS 앱은 같은 주소를 Capacitor로 감싼 형태)

## 주요 기능

- **상영시간표 통합 조회**: 예술영화관 28곳의 7일치 시간표를 날짜별로 조회 
- **필터·정렬**: 영화/극장 멀티 필터, 시간순·거리순 정렬
- **지도**: 카카오맵으로 극장 위치와 현재 위치 기준 이동시간 어림값 표시
- **영화 상세 페이지** (`/movie/[slug]`): TMDB 포스터·크레딧, 같은 기획전·감독·배우 기준 추천작
- **예매 바로가기**: CGV·메가박스·롯데시네마와 독립영화관 예매 시스템(dtryx·moviee)의 극장별 예매 페이지로 연결
- **기획전**: 극장 인스타그램에서 매주 자동으로 수집한 기획전·특별상영 목록
- **찜 목록**: 로컬 저장, 캘린더 보기, 상영 임박 알림 (iOS 앱)
- **통계 대시보드** (`/analytics`): GA4 지표를 보는 비밀번호 보호 페이지
- **PWA / iOS 앱**: 홈 화면 설치, 오프라인 페이지, 햅틱·로컬 알림 (Capacitor)

## 기술 스택

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **데이터**: KOBIS·KOFA(시간표), KMDB(영화 정보), TMDB(포스터·크레딧), 각 예매처 페이지
- **Cache**: Upstash Redis (Redis 미설정 시 로컬 `.cache/` 파일 캐시)
- **Deploy**: Vercel (서버리스 + Cron)
- **App**: Capacitor 8 (iOS)
- **기타**: 카카오맵, GA4, Playwright(E2E), puppeteer(CGV movNo 조회)

## 시작하기

### 환경 변수

`.env.example`을 `.env.local`로 복사해서 값을 채운다. 항목별 설명은 `.env.example`의 주석 참고.

| 용도 | 변수 |
| --- | --- |
| 시간표·영화 정보 | `KOBIS_API_KEY`, `KMDB_API_KEY`, `TMDB_API_KEY` |
| 지도 | `NEXT_PUBLIC_KAKAO_MAP_KEY` |
| 캐시 (선택) | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — 없으면 `.cache/` 파일 캐시 사용 |
| 분석 | `NEXT_PUBLIC_GA_ID`, `GA4_CLIENT_EMAIL`, `GA4_PRIVATE_KEY`, `GA4_PROPERTY_ID` |
| 통계 대시보드 | `ANALYTICS_PASSWORD`, `ANALYTICS_SESSION_SECRET`, `ANALYTICS_TOKEN` |
| 프리페치 크론 | `CRON_SECRET` |
| 인스타 기획전 스캔 (로컬 전용) | `IG_SCRAPER_USERNAME`, `IG_SCRAPER_PASSWORD` — 반드시 전용 계정 |

### 실행

```bash
npm install
npm run dev        # http://localhost:3000
```

### 주요 스크립트

| 명령 | 내용 |
| --- | --- |
| `npm run build` | 프로덕션 빌드 |
| `npm run test:e2e` | Playwright E2E 테스트 (프로덕션 대상, 로컬은 `test:e2e:local`) |
| `npm run prefetch:local` / `prefetch:prod` | 7일치 상영 스케줄 수동 프리페치 |
| `npm run cache:stats` / `cache:clear` | 캐시 상태 확인 / 전체 삭제 (dev 서버 실행 중일 때) |
| `npm run cgv:movno:batch` | 그날 CGV 상영작 movNo 일괄 조회 후 main에 자동 배포 |
| `npm run scan:instagram` / `sync:instagram` | 인스타 기획전 스캔 / 검증 후 반영 |
| `npm run status:dashboard:open` | 자동화 상태 대시보드 생성 후 열기 |
| `npm run test:crawler` | 상영시간표 크롤러 단독 실행 점검 |

## 프로젝트 구조

```text
src/
├── app/
│   ├── page.tsx              # 메인 (홈·찜·기획전·설정 탭)
│   ├── movie/[slug]/         # 영화 상세 페이지
│   ├── analytics/            # GA4 통계 대시보드 (로그인 필요)
│   └── api/
│       ├── schedules/        # 상영시간표 조회 + prefetch / prefetch-tmdb 크론
│       ├── booking-url/      # 예매처별 예매 링크 조회
│       ├── movie-info/ movie-credits/ tmdb-movies/   # 영화 정보·크레딧·포스터
│       ├── analytics/ analytics-auth/                # 통계 API, 대시보드 로그인
│       └── cache/            # 캐시 관리
├── components/               # UI 컴포넌트 (각 탭 View, 지도, 필터 등)
├── hooks/                    # 시간표·필터·찜 목록 상태 훅
├── services/
│   ├── scheduleService.js    # 극장별 시간표 수집
│   ├── cacheService.ts       # Redis / 파일 캐시
│   ├── kobisApi.ts tmdbApi.ts
├── lib/
│   ├── booking/              # 예매처별 링크 생성 + cgvMovNoCache.json
│   ├── recommendations.ts    # 상세 페이지 추천작 규칙
│   ├── travelEstimate.ts     # 직선거리 기반 이동시간 어림
│   └── ga4*.ts analyticsAuth.ts cronAuth.ts haptics.ts localNotifications.ts ...
├── data/
│   ├── artCinemas.js         # 예술영화관 목록 (코드·좌표·주소)
│   ├── theaterScreenFilters.js  # 극장별 아트하우스 상영관 필터
│   └── events.json / events.ts  # 기획전 데이터 (인스타 자동화가 갱신)
├── scripts/                  # tsx로 실행하는 로컬 자동화 스크립트
├── utils/                    # 날짜 계산, GA4 이벤트 추적
└── types/
scripts/                      # 자동화 셸 스크립트, launchd 설정
e2e/                          # Playwright 테스트
ios/                          # Capacitor iOS 프로젝트
docs/                         # 설계·운영 문서
```

## 자동화

| 작업 | 실행 위치 | 주기 | 내용 |
| --- | --- | --- | --- |
| 상영 스케줄 프리페치 | Vercel Cron | 매일 06:00~06:30 | 오늘~6일 뒤 시간표를 미리 수집해 Redis에 저장 |
| TMDB 포스터 프리페치 | Vercel Cron | 매일 07:00~07:30 | 7일치 상영작 포스터·정보 보완 |
| CGV movNo 갱신 | 로컬 launchd | 매일 06:00 이후 | puppeteer로 movNo 조회 → `src/lib/booking/cgvMovNoCache.json`을 main에 자동 배포 |
| 인스타 기획전 반영 | 로컬 launchd | 매주 월요일 07:30 이후 | 극장 인스타 스캔 → 검증 통과분만 `src/data/events.json`을 main에 자동 배포 |
| 자동화 상태 대시보드 | 로컬 launchd | 매일 08:15 | 위 작업들의 성공 여부를 `.status-dashboard/index.html`로 생성 |

- 로컬 작업은 launchd가 30분마다 깨우고, 실제 실행은 [scripts/automation-guard.sh](scripts/automation-guard.sh)가 노트북이 완전히 깨어 있을 때 주기당 한 번만 하도록 막는다. 노트북을 덮어 놓아 놓친 실행은 다음에 열었을 때 따라잡는다.
- 로컬 자동 배포 스크립트는 로컬 체크아웃을 건드리지 않고 origin/main 위에 해당 파일만 커밋해서 push한다. 단, 스크립트 코드 자체는 지금 체크아웃된 브랜치 것이 실행되므로 오래된 브랜치를 체크아웃한 채로 두지 않는다.
- launchd 설정은 [scripts/launchd/](scripts/launchd/)에 있다.

## iOS 앱

Capacitor가 프로덕션 URL을 웹뷰로 감싸는 구조라 웹을 배포하면 앱 화면도 함께 바뀐다. 네이티브 설정이나 플러그인을 바꿨을 때만 다시 빌드한다.

```bash
npx cap sync ios
npx cap open ios   # Xcode에서 빌드·실행
```

Capacitor CLI 8은 Node 22 이상이 필요하다.

## 배포

`main` 브랜치에 push하면 Vercel이 자동 배포한다. 위 환경 변수를 Vercel 프로젝트에도 같은 값으로 등록해야 한다.
상영 스케줄 프리페치 구조는 [docs/prefetch.md](docs/prefetch.md) 참고.

## 문서

설계·운영 문서는 [docs/](docs/) 폴더에 모아둔다. 목록은 [docs/README.md](docs/README.md).

## 라이선스

MIT
