# 성능 최적화 가이드

## 문제점

- 예술영화관 스케줄 조회 시 날짜당 30초 소요
- 매 요청마다 CSRF 토큰 획득을 위해 메인 페이지 크롤링
- 순차적 배치 처리로 인한 병목

## 개선 사항

### 1. CSRF 토큰 캐싱 (즉시 적용)

**변경 내용:**
- `ScheduleService` 클래스에 CSRF 토큰 캐싱 메커니즘 추가
- 토큰을 10분간 재사용하여 불필요한 메인 페이지 크롤링 제거
- 극장당 1회씩 발생하던 토큰 획득을 전체 조회당 1회로 감소

**예상 효과:**
- 조회 시간 50-60% 단축 (30초 → 12-15초)

### 2. 병렬 처리 최적화 (즉시 적용)

**변경 내용:**
- 배치 크기 증가: 4개 → 8개 (로컬), 8개 → 12개 (Vercel)
- 배치 간 딜레이 감소: 500ms → 200ms (로컬), 100ms → 50ms (Vercel)
- 개별 요청 딜레이 제거 (CSRF 토큰 재사용으로 안전)

**예상 효과:**
- 추가 20-30% 속도 향상

### 3. 서버사이드 프리페치 (선택적 적용)

**새로운 API 엔드포인트:**
```
POST /api/schedules/prefetch?token={PREFETCH_TOKEN}
```

**기능:**
- 오늘부터 7일치 스케줄 데이터를 미리 수집
- 수집된 데이터는 캐시에 저장
- 사용자 요청 시 캐시된 데이터 즉시 반환 (< 1초)

**Vercel Cron Job 설정:**
- 매일 6시, 12시, 18시에 자동 실행
- `vercel.json`에 설정 추가됨

## 설정 방법

### 1. 환경 변수 추가

`.env.local` 파일에 다음 추가:

```bash
# 프리페치 API 인증 토큰 (랜덤 문자열 생성)
PREFETCH_TOKEN=your-random-secret-token-here
```

Vercel 대시보드에서도 동일하게 설정:
1. Project Settings → Environment Variables
2. `PREFETCH_TOKEN` 추가 (Production, Preview, Development 모두)

### 2. 로컬에서 프리페치 테스트

```bash
# 서버 실행
npm run dev

# 프리페치 실행 (별도 터미널)
curl -X POST "http://localhost:3000/api/schedules/prefetch?token=your-random-secret-token-here"
```

### 3. Vercel 배포

```bash
git add .
git commit -m "성능 최적화: CSRF 토큰 캐싱 및 프리페치 추가"
git push
```

Vercel에 배포되면 Cron Job이 자동으로 활성화됩니다.

### 4. 수동 프리페치 (필요시)

```bash
# Vercel 프로덕션 환경에서 수동 실행
curl -X POST "https://your-domain.vercel.app/api/schedules/prefetch?token=your-token"
```

## 캐시 관리

### 캐시 통계 확인

```bash
npm run cache:stats
```

### 캐시 정리 (오래된 캐시 제거)

```bash
npm run cache:cleanup
```

### 전체 캐시 삭제

```bash
npm run cache:clear
```

## 성능 비교

### 개선 전
- 첫 조회: ~30초
- 캐시된 조회: ~1초

### 개선 후
- 첫 조회: ~10-12초 (CSRF 토큰 캐싱 + 병렬 처리 최적화)
- 프리페치 사용 시: ~0.5초 (캐시에서 즉시 반환)

## 주의사항

1. **CSRF 토큰 만료**: 토큰이 만료되면 자동으로 새로 획득합니다.

2. **캐시 유효 기간**: 
   - 파일 기반 캐시는 자동으로 관리됨
   - 오래된 캐시는 자동 정리됨

3. **Vercel 제한사항**:
   - Hobby 플랜: Cron Job 사용 불가 (수동 프리페치만 가능)
   - Pro 플랜: Cron Job 사용 가능
   - 함수 실행 시간: 최대 5분 (maxDuration 설정됨)

4. **프리페치 실패 시**:
   - 일부 날짜 실패해도 다른 날짜는 정상 수집
   - 다음 Cron Job 실행 시 재시도

## 추가 최적화 아이디어

1. **Redis 캐시**: 파일 기반 캐시 대신 Redis 사용 (더 빠른 읽기/쓰기)
2. **증분 업데이트**: 전체 재수집 대신 변경된 극장만 업데이트
3. **CDN 캐싱**: Vercel Edge Cache 활용
4. **데이터베이스**: MongoDB 등에 스케줄 저장 (영구 보관)
