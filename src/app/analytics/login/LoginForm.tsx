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
        className="rounded border border-gray-300 px-3 py-2 text-base outline-none focus:border-gray-900"
      />
      <button
        type="submit"
        disabled={pending || password.length === 0}
        className="rounded bg-gray-900 px-3 py-2 text-white disabled:opacity-40"
      >
        {pending ? "확인 중..." : "로그인"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
