/**
 * Web search abstraction.
 *
 * Strategy (in order):
 *  1. Brave Search API  — if BRAVE_SEARCH_API_KEY is set
 *  2. Serper.dev        — if SERPER_API_KEY is set
 *  3. DuckDuckGo HTML  — free, no key required (default)
 *
 * Each strategy returns up to `limit` SearchResult objects.
 * Content is fetched and stripped from the result URL (best-effort).
 */
import { parse } from "node-html-parser";
import type { SearchResult } from "@/lib/types";

const USER_AGENT =
  "Mozilla/5.0 (compatible; ResearchAgent/1.0; +https://github.com/JanardhanS56/Research-Agent)";

// ─── Strategy: Brave Search ──────────────────────────────────────────────────

async function braveSearch(query: string, limit: number): Promise<SearchResult[]> {
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(limit));

  const res = await fetch(url.toString(), {
    headers: {
      "Accept": "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": process.env.BRAVE_SEARCH_API_KEY!,
    },
  });

  if (!res.ok) throw new Error(`Brave Search error: ${res.status}`);
  const data = await res.json() as {
    web?: { results?: Array<{ title: string; url: string; description?: string }> };
  };

  const items = data.web?.results ?? [];
  return Promise.all(
    items.slice(0, limit).map(async (item) => ({
      title: item.title,
      url: item.url,
      snippet: item.description ?? "",
      content: await fetchPageContent(item.url),
    }))
  );
}

// ─── Strategy: Serper.dev ────────────────────────────────────────────────────

async function serperSearch(query: string, limit: number): Promise<SearchResult[]> {
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": process.env.SERPER_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num: limit }),
  });

  if (!res.ok) throw new Error(`Serper error: ${res.status}`);
  const data = await res.json() as {
    organic?: Array<{ title: string; link: string; snippet?: string }>;
  };

  const items = data.organic ?? [];
  return Promise.all(
    items.slice(0, limit).map(async (item) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet ?? "",
      content: await fetchPageContent(item.link),
    }))
  );
}

// ─── Strategy: DuckDuckGo HTML (no key) ─────────────────────────────────────

async function duckDuckGoSearch(query: string, limit: number): Promise<SearchResult[]> {
  const url = new URL("https://html.duckduckgo.com/html/");
  url.searchParams.set("q", query);

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html",
    },
  });

  if (!res.ok) throw new Error(`DuckDuckGo error: ${res.status}`);
  const html = await res.text();
  const root = parse(html);

  const results: Array<{ title: string; url: string; snippet: string }> = [];
  const resultNodes = root.querySelectorAll(".result");

  for (const node of resultNodes) {
    if (results.length >= limit) break;

    const titleNode = node.querySelector(".result__a");
    const snippetNode = node.querySelector(".result__snippet");
    const href = titleNode?.getAttribute("href") ?? "";

    if (!titleNode || !href) continue;

    // DuckDuckGo href may be a redirect URL — extract the actual URL
    let realUrl = href;
    try {
      const u = new URL(href.startsWith("/") ? `https://duckduckgo.com${href}` : href);
      const uddg = u.searchParams.get("uddg");
      if (uddg) realUrl = decodeURIComponent(uddg);
    } catch { /* use href as-is */ }

    results.push({
      title: titleNode.text.trim(),
      url: realUrl,
      snippet: snippetNode?.text.trim() ?? "",
    });
  }

  // Fetch page content concurrently (best-effort; silently skip failures)
  return Promise.all(
    results.map(async (r) => ({
      ...r,
      content: await fetchPageContent(r.url),
    }))
  );
}

// ─── Page Content Fetcher ────────────────────────────────────────────────────

/**
 * Fetch a URL and return its stripped plain-text (max 2500 chars).
 * Silently returns empty string on any error.
 */
async function fetchPageContent(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    });
    clearTimeout(timeout);

    if (!res.ok) return "";
    const html = await res.text();
    const root = parse(html);

    // Remove script/style tags
    root.querySelectorAll("script, style, nav, footer, header").forEach((n) => n.remove());

    const text = root.text
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2500);

    return text;
  } catch {
    return "";
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Run a web search using the best available strategy.
 * Returns up to `limit` (default: 3) SearchResult objects.
 */
export async function search(query: string, limit = 3): Promise<SearchResult[]> {
  if (process.env.BRAVE_SEARCH_API_KEY) {
    return braveSearch(query, limit);
  }
  if (process.env.SERPER_API_KEY) {
    return serperSearch(query, limit);
  }
  return duckDuckGoSearch(query, limit);
}
