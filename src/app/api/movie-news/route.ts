import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  imageUrl: string | null;
  description: string;
}

let memCache: { items: NewsItem[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000;

function extractArticleUrlFromDescription(html: string): string | null {
  try {
    const $ = cheerio.load(html);
    const href = $('a[href^="http"]').first().attr("href");
    return href || null;
  } catch {
    return null;
  }
}

async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const res = await axios.get<string>(url, {
      timeout: 3500,
      maxRedirects: 5,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    const $ = cheerio.load(res.data);
    return (
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      null
    );
  } catch {
    return null;
  }
}

async function fetchMovieNews(): Promise<NewsItem[]> {
  const rssUrl =
    "https://news.google.com/rss/search?q=%EC%98%81%ED%99%94&hl=ko&gl=KR&ceid=KR:ko";

  const rssRes = await axios.get<string>(rssUrl, {
    timeout: 10000,
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  const $ = cheerio.load(rssRes.data, { xmlMode: true });

  const rawItems: Array<Omit<NewsItem, "imageUrl"> & { articleUrl: string | null }> = [];

  $("item").each((_, el) => {
    const $el = $(el);
    const title = $el.find("title").text().trim();
    const googleLink = $el.find("link").text().trim() || $el.find("guid").text().trim();
    const descriptionHtml = $el.find("description").text();
    const source = $el.find("source").text().trim();
    const pubDate = $el.find("pubDate").text().trim();
    const description = descriptionHtml.replace(/<[^>]+>/g, "").trim().slice(0, 120);
    const articleUrl = extractArticleUrlFromDescription(descriptionHtml) || googleLink;

    if (title && googleLink) {
      rawItems.push({ title, link: googleLink, source, pubDate, description, articleUrl });
    }
  });

  const top8 = rawItems.slice(0, 8);

  const imageResults = await Promise.allSettled(
    top8.map((item) => fetchOgImage(item.articleUrl || item.link))
  );

  return top8.map((item, i) => ({
    title: item.title,
    link: item.link,
    source: item.source,
    pubDate: item.pubDate,
    description: item.description,
    imageUrl:
      imageResults[i].status === "fulfilled"
        ? (imageResults[i] as PromiseFulfilledResult<string | null>).value
        : null,
  }));
}

export async function GET() {
  try {
    if (memCache && Date.now() - memCache.fetchedAt < CACHE_TTL_MS) {
      return NextResponse.json(memCache.items);
    }

    const items = await fetchMovieNews();
    memCache = { items, fetchedAt: Date.now() };

    return NextResponse.json(items, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    console.error("[movie-news] fetch failed:", err);
    if (memCache) {
      return NextResponse.json(memCache.items);
    }
    return NextResponse.json([]);
  }
}
