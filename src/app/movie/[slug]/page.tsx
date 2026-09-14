import type { Metadata } from 'next';

import MovieDetailClient from './MovieDetailClient';

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

function getParam(searchParams: PageProps["searchParams"], key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

// 카카오톡 등에서 링크 미리보기(og:title/description/image)를 만들 때 쓰는 메타데이터.
// 공유 버튼이 생성하는 URL의 쿼리 파라미터(title/theater/time/poster)를 그대로 반영한다.
export function generateMetadata({ searchParams }: PageProps): Metadata {
  const title = getParam(searchParams, "title");
  const theater = getParam(searchParams, "theater");
  const time = getParam(searchParams, "time");
  const poster = getParam(searchParams, "poster");

  if (!title) {
    return {};
  }

  const description = [theater, time].filter(Boolean).join(" · ");

  return {
    title,
    description: description || undefined,
    openGraph: {
      title,
      description: description || undefined,
      images: poster ? [{ url: poster }] : undefined,
    },
  };
}

export default function MovieDetailPage() {
  return <MovieDetailClient />;
}
