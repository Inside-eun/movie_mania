# 🚀 서버사이드 프리페치 완전 가이드

## ✅ 설정 완료!

로컬 환경 설정이 완료되었습니다. 이제 바로 사용할 수 있습니다.

## 🎯 성능 개선 결과

| 상황 | 속도 | 개선율 |
|------|------|--------|
| 개선 전 | 30초 | - |
| CSRF 캐싱 | 10-12초 | 60% ↑ |
| **프리페치 (캐시 히트)** | **0.7초** | **97% ↑** |

## 📦 로컬에서 바로 사용하기

### 1. 프리페치 실행

```bash
npm run prefetch:local
```

실행 결과:
```
🚀 스케줄 프리페치 시작...
📡 API 호출 중... (최대 5분 소요)

✅ 프리페치 성공!

📊 요약:
  2026-04-06: 141개 스케줄
  2026-04-07: 159개 스케줄
  2026-04-08: 167개 스케줄
  2026-04-09: 119개 스케줄
  2026-04-10: 103개 스케줄
  2026-04-11: 78개 스케줄
  2026-04-12: 77개 스케줄

⏱️  소요 시간: 22초
```

### 2. 빠른 조회 확인

```bash
# 오늘 스케줄 조회 (0.7초!)
curl "http://localhost:3000/api/schedules" | jq '.cache'

# 특정 날짜 조회
curl "http://localhost:3000/api/schedules?date=2026-04-08" | jq '.cache'
```

결과:
```json
{
  "fromCache": true,
  "date": "2026-04-08",
  "type": "integrated"
}
```

## 🌐 Vercel 배포하기

### 1단계: Vercel 환경 변수 설정

1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. 프로젝트 선택 → **Settings** → **Environment Variables**
3. 새 변수 추가:

```
Name: PREFETCH_TOKEN
Value: iaDFUuG43dOzkb6mXQazntv6NfU2QFw0Hk2i/hHFpWI=
Environments: Production ✓ Preview ✓ Development ✓
```

### 2단계: Git 배포

```bash
git add .
git commit -m "feat: 서버사이드 프리페치 추가 (30초→0.7초)"
git push
```

### 3단계: 프로덕션에서 프리페치 실행

```bash
# your-domain.vercel.app를 실제 도메인으로 변경
npm run prefetch:prod your-domain.vercel.app
```

또는 직접 curl:
```bash
curl -X POST "https://your-domain.vercel.app/api/schedules/prefetch?token=iaDFUuG43dOzkb6mXQazntv6NfU2QFw0Hk2i/hHFpWI="
```

## ⏰ 자동 스케줄링 (Vercel Cron)

### Vercel Pro/Enterprise 플랜

`vercel.json` 설정으로 자동 실행 (분 단위 가능):
- **매일 06:00** (오전 6시)
- **매일 12:00** (낮 12시)  
- **매일 18:00** (오후 6시)

배포 후 자동으로 활성화됩니다.

### Vercel Hobby 플랜 (무료)

**옵션 1: Vercel Cron (하루 1회)**

`vercel.json`을 다음과 같이 수정:
```json
{
  "crons": [
    {
      "path": "/api/schedules/prefetch?token=$PREFETCH_TOKEN",
      "schedule": "0 6 * * *"
    }
  ]
}
```

또는 `vercel-hobby.json` 파일을 `vercel.json`으로 복사.

**옵션 2: GitHub Actions (하루 여러 번)**

GitHub Actions로 무료 Cron 구현:

1. `.github/workflows/prefetch.yml` 생성:

```yaml
name: Prefetch Schedules

on:
  schedule:
    - cron: '0 6,12,18 * * *'  # 매일 6시, 12시, 18시 (UTC)
  workflow_dispatch:  # 수동 실행 가능

jobs:
  prefetch:
    runs-on: ubuntu-latest
    steps:
      - name: Run Prefetch
        run: |
          curl -X POST "https://your-domain.vercel.app/api/schedules/prefetch?token=${{ secrets.PREFETCH_TOKEN }}"
```

2. GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret** 클릭:
   - Name: `PREFETCH_TOKEN`
   - Secret: `iaDFUuG43dOzkb6mXQazntv6NfU2QFw0Hk2i/hHFpWI=`

## 🛠️ 유용한 명령어

### 캐시 관리

```bash
# 캐시 통계 확인
npm run cache:stats

# 오래된 캐시 정리
npm run cache:cleanup

# 전체 캐시 삭제
npm run cache:clear
```

### 프리페치

```bash
# 로컬 환경
npm run prefetch:local

# 프로덕션 환경
npm run prefetch:prod your-domain.vercel.app
```

### API 직접 호출

```bash
# 일반 조회 (캐시 우선)
curl "http://localhost:3000/api/schedules"

# 특정 날짜
curl "http://localhost:3000/api/schedules?date=2026-04-10"

# 강제 새로고침 (캐시 무시)
curl "http://localhost:3000/api/schedules?force=true"
```

## 📊 동작 원리

```
1. 프리페치 실행 (Cron 또는 수동)
   ↓
2. 7일치 스케줄 수집 (20-30초)
   ↓
3. 파일 캐시에 저장
   ↓
4. 사용자 요청
   ↓
5. 캐시 확인 → 있으면 즉시 반환 (0.7초)
                없으면 크롤링 (10-12초)
```

## 🔍 문제 해결

### 프리페치가 실패하는 경우

1. **환경 변수 확인**
```bash
cat .env.local | grep PREFETCH_TOKEN
```

2. **서버 실행 확인**
```bash
curl http://localhost:3000/api/schedules
```

3. **로그 확인**
터미널에서 에러 메시지 확인

### 캐시가 작동하지 않는 경우

```bash
# 캐시 디렉토리 확인
ls -la .cache/

# 캐시 통계
npm run cache:stats
```

### Vercel Cron이 실행되지 않는 경우

1. **플랜 확인**: Pro 플랜인지 확인
2. **환경 변수**: Vercel에 `PREFETCH_TOKEN` 설정 확인
3. **로그 확인**: Vercel 대시보드 → Logs

## 📈 다음 단계

### 즉시 가능
- [x] 로컬 프리페치 실행
- [x] 캐시 조회 속도 확인
- [ ] Vercel 환경 변수 설정
- [ ] Git push 및 배포
- [ ] 프로덕션 프리페치 실행

### 추가 최적화 (선택)
- [ ] GitHub Actions Cron 설정 (Hobby 플랜)
- [ ] Redis 캐시 도입
- [ ] MongoDB 데이터 저장
- [ ] CDN 캐싱 활용

## 💡 팁

1. **첫 배포 후**: 수동으로 프리페치 1회 실행 권장
2. **캐시 만료**: 6시간 후 자동 만료 (다음 Cron에서 갱신)
3. **비용 절감**: Hobby 플랜 + GitHub Actions = 무료
4. **모니터링**: 주기적으로 `cache:stats` 확인

## 🎉 완료!

이제 사용자는 **0.7초**만에 스케줄을 조회할 수 있습니다!

질문이나 문제가 있으면 이슈를 등록해주세요.
