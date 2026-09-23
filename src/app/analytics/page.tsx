import type { Metadata } from "next";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import { resolveDays, toDateRange } from "@/lib/ga4";
import { getAcquisition, getOverview, getTopEvents, getTopPages } from "@/lib/ga4Reports";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "통계 대시보드",
  robots: { index: false, follow: false },
};

const RANGES = [7, 30, 90] as const;

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-gray-200 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value.toLocaleString()}</p>
    </div>
  );
}

function RankTable({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; primary: number; secondary: number }[];
}) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">데이터가 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] text-sm">
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-gray-100">
                  <td className="max-w-0 truncate py-2 pr-2" title={row.label}>
                    {row.label}
                  </td>
                  <td className="w-20 py-2 text-right tabular-nums">
                    {row.primary.toLocaleString()}
                  </td>
                  <td className="w-20 py-2 text-right tabular-nums text-gray-400">
                    {row.secondary.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { days?: string };
}) {
  const days = resolveDays(searchParams.days, 30);
  const dateRange = toDateRange(days);

  let data;
  try {
    const [overview, events, pages, acquisition] = await Promise.all([
      getOverview(dateRange),
      getTopEvents(dateRange),
      getTopPages(dateRange),
      getAcquisition(dateRange),
    ]);
    data = { overview, events, pages, acquisition };
  } catch (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-lg font-semibold">통계 대시보드</h1>
        <p className="mt-4 text-sm text-red-600">
          데이터를 불러오지 못했습니다: {error instanceof Error ? error.message : String(error)}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">통계 대시보드</h1>
        <LogoutButton />
      </div>

      <nav className="mt-4 flex gap-2">
        {RANGES.map((range) => (
          <Link
            key={range}
            href={`/analytics?days=${range}`}
            className={`rounded border px-3 py-1 text-sm ${
              range === days
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 text-gray-600"
            }`}
          >
            최근 {range}일
          </Link>
        ))}
      </nav>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="활성 사용자" value={data.overview.activeUsers} />
        <StatCard label="신규 사용자" value={data.overview.newUsers} />
        <StatCard label="세션" value={data.overview.sessions} />
        <StatCard label="페이지뷰" value={data.overview.pageViews} />
      </div>

      <RankTable
        title="인기 이벤트"
        rows={data.events.map((row) => ({
          label: row.event,
          primary: row.count,
          secondary: row.users,
        }))}
      />
      <RankTable
        title="인기 페이지"
        rows={data.pages.map((row) => ({
          label: row.path,
          primary: row.pageViews,
          secondary: row.activeUsers,
        }))}
      />
      <RankTable
        title="유입 경로"
        rows={data.acquisition.map((row) => ({
          label: row.channel,
          primary: row.sessions,
          secondary: row.activeUsers,
        }))}
      />

      <p className="mt-6 text-xs text-gray-400">
        각 표의 우측 두 열은 순서대로 주요 지표와 사용자 수입니다.
      </p>
    </main>
  );
}
