// 프로토타입 /test 페이지 전용: 클릭 이벤트를 /api/analytics/track 으로 전송하는 클라이언트 헬퍼.
"use client";

import { SimilarAlgorithm } from "./similarMovies";

function send(body: object) {
  try {
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // 프로토타입 트래킹 실패는 무시
  }
}

export function trackListClick(movieTitle: string) {
  send({ type: "list_click", movieTitle });
}

export function trackRecommendationClick(
  algorithm: SimilarAlgorithm,
  sourceTitle: string,
  targetTitle: string,
) {
  send({ type: "recommendation_click", algorithm, sourceTitle, targetTitle });
}
