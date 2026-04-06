# Vercel Cron Jobs 플랜별 가이드

## 플랜별 제한사항

| 플랜 | 최소 실행 간격 | 스케줄링 정확도 | 비고 |
|------|---------------|----------------|------|
| **Hobby** | 하루 1회 | ±59분 | 무료 |
| **Pro** | 분 단위 | 정확 | $20/월 |
| **Enterprise** | 분 단위 | 정확 | 맞춤형 |

## Hobby 플랜 사용자

### 제한사항
- 하루 1회만 실행 가능
- 스케줄링 정확도: ±59분 (예: 06:00 설정 시 06:00~06:59 사이 실행)
- 하루 여러 번 실행하는 설정은 **배포 실패**

### 권장 설정

**`vercel-hobby.json` 사용:**
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

**배포 전:**
```bash
cp vercel-hobby.json vercel.json
git add vercel.json
git commit -m "chore: Hobby 플랜용 Cron 설정"
git push
```

### 대안: GitHub Actions

하루 여러 번 실행이 필요하면 GitHub Actions 사용:

`.github/workflows/prefetch.yml`:
```yaml
name: Prefetch Schedules

on:
  schedule:
    - cron: '0 6,12,18 * * *'  # 매일 6시, 12시, 18시 (UTC)
  workflow_dispatch:

jobs:
  prefetch:
    runs-on: ubuntu-latest
    steps:
      - name: Run Prefetch
        run: |
          curl -X POST "https://your-domain.vercel.app/api/schedules/prefetch?token=${{ secrets.PREFETCH_TOKEN }}"
```

**GitHub Secrets 설정:**
1. GitHub 저장소 → Settings → Secrets and variables → Actions
2. New repository secret:
   - Name: `PREFETCH_TOKEN`
   - Secret: `iaDFUuG43dOzkb6mXQazntv6NfU2QFw0Hk2i/hHFpWI=`

## Pro/Enterprise 플랜 사용자

### 기본 설정 (이미 완료)

**`vercel.json`:**
```json
{
  "crons": [
    {
      "path": "/api/schedules/prefetch?token=$PREFETCH_TOKEN",
      "schedule": "0 6,12,18 * * *"
    }
  ]
}
```

이 설정은 매일 6시, 12시, 18시에 정확하게 실행됩니다.

### 더 자주 실행하기

**1시간마다:**
```json
{
  "crons": [
    {
      "path": "/api/schedules/prefetch?token=$PREFETCH_TOKEN",
      "schedule": "0 * * * *"
    }
  ]
}
```

**30분마다:**
```json
{
  "crons": [
    {
      "path": "/api/schedules/prefetch?token=$PREFETCH_TOKEN",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

## Cron 표현식 가이드

```
┌───────────── 분 (0 - 59)
│ ┌───────────── 시 (0 - 23)
│ │ ┌───────────── 일 (1 - 31)
│ │ │ ┌───────────── 월 (1 - 12)
│ │ │ │ ┌───────────── 요일 (0 - 6) (일요일=0)
│ │ │ │ │
* * * * *
```

### 예시

| 표현식 | 설명 |
|--------|------|
| `0 6 * * *` | 매일 오전 6시 |
| `0 */6 * * *` | 6시간마다 (0시, 6시, 12시, 18시) |
| `0 6,12,18 * * *` | 매일 6시, 12시, 18시 |
| `*/30 * * * *` | 30분마다 |
| `0 * * * *` | 매시간 정각 |
| `0 9-17 * * 1-5` | 평일 9시~17시 매시간 |

## 배포 확인

### 1. Vercel 대시보드 확인

1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. 프로젝트 선택
3. **Settings** → **Cron Jobs**
4. 설정된 Cron 확인

### 2. 로그 확인

- **Deployments** → 최신 배포 선택
- 배포 로그에서 Cron 설정 확인
- Hobby 플랜에서 하루 여러 번 설정 시 에러 메시지:
  ```
  Error: Hobby accounts are limited to daily cron jobs.
  This cron expression would run more than once per day.
  ```

### 3. 실행 로그 확인

- **Logs** 탭에서 Cron 실행 로그 확인
- User Agent: `vercel-cron/1.0`

## 문제 해결

### Hobby 플랜에서 배포 실패

**에러:**
```
Hobby accounts are limited to daily cron jobs
```

**해결:**
```bash
cp vercel-hobby.json vercel.json
git add vercel.json
git commit -m "fix: Hobby 플랜용 하루 1회 Cron 설정"
git push
```

### Cron이 실행되지 않음

1. **환경 변수 확인**
   - Vercel 대시보드 → Settings → Environment Variables
   - `PREFETCH_TOKEN` 설정 확인

2. **프로덕션 배포 확인**
   - Cron은 프로덕션 배포에만 적용
   - Preview 배포에는 적용 안 됨

3. **수동 테스트**
   ```bash
   npm run prefetch:prod your-domain.vercel.app
   ```

## 권장 설정

### Hobby 플랜
- **Vercel Cron**: 하루 1회 (오전 6시)
- **GitHub Actions**: 하루 3회 (6시, 12시, 18시)

### Pro 플랜
- **Vercel Cron**: 하루 3회 (6시, 12시, 18시)
- 필요시 더 자주 실행 가능

## 비용 고려사항

| 방법 | 비용 | 실행 빈도 | 정확도 |
|------|------|----------|--------|
| Hobby + Vercel Cron | 무료 | 1회/일 | ±59분 |
| Hobby + GitHub Actions | 무료 | 무제한 | 정확 |
| Pro + Vercel Cron | $20/월 | 무제한 | 정확 |

## 참고 자료

- [Vercel Cron Jobs 문서](https://vercel.com/docs/cron-jobs)
- [Cron 표현식 검증](https://crontab.guru/)
- [GitHub Actions 문서](https://docs.github.com/en/actions)
