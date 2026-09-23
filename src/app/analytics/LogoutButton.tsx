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
      className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-600"
    >
      로그아웃
    </button>
  );
}
