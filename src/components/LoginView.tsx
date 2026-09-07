"use client";

import { useEffect, useState } from "react";

export interface LinkedAccount {
  provider: "kakao" | "google" | "apple";
  name: string;
  email: string;
}

const PROVIDERS: {
  id: LinkedAccount["provider"];
  label: string;
  color: string;
  textColor: string;
}[] = [
  { id: "kakao", label: "카카오로 계속하기", color: "#FEE500", textColor: "#181600" },
  { id: "google", label: "Google로 계속하기", color: "#ffffff", textColor: "#1f1f1f" },
  { id: "apple", label: "Apple로 계속하기", color: "#000000", textColor: "#ffffff" },
];

const MOCK_PROFILES: Record<LinkedAccount["provider"], { name: string; email: string }> = {
  kakao: { name: "달달한 볶음밥", email: "moviewanderer@kakao.com" },
  google: { name: "Dameun", email: "dameun0808@gmail.com" },
  apple: { name: "익명 사용자", email: "user@privaterelay.appleid.com" },
};

function generateGuestId(): string {
  return `GUEST-${Math.floor(100000 + Math.random() * 900000)}`;
}

export default function LoginView() {
  const [guestId, setGuestId] = useState<string | null>(null);
  const [linked, setLinked] = useState<LinkedAccount | null>(null);
  const [connecting, setConnecting] = useState<LinkedAccount["provider"] | null>(null);

  useEffect(() => {
    let id = localStorage.getItem("guestId");
    if (!id) {
      id = generateGuestId();
      localStorage.setItem("guestId", id);
    }
    setGuestId(id);

    const savedLinked = localStorage.getItem("linkedAccount");
    if (savedLinked) setLinked(JSON.parse(savedLinked));
  }, []);

  const handleConnect = (provider: LinkedAccount["provider"]) => {
    setConnecting(provider);
    setTimeout(() => {
      const account: LinkedAccount = { provider, ...MOCK_PROFILES[provider] };
      setLinked(account);
      localStorage.setItem("linkedAccount", JSON.stringify(account));
      setConnecting(null);
    }, 900);
  };

  const handleUnlink = () => {
    setLinked(null);
    localStorage.removeItem("linkedAccount");
  };

  return (
    <div className="max-w-sm mx-auto">
      <div className="mb-6">
        <h2 className="text-base font-bold text-white">계정</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          게스트 번호로 이용하다가, 소셜 계정을 연동하면 찜 목록·즐겨찾기 데이터가 계정에 그대로 이어집니다.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 p-4 mb-6">
        {linked ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
              {linked.name.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate">{linked.name}</p>
              <p className="text-[11px] text-gray-500 truncate">{linked.email}</p>
              <p className="text-[10px] text-orange-400 mt-0.5">
                {linked.provider.toUpperCase()} 계정으로 연동됨
              </p>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">게스트로 이용 중</p>
            <p className="text-base font-mono font-bold text-white">{guestId ?? "..."}</p>
            <p className="text-[11px] text-gray-500 mt-1">
              소셜 계정을 연동하면 이 기기의 데이터를 계정으로 옮길 수 있어요.
            </p>
          </div>
        )}
      </div>

      {linked ? (
        <button
          onClick={handleUnlink}
          className="w-full py-2.5 border border-gray-700 text-gray-300 text-sm font-medium hover:border-gray-500 transition-colors"
        >
          연동 해제하고 게스트로 돌아가기
        </button>
      ) : (
        <div className="space-y-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleConnect(p.id)}
              disabled={connecting !== null}
              style={{ backgroundColor: p.color, color: p.textColor }}
              className="w-full py-2.5 text-sm font-bold flex items-center justify-center gap-2 border border-gray-700 disabled:opacity-60 transition-all active:scale-[0.98]"
            >
              {connecting === p.id ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  연동하는 중...
                </>
              ) : (
                p.label
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
