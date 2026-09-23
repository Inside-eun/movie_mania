import { type DateRange, getGa4Client, toNumber } from "@/lib/ga4";

export type Overview = {
  activeUsers: number;
  newUsers: number;
  sessions: number;
  pageViews: number;
};

export type EventRow = { event: string; count: number; users: number };
export type PageRow = { path: string; pageViews: number; activeUsers: number };
export type ChannelRow = { channel: string; sessions: number; activeUsers: number };

export async function getOverview(dateRange: DateRange): Promise<Overview> {
  const { client, property } = getGa4Client();

  const [response] = await client.runReport({
    property,
    dateRanges: [dateRange],
    metrics: [
      { name: "activeUsers" },
      { name: "newUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
    ],
  });

  const values = response.rows?.[0]?.metricValues ?? [];

  return {
    activeUsers: toNumber(values[0]?.value),
    newUsers: toNumber(values[1]?.value),
    sessions: toNumber(values[2]?.value),
    pageViews: toNumber(values[3]?.value),
  };
}

export async function getTopEvents(dateRange: DateRange): Promise<EventRow[]> {
  const { client, property } = getGa4Client();

  const [response] = await client.runReport({
    property,
    dateRanges: [dateRange],
    dimensions: [{ name: "eventName" }],
    metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
    orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
    limit: 30,
  });

  return (response.rows ?? []).map((row) => ({
    event: row.dimensionValues?.[0]?.value ?? "",
    count: toNumber(row.metricValues?.[0]?.value),
    users: toNumber(row.metricValues?.[1]?.value),
  }));
}

export async function getTopPages(dateRange: DateRange): Promise<PageRow[]> {
  const { client, property } = getGa4Client();

  const [response] = await client.runReport({
    property,
    dateRanges: [dateRange],
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: 30,
  });

  return (response.rows ?? []).map((row) => ({
    path: row.dimensionValues?.[0]?.value ?? "",
    pageViews: toNumber(row.metricValues?.[0]?.value),
    activeUsers: toNumber(row.metricValues?.[1]?.value),
  }));
}

/** 네이티브 앱에서만 발생하는 이벤트. CapacitorInit이 isNativePlatform() 검사 뒤에만 등록한다. */
const APP_ONLY_EVENTS = ["app_background", "app_foreground"];

export type DailyPoint = { date: string; activeUsers: number };
export type PlatformRow = { platform: string; streamId: string; activeUsers: number; sessions: number };
export type AppWebSplit = { appUsers: number; webUsers: number; totalUsers: number };

export async function getDailyActiveUsers(dateRange: DateRange): Promise<DailyPoint[]> {
  const { client, property } = getGa4Client();

  const [response] = await client.runReport({
    property,
    dateRanges: [dateRange],
    dimensions: [{ name: "date" }],
    metrics: [{ name: "activeUsers" }],
    orderBys: [{ dimension: { dimensionName: "date" } }],
    limit: 100,
  });

  return (response.rows ?? []).map((row) => ({
    date: row.dimensionValues?.[0]?.value ?? "",
    activeUsers: toNumber(row.metricValues?.[0]?.value),
  }));
}

/** GA4가 앱 트래픽도 platform=web으로 수집하므로, 앱 전용 이벤트로 앱 사용자를 추정한다. */
export async function getAppWebSplit(
  dateRange: DateRange,
  totalUsers: number,
): Promise<AppWebSplit> {
  const { client, property } = getGa4Client();

  const [response] = await client.runReport({
    property,
    dateRanges: [dateRange],
    metrics: [{ name: "activeUsers" }],
    dimensionFilter: {
      filter: {
        fieldName: "eventName",
        inListFilter: { values: APP_ONLY_EVENTS },
      },
    },
  });

  const appUsers = toNumber(response.rows?.[0]?.metricValues?.[0]?.value);
  return { appUsers, webUsers: Math.max(0, totalUsers - appUsers), totalUsers };
}

export type AppPlatformRow = { platform: string; activeUsers: number };

/**
 * app_platform 사용자 속성 기준 정확 집계.
 *
 * 계측 배포(2026-09-23) 이전 사용자는 (not set)으로 잡히므로 제외한다. 분류된 사용자가
 * 아직 없으면 null을 돌려주고, 호출부는 앱 전용 이벤트 기반 추정치로 대체한다.
 * 데이터가 충분히 쌓이면 추정 경로와 함께 이 분기를 지울 것.
 */
export async function getAppPlatformSplit(
  dateRange: DateRange,
): Promise<AppPlatformRow[] | null> {
  const { client, property } = getGa4Client();

  const [response] = await client.runReport({
    property,
    dateRanges: [dateRange],
    dimensions: [{ name: "customUser:app_platform" }],
    metrics: [{ name: "activeUsers" }],
    orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
  });

  const rows = (response.rows ?? [])
    .map((row) => ({
      platform: row.dimensionValues?.[0]?.value ?? "",
      activeUsers: toNumber(row.metricValues?.[0]?.value),
    }))
    .filter((row) => row.platform !== "" && row.platform !== "(not set)" && row.activeUsers > 0);

  return rows.length > 0 ? rows : null;
}

export async function getPlatformBreakdown(dateRange: DateRange): Promise<PlatformRow[]> {
  const { client, property } = getGa4Client();

  const [response] = await client.runReport({
    property,
    dateRanges: [dateRange],
    dimensions: [{ name: "platform" }, { name: "streamId" }],
    metrics: [{ name: "activeUsers" }, { name: "sessions" }],
    orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
  });

  return (response.rows ?? []).map((row) => ({
    platform: row.dimensionValues?.[0]?.value ?? "",
    streamId: row.dimensionValues?.[1]?.value ?? "",
    activeUsers: toNumber(row.metricValues?.[0]?.value),
    sessions: toNumber(row.metricValues?.[1]?.value),
  }));
}

export async function getOperatingSystems(dateRange: DateRange): Promise<ChannelRow[]> {
  const { client, property } = getGa4Client();

  const [response] = await client.runReport({
    property,
    dateRanges: [dateRange],
    dimensions: [{ name: "operatingSystem" }],
    metrics: [{ name: "sessions" }, { name: "activeUsers" }],
    orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
    limit: 10,
  });

  return (response.rows ?? []).map((row) => ({
    channel: row.dimensionValues?.[0]?.value ?? "",
    sessions: toNumber(row.metricValues?.[0]?.value),
    activeUsers: toNumber(row.metricValues?.[1]?.value),
  }));
}

export async function getAcquisition(dateRange: DateRange): Promise<ChannelRow[]> {
  const { client, property } = getGa4Client();

  const [response] = await client.runReport({
    property,
    dateRanges: [dateRange],
    dimensions: [{ name: "sessionDefaultChannelGroup" }],
    metrics: [{ name: "sessions" }, { name: "activeUsers" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
  });

  return (response.rows ?? []).map((row) => ({
    channel: row.dimensionValues?.[0]?.value ?? "",
    sessions: toNumber(row.metricValues?.[0]?.value),
    activeUsers: toNumber(row.metricValues?.[1]?.value),
  }));
}
