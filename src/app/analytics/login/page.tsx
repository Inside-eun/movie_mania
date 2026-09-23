import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "통계 로그인",
  robots: { index: false, follow: false },
};

export default function AnalyticsLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0d0d0d] px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-4 text-lg font-semibold text-white">통계 대시보드</h1>
        <LoginForm />
      </div>
    </main>
  );
}
