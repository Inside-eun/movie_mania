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
