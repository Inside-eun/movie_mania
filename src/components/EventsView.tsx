"use client";

import { useEffect, useState } from "react";

import { mockEvents, getEvent } from "@/mock/events";
import { getSnapshotMoviesByTitles } from "@/mock/snapshot";

const STORAGE_KEY = "notifyAlerts";

function alertKey(eventId: string, title: string) {
  return `${eventId}::${title}`;
}

export default function EventsView() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setAlerts(JSON.parse(saved));
  }, []);

  const toggleAlert = (eventId: string, title: string) => {
    const key = alertKey(eventId, title);
    setAlerts((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const selectedEvent = selectedEventId ? getEvent(selectedEventId) : null;

  if (selectedEvent) {
    const nowShowingTitles = new Set(
      getSnapshotMoviesByTitles(selectedEvent.movieTitles).map((m) => m.title)
    );

    return (
      <div>
        <button
          onClick={() => setSelectedEventId(null)}
          className="text-xs text-gray-400 hover:text-orange-400 mb-3 flex items-center gap-1"
        >
          ← 기획전 목록
        </button>

        <div className="h-28 mb-4 flex items-end p-4" style={{ backgroundColor: selectedEvent.bannerColor }}>
          <div>
            <h2 className="text-lg font-bold text-white drop-shadow">{selectedEvent.title}</h2>
            <p className="text-xs text-white/80">{selectedEvent.theaterName} · {selectedEvent.period}</p>
          </div>
        </div>

        <p className="text-sm text-gray-300 mb-6 leading-relaxed">{selectedEvent.description}</p>

        <h3 className="text-sm font-bold text-white mb-2">상영작</h3>
        <div className="space-y-2">
          {selectedEvent.movieTitles.map((title) => {
            const isAlerted = alerts.includes(alertKey(selectedEvent.id, title));
            const nowShowing = nowShowingTitles.has(title);
            return (
              <div
                key={title}
                className="flex items-center justify-between bg-gray-900 border border-gray-800 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{title}</p>
                  <p className="text-[10px] mt-0.5">
                    {nowShowing ? (
                      <span className="text-green-400">현재 상영 중</span>
                    ) : (
                      <span className="text-gray-500">상영 정보 미등록</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => toggleAlert(selectedEvent.id, title)}
                  disabled={nowShowing}
                  className={`ml-3 flex-shrink-0 px-3 py-1.5 text-[11px] font-bold transition-all ${
                    nowShowing
                      ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                      : isAlerted
                        ? "bg-orange-500 text-black"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {nowShowing ? "상영 중" : isAlerted ? "🔔 알림 설정됨" : "🔕 알림 신청"}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-500 mt-4 leading-relaxed">
          알림을 신청하면 해당 영화의 상영 정보가 새로 등록될 때 푸시 알림으로 안내해드립니다.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-base font-bold text-white">기획전</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          영화관별 기획전을 둘러보고, 원하는 작품의 상영 등록 알림을 신청해보세요.
        </p>
      </div>

      <div className="space-y-3">
        {mockEvents.map((e) => (
          <button
            key={e.id}
            onClick={() => setSelectedEventId(e.id)}
            className="block w-full text-left border border-gray-800 overflow-hidden hover:border-orange-500 transition-colors"
          >
            <div className="h-20 flex items-end p-3" style={{ backgroundColor: e.bannerColor }}>
              <p className="text-base font-bold text-white drop-shadow">{e.title}</p>
            </div>
            <div className="bg-gray-900 px-3 py-2.5">
              <p className="text-[11px] text-gray-400">{e.theaterName} · {e.period}</p>
              <p className="text-xs text-gray-300 mt-1">{e.summary}</p>
              <p className="text-[10px] text-gray-500 mt-1">{e.movieTitles.length}개 작품</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
