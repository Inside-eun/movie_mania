import type { Metadata } from "next";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import BarList from "./_components/BarList";
import LineChart from "./_components/LineChart";
import SplitBar from "./_components/SplitBar";
import StatCard from "./_components/StatCard";
import {
  appPlatformLabel,
  channelLabel,
  eventLabel,
  formatDateLabel,
  isSystemEvent,
} from "@/lib/eventLabels";
import { resolveDays, toDateRange, toPreviousDateRange } from "@/lib/ga4";
import {
  getAcquisition,
  getAppPlatformSplit,
  getAppWebSplit,
  getDailyActiveUsers,
  getOperatingSystems,
  getOverview,
  getTopEvents,
  getTopPages,
} from "@/lib/ga4Reports";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "통계 대시보드",
  robots: { index: false, follow: false },
};

const RANGES = [7, 30, 90] as const;
// 검증된 카테고리 팔레트 1~3번 슬롯.
const PLATFORM_COLORS = ["#3987e5", "#d95926", "#199e70"];

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 rounded-lg border border-white/10 bg-[#1a1a19] p-4">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      {note && <p className="mt-1 text-xs leading-relaxed text-[#898781]">{note}</p>}
      <div className="mt-4">{children}</div>
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
  const previousRange = toPreviousDateRange(days);

  let data;
  try {
    const [overview, previous, daily, events, pages, acquisition, operatingSystems] =
      await Promise.all([
        getOverview(dateRange),
        getOverview(previousRange),
        getDailyActiveUsers(dateRange),
        getTopEvents(dateRange),
        getTopPages(dateRange),
        getAcquisition(dateRange),
        getOperatingSystems(dateRange),
      ]);
    const appPlatform = await getAppPlatformSplit(dateRange);
    const appWeb = appPlatform ? null : await getAppWebSplit(dateRange, overview.activeUsers);
    data = {
      overview,
      previous,
      daily,
      events,
      pages,
      acquisition,
      operatingSystems,
      appPlatform,
      appWeb,
    };
  } catch (error) {
    return (
      <main className="min-h-screen bg-[#0d0d0d] px-4 py-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-lg font-semibold text-white">통계 대시보드</h1>
          <p className="mt-4 text-sm text-[#d03b3b]">
            데이터를 불러오지 못했습니다: {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      </main>
    );
  }

  const serviceEvents = data.events.filter((row) => !isSystemEvent(row.event));
  const systemEvents = data.events.filter((row) => isSystemEvent(row.event));

  return (
    <main className="min-h-screen bg-[#0d0d0d] px-4 py-6 pb-16">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-white">통계 대시보드</h1>
          <LogoutButton />
        </header>

        <nav className="mt-5 flex gap-2">
          {RANGES.map((range) => (
            <Link
              key={range}
              href={`/analytics?days=${range}`}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                range === days
                  ? "border-[#3987e5] bg-[#3987e5] text-white"
                  : "border-white/10 text-[#c3c2b7] hover:border-white/25"
              }`}
            >
              최근 {range}일
            </Link>
          ))}
        </nav>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="활성 사용자"
            value={data.overview.activeUsers}
            previous={data.previous.activeUsers}
          />
          <StatCard
            label="신규 사용자"
            value={data.overview.newUsers}
            previous={data.previous.newUsers}
          />
          <StatCard label="세션" value={data.overview.sessions} previous={data.previous.sessions} />
          <StatCard
            label="페이지뷰"
            value={data.overview.pageViews}
            previous={data.previous.pageViews}
          />
        </div>

        <Section title="일별 활성 사용자">
          <LineChart
            points={data.daily.map((point) => ({
              label: formatDateLabel(point.date),
              value: point.activeUsers,
            }))}
          />
        </Section>

        <Section
          title="앱 / 웹 사용자"
          note={
            data.appPlatform
              ? "app_platform 사용자 속성 기준입니다. 계측 배포 전에 방문한 사용자는 값이 없어 집계에서 빠집니다."
              : "앱도 웹과 같은 배포본을 띄우기 때문에 GA4에는 전부 platform=web으로 들어옵니다. 아래는 네이티브에서만 발생하는 이벤트(app_background/app_foreground) 기준 추정치이며, 앱을 켠 뒤 한 번도 백그라운드로 보내지 않은 사용자는 웹으로 분류됩니다. app_platform 값이 쌓이면 정확 집계로 자동 전환됩니다."
          }
        >
          {data.appPlatform ? (
            <SplitBar
              segments={data.appPlatform.map((row, index) => ({
                label: appPlatformLabel(row.platform),
                value: row.activeUsers,
                color: PLATFORM_COLORS[index % PLATFORM_COLORS.length],
              }))}
            />
          ) : (
            <SplitBar
              segments={[
                { label: "앱(추정)", value: data.appWeb!.appUsers, color: PLATFORM_COLORS[0] },
                { label: "웹", value: data.appWeb!.webUsers, color: PLATFORM_COLORS[1] },
              ]}
            />
          )}
          <h3 className="mt-6 text-xs font-semibold text-[#c3c2b7]">운영체제별 사용자</h3>
          <p className="mb-3 mt-1 text-xs text-[#898781]">
            앱 여부가 아니라 기기 OS 기준이다. iOS에는 사파리 방문자도 포함된다.
          </p>
          <BarList
            rows={data.operatingSystems.map((row) => ({
              label: row.channel,
              value: row.activeUsers,
              secondary: row.sessions,
            }))}
            secondaryLabel="세션"
            unit="명"
          />
        </Section>

        <Section title="인기 기능" note="GA4 자동 수집 이벤트를 제외한 서비스 이벤트입니다.">
          <BarList
            rows={serviceEvents.slice(0, 12).map((row) => ({
              label: eventLabel(row.event),
              value: row.count,
              secondary: row.users,
            }))}
            secondaryLabel="사용자"
            unit="회"
          />

          <details className="mt-6 border-t border-white/10 pt-4">
            <summary className="cursor-pointer text-xs text-[#898781]">
              시스템 이벤트 {systemEvents.length}개 보기
            </summary>
            <div className="mt-3">
              <BarList
                rows={systemEvents.map((row) => ({
                  label: eventLabel(row.event),
                  value: row.count,
                  secondary: row.users,
                }))}
                secondaryLabel="사용자"
                unit="회"
              />
            </div>
          </details>
        </Section>

        <Section title="인기 페이지">
          <BarList
            rows={data.pages.slice(0, 12).map((row) => ({
              label: row.path,
              value: row.pageViews,
              secondary: row.activeUsers,
            }))}
            secondaryLabel="사용자"
            unit="뷰"
          />
        </Section>

        <Section title="유입 경로">
          <BarList
            rows={data.acquisition.map((row) => ({
              label: channelLabel(row.channel),
              value: row.sessions,
              secondary: row.activeUsers,
            }))}
            secondaryLabel="사용자"
            unit="세션"
          />
        </Section>

        <p className="mt-8 text-xs text-[#898781]">
          막대 오른쪽 회색 숫자는 해당 항목의 사용자 수입니다. 증감률은 직전 동일 기간과 비교한
          값입니다.
        </p>
      </div>
    </main>
  );
}
