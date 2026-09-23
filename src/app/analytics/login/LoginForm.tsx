"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");

    const response = await fetch("/api/analytics-auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (response.ok) {
      router.replace("/analytics");
      router.refresh();
      return;
    }

    const data = await response.json().catch(() => null);
    setError(data?.error ?? "로그인에 실패했습니다.");
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="비밀번호"
        autoComplete="current-password"
        autoFocus
        className="rounded-md border border-white/10 bg-[#1a1a19] px-3 py-2 text-base text-white outline-none placeholder:text-[#898781] focus:border-[#3987e5]"
      />
      <button
        type="submit"
        disabled={pending || password.length === 0}
        className="rounded-md bg-[#3987e5] px-3 py-2 text-white transition-opacity disabled:opacity-40"
      >
        {pending ? "확인 중..." : "로그인"}
      </button>
      {error && <p className="text-sm text-[#d03b3b]">{error}</p>}
    </form>
  );
}
