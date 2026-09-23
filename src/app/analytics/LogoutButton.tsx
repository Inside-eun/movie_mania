"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/analytics-auth/logout", { method: "POST" });
    router.replace("/analytics/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-md border border-white/10 px-2.5 py-1 text-sm text-[#c3c2b7] transition-colors hover:border-white/25"
    >
      로그아웃
    </button>
  );
}
