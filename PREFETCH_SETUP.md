# 서버사이드 프리페치 설정 완료 ✅

## 로컬 테스트 결과

✅ **프리페치 성공**: 7일치 데이터를 22초만에 수집
✅ **캐시 조회 속도**: 0.7초 (기존 30초 대비 **40배 빠름**)

```json
{
  "date": "2026-04-06", "count": 141,
  "date": "2026-04-07", "count": 159,
  "date": "2026-04-08", "count": 167,
  "date": "2026-04-09", "count": 119,
  "date": "2026-04-10", "count": 103,
  "date": "2026-04-11", "count": 78,
  "date": "2026-04-12", "count": 77
}
```

## Vercel 배포 방법

### 1단계: Vercel 환경 변수 설정

Vercel 대시보드에서:
1. 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 다음 변수 추가:

```
Name: PREFETCH_TOKEN
Value: iaDFUuG43dOzkb6mXQazntv6NfU2QFw0Hk2i/hHFpWI=
Environment: Production, Preview, Development (모두 체크)
```

### 2단계: 코드 배포

```bash
git add .
git commit -m "feat: 서버사이드 프리페치 추가 (30초→0.7초)"
git push
```

### 3단계: Vercel Cron Job 확인

배포 후 Vercel 대시보드에서:
1. 프로젝트 → **Settings** → **Cron Jobs**
2. 다음 스케줄 확인:
   - **매일 06:00** (오전 6시)
   - **매일 12:00** (낮 12시)
   - **매일 18:00** (오후 6시)

> ⚠️ **주의**: Cron Jobs는 **Vercel Pro 플랜** 이상에서만 사용 가능합니다.
> Hobby 플랜 사용 시 수동으로 프리페치를 실행해야 합니다.

### 4단계: 수동 프리페치 (선택사항)

배포 직후 또는 Hobby 플랜 사용 시:

```bash
# 프로덕션 환경에서 수동 실행
curl -X POST "https://your-domain.vercel.app/api/schedules/prefetch?token=iaDFUuG43dOzkb6mXQazntv6NfU2QFw0Hk2i/hHFpWI="
```

## 사용 방법

### 일반 조회 (캐시 우선)

```bash
# 오늘 스케줄 조회 (캐시에 있으면 0.7초, 없으면 10-12초)
curl "https://your-domain.vercel.app/api/schedules"

# 특정 날짜 조회
curl "https://your-domain.vercel.app/api/schedules?date=2026-04-08"
```

### 강제 새로고침

```bash
# 캐시 무시하고 최신 데이터 수집
curl "https://your-domain.vercel.app/api/schedules?force=true"
```

## 캐시 관리

### 캐시 통계 확인

```bash
curl "http://localhost:3000/api/cache?action=stats" | jq .
```

### 오래된 캐시 정리

```bash
curl "http://localhost:3000/api/cache?action=cleanup"
```

### 전체 캐시 삭제

```bash
curl -X DELETE "http://localhost:3000/api/cache"
```

## 성능 비교

| 시나리오 | 속도 | 설명 |
|---------|------|------|
| 개선 전 | 30초 | 매번 크롤링 |
| CSRF 캐싱 | 10-12초 | 토큰 재사용 |
| 프리페치 (캐시 히트) | **0.7초** | 미리 수집된 데이터 |
| 프리페치 (캐시 미스) | 10-12초 | 자동으로 수집 후 캐시 |

## 동작 원리

1. **Cron Job 실행** (매일 3회)
   - `/api/schedules/prefetch` 호출
   - 오늘부터 7일치 데이터 수집
   - 파일 캐시에 저장

2. **사용자 요청**
   - `/api/schedules?date=2026-04-08` 호출
   - 캐시 확인 → 있으면 즉시 반환 (0.7초)
   - 없으면 크롤링 후 캐시 저장 (10-12초)

3. **캐시 만료**
   - 6시간 후 자동 만료 (CACHE_TTL_HOURS)
   - 다음 Cron Job에서 자동 갱신

## 문제 해결

### Cron Job이 실행되지 않는 경우

1. **Vercel 플랜 확인**
   - Hobby 플랜: Cron 미지원 → 수동 실행 필요
   - Pro 플랜: Cron 지원

2. **환경 변수 확인**
   ```bash
   # Vercel CLI로 확인
   vercel env ls
   ```

3. **로그 확인**
   - Vercel 대시보드 → Logs
   - 에러 메시지 확인

### 캐시가 작동하지 않는 경우

```bash
# 캐시 통계 확인
npm run cache:stats

# 캐시 디렉토리 확인
ls -la .cache/
```

## 추가 최적화

현재 설정으로도 충분하지만, 더 개선하려면:

1. **Redis 캐시**: 파일 대신 Redis 사용 (더 빠름)
2. **MongoDB**: 영구 데이터 저장
3. **CDN 캐싱**: Vercel Edge Cache 활용
4. **증분 업데이트**: 변경된 극장만 재수집

## 비용 고려사항

- **Hobby 플랜**: 무료, Cron 없음 (수동 실행)
- **Pro 플랜**: $20/월, Cron 지원
- **함수 실행 시간**: 프리페치 1회당 ~20-30초

### Hobby 플랜 사용 시 대안

GitHub Actions로 무료 Cron 구현:

```yaml
# .github/workflows/prefetch.yml
name: Prefetch Schedules
on:
  schedule:
    - cron: '0 6,12,18 * * *'
jobs:
  prefetch:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST "https://your-domain.vercel.app/api/schedules/prefetch?token=${{ secrets.PREFETCH_TOKEN }}"
```

## 완료 체크리스트

- [x] `.env.local`에 `PREFETCH_TOKEN` 추가
- [x] 로컬 테스트 성공 (22초에 7일치 수집)
- [x] 캐시 조회 속도 확인 (0.7초)
- [ ] Vercel 환경 변수 설정
- [ ] Git push 및 배포
- [ ] Vercel Cron Job 확인 (Pro 플랜)
- [ ] 프로덕션 환경에서 수동 프리페치 실행
- [ ] 사용자 조회 속도 확인

## 다음 단계

1. Vercel 환경 변수 설정
2. `git push`로 배포
3. 프로덕션에서 수동 프리페치 1회 실행
4. 사용자 경험 개선 확인! 🎉
