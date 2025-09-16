# 배포 가이드

## 환경 변수 설정

배포 전에 다음 환경 변수들을 설정해야 합니다:

### 필수 환경 변수

```bash
# KOBIS API 키 (영화진흥위원회 오픈 API)
KOBIS_API_KEY=your_kobis_api_key_here

# KMDB API 키 (한국영상자료원 API)
KMDB_API_KEY=your_kmdb_api_key_here
```

### 선택적 환경 변수

```bash
# 캐시 TTL 설정 (시간 단위, 기본값: 6)
CACHE_TTL_HOURS=6

# 캐시 정리 주기 (밀리초, 기본값: 3600000 = 1시간)
CACHE_CLEANUP_INTERVAL=3600000

# 앱 URL (프로덕션 환경)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 플랫폼별 배포 방법

### 1. Vercel 배포

1. Vercel CLI 설치 및 로그인:

```bash
npm i -g vercel
vercel login
```

2. 프로젝트 배포:

```bash
vercel
```

3. Vercel 대시보드에서 환경 변수 설정:
   - Settings > Environment Variables
   - 다음 환경 변수들을 추가:
     - `KOBIS_API_KEY`: 609eba269acb357be05be4ec60202702
     - `KMDB_API_KEY`: 23QYU3V707Y5O2M7R25J
     - `CACHE_TTL_HOURS`: 6 (선택사항)

### 2. Netlify 배포

1. 빌드 명령어 설정:

```bash
npm run build
```

2. 환경 변수 설정:
   - Site settings > Environment variables
   - `KOBIS_API_KEY` 추가

### 3. AWS/GCP/Azure 배포

Docker를 사용한 배포:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

환경 변수는 컨테이너 실행 시 설정:

```bash
docker run -e KOBIS_API_KEY=your_key -p 3000:3000 your-app
```

## 캐시 디렉토리 설정

배포 환경에서 캐시 디렉토리 권한 확인:

- `.cache` 디렉토리에 읽기/쓰기 권한 필요
- 서버리스 환경에서는 `/tmp` 디렉토리 사용 권장

## 보안 고려사항

1. **API 키 보안**: 환경 변수로만 관리, 코드에 하드코딩 금지
2. **CORS 설정**: 필요시 특정 도메인만 허용
3. **Rate Limiting**: API 호출 제한 설정 권장
4. **HTTPS**: 프로덕션에서는 반드시 HTTPS 사용

## 성능 최적화

1. **캐시 설정**:

   - 당일 데이터: 자정까지 캐시
   - 미래 데이터: 6시간 캐시 (환경 변수로 조정 가능)

2. **CDN 활용**: 정적 파일은 CDN을 통해 배포

3. **모니터링**:
   - 캐시 히트율 모니터링
   - API 응답 시간 모니터링

## Vercel 특화 설정

### 1. 서버리스 환경 최적화

이 앱은 Vercel 서버리스 환경에 맞게 최적화되었습니다:

- **파일 캐시**: `/tmp` 디렉토리 사용
- **메모리 캐시**: 메인 캐시 시스템
- **타임아웃**: 10초 제한에 맞춘 최적화
- **재시도 로직**: 서버리스 환경에 맞게 조정

### 2. 환경 변수 자동 감지

`VERCEL=1` 환경 변수가 자동으로 설정되어 다음 기능들이 최적화됩니다:

- 캐시 디렉토리: `/tmp/cache` 사용
- 네트워크 타임아웃: 8초로 단축
- 재시도 횟수: 2회로 감소
- 딜레이: 최소화

### 3. Puppeteer 설정

Vercel에서 Puppeteer 사용 시 자동으로 적용되는 설정:

```javascript
const browser = await puppeteer.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-accelerated-2d-canvas",
    "--no-first-run",
    "--no-zygote",
    "--single-process",
    "--disable-gpu",
  ],
});
```

## 트러블슈팅

### 일반적인 문제들

1. **타임아웃 에러**: API 호출이 10초를 초과하는 경우

   - 해결: 캐시 데이터 사용 또는 Pro 플랜 업그레이드

2. **파일 시스템 에러**: 캐시 저장 실패

   - 해결: 메모리 캐시만 사용 (자동 처리됨)

3. **Puppeteer 에러**: 브라우저 실행 실패
   - 해결: headless 모드 및 Vercel 호환 설정 (자동 적용)

### 캐시 관련 이슈

```bash
# 캐시 통계 확인
curl https://your-domain.com/api/cache?action=stats

# 캐시 정리
curl https://your-domain.com/api/cache?action=cleanup

# 전체 캐시 삭제
curl -X DELETE https://your-domain.com/api/cache
```

### API 키 이슈

- KOBIS API 키가 올바른지 확인
- 환경 변수가 제대로 설정되었는지 확인

## 로컬 개발 환경 설정

1. `.env.local` 파일 생성:

```bash
KOBIS_API_KEY=609eba269acb357be05be4ec60202702
CACHE_TTL_HOURS=6
```

2. 개발 서버 실행:

```bash
npm run dev
```

## 주요 기능

- ✅ 캐시 시스템으로 중복 크롤링 방지
- ✅ 환경 변수를 통한 보안 강화
- ✅ 당일/미래 데이터 별 차별화된 캐시 전략
- ✅ 메모리 + 파일 이중 캐시 시스템
- ✅ 강제 새로고침 기능
