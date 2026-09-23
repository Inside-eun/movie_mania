import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "통계 로그인",
  robots: { index: false, follow: false },
};

export default function AnalyticsLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="mb-4 text-lg font-semibold">통계 대시보드</h1>
      <LoginForm />
    </main>
  );
}
