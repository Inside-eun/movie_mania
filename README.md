# 예술영화 상영시간표

전국 예술영화관의 상영 정보를 한곳에서 확인할 수 있는 웹 서비스.

## 주요 기능

- 전국 예술영화관 상영시간표 통합 조회
- 박스오피스 상위 5위 자동 필터링 (예술영화 특화)
- 영화/극장별 멀티 필터링
- 위시리스트 (로컬 저장)
- 다크모드 지원
- PWA 지원 (모바일 앱처럼 설치 가능)

## 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **API**: KOBIS (영화진흥위원회), KMDB (한국영화데이터베이스)
- **Deploy**: Vercel (서버리스)
- **Cache**: Upstash Redis (로컬은 `.cache/` 파일 캐시), Vercel Cron으로 7일치 미리 수집

## 시작하기

### 환경 변수 설정

`.env.local` 파일 생성:

```bash
KOBIS_API_KEY=your_kobis_api_key
KMDB_API_KEY=your_kmdb_api_key
```

API 키 발급:
- KOBIS: https://www.kobis.or.kr/kobisopenapi
- KMDB: https://www.kmdb.or.kr/info/api/apiDetail/6

### 실행

```bash
npm install
npm run dev
```

http://localhost:3000 에서 확인.

## 프로젝트 구조

```
src/
├── app/
│   ├── api/
│   │   ├── schedules/    # 상영시간표 조회 API
│   │   ├── movie-info/   # 영화 상세정보 API
│   │   └── cache/        # 캐시 관리 API
│   └── page.tsx          # 메인 페이지
├── components/           # UI 컴포넌트
├── services/
│   ├── scheduleService.js  # 스케줄 조회 서비스
│   └── cacheService.ts     # 캐시 서비스
├── data/
│   └── artCinemas.js     # 예술영화관 목록
└── types/                # TypeScript 타입 정의
```

## 배포

`main` 브랜치에 push하면 Vercel이 자동 배포한다 (프로덕션: https://moviemania-olive.vercel.app).
Vercel 환경 변수에는 위 API 키 외에 `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`(캐시),
`TMDB_API_KEY`(포스터), `CRON_SECRET`(프리페치 크론 인증)이 필요하다.
상영 스케줄 프리페치 구조는 [docs/prefetch.md](docs/prefetch.md) 참고.

## 문서

설계·운영 문서는 [docs/](docs/) 폴더에 모아둔다. 목록은 [docs/README.md](docs/README.md).

## 라이선스

MIT
