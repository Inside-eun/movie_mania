"use client";

import { useCallback, useEffect, useState } from "react";
import type { NewsItem } from "@/app/api/movie-news/route";

function formatRelativeDate(pubDate: string): string {
  try {
    const diff = Date.now() - new Date(pubDate).getTime();
    const hours = Math.floor(diff / 3_600_000);
    if (hours < 1) return "방금 전";
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}일 전`;
    return new Date(pubDate).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
  } catch {
    return "";
  }
}

export default function NewsBanner() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/movie-news")
      .then((r) => r.json())
      .then((data: NewsItem[]) => {
        setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const goTo = useCallback(
    (idx: number) => {
      setFading(true);
      setTimeout(() => {
        setCurrentIndex(idx % items.length);
        setFading(false);
      }, 250);
    },
    [items.length],
  );

  const goToNext = useCallback(
    () => goTo((currentIndex + 1) % items.length),
    [currentIndex, items.length, goTo],
  );

  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(goToNext, 5000);
    return () => clearInterval(id);
  }, [items.length, goToNext]);

  if (loading) {
    return <div className="w-full bg-gray-900/40 animate-pulse" style={{ height: "200px" }} />;
  }
  if (items.length === 0) return null;

  const item = items[currentIndex];
  const hasImage = Boolean(item.imageUrl);

  return (
    <div className="relative w-full overflow-hidden bg-black" style={{ height: "200px" }}>
      {/* 블러 배경 */}
      {hasImage && (
        <div
          className="absolute inset-0 scale-110"
          style={{
            backgroundImage: `url(${item.imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(18px)",
            opacity: 0.22,
            transition: "opacity 0.3s",
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/75" />

      {/* 콘텐츠 */}
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 flex items-center px-4 gap-4"
        style={{ opacity: fading ? 0 : 1, transition: "opacity 0.25s" }}
      >
        {/* 썸네일 */}
        {hasImage && (
          <div
            className="relative flex-shrink-0 overflow-hidden shadow-2xl"
            style={{ width: "116px", height: "160px" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl!}
              alt={item.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* 텍스트 */}
        <div className="flex-1 min-w-0">
          <span className="inline-block bg-sky-500 text-white text-[10px] font-black px-2 py-0.5 mb-2 tracking-widest uppercase">
            영화 소식
          </span>
          <h2
            className="text-white font-bold text-base leading-snug mb-2.5"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: hasImage ? 3 : 4,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {item.title}
          </h2>
          <div className="flex items-center gap-1.5 flex-wrap">
            {item.source && (
              <span className="text-sky-400 text-xs font-semibold">{item.source}</span>
            )}
            {item.source && item.pubDate && (
              <span className="text-gray-600 text-xs">·</span>
            )}
            {item.pubDate && (
              <span className="text-gray-400 text-xs">{formatRelativeDate(item.pubDate)}</span>
            )}
          </div>
        </div>
      </a>

      {/* 외부 링크 아이콘 */}
      <div className="absolute top-3 right-3 pointer-events-none">
        <svg
          className="w-3.5 h-3.5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </div>

      {/* 인디케이터 */}
      {items.length > 1 && (
        <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.preventDefault();
                goTo(i);
              }}
              aria-label={`${i + 1}번 뉴스로 이동`}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === currentIndex ? "16px" : "6px",
                height: "6px",
                backgroundColor:
                  i === currentIndex ? "#0EA5E9" : "rgba(255,255,255,0.3)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
