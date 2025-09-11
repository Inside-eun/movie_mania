This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

이 앱은 Vercel 서버리스 환경에 최적화되어 있습니다.

### 필수 환경 변수 설정

Vercel 대시보드 > Settings > Environment Variables에서 다음 환경 변수를 설정하세요:

```bash
KOBIS_API_KEY=your_kobis_api_key_here
CACHE_TTL_HOURS=6
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 주요 최적화 사항

- ✅ Vercel 환경 감지 및 자동 최적화
- ✅ 서버리스 환경에 맞춘 파일 캐시 시스템
- ✅ Puppeteer Vercel 호환성 설정
- ✅ 타임아웃 및 재시도 로직 최적화

자세한 배포 가이드는 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참고하세요.
