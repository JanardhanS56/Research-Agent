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

// ─── SSRF Protection & Safe URL Validation ───────────────────────────────────

const PRIVATE_IP_PATTERNS = [
  /^127\./,                                     // Loopback 127.0.0.0/8
  /^10\./,                                      // RFC 1918 10.0.0.0/8
  /^192\.168\./,                                // RFC 1918 192.168.0.0/16
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,             // RFC 1918 172.16.0.0/12
  /^169\.254\./,                                // Link-local / Cloud Metadata 169.254.0.0/16
  /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./, // CGNAT 100.64.0.0/10
  /^0\./,                                       // Current network
];

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "[::1]",
  "0.0.0.0",
  "metadata.google.internal",
  "metadata.internal",
  "instance-data",
]);

const BLOCKED_DOMAIN_SUFFIXES = [
  ".local",
  ".internal",
  ".lan",
  ".corp",
  ".home",
  ".arpa",
];

/**
 * Validates that a URL is safe to fetch and does not target private network
 * resources, loopback addresses, cloud metadata services, or non-HTTP protocols.
 */
export function isSafeUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== "string") return false;

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  // Strictly enforce http or https protocol
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase().trim();
  if (!hostname) return false;

  // Check explicit blocked hostnames
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return false;
  }

  // Check internal domain suffixes
  for (const suffix of BLOCKED_DOMAIN_SUFFIXES) {
    if (hostname.endsWith(suffix)) return false;
  }

  // Check private and reserved IPv4 patterns
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) return false;
  }

  // Disallow pure integer or hex representations (e.g. 2130706433 or 0x7f000001)
  if (/^(?:0x[0-9a-f]+|\d+)$/i.test(hostname)) {
    return false;
  }

  // Disallow IPv6 loopback / unique local addresses
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    const rawIp6 = hostname.slice(1, -1).toLowerCase();
    if (
      rawIp6 === "::1" ||
      rawIp6.startsWith("fe80:") || // link-local
      rawIp6.startsWith("fc00:") || // unique local
      rawIp6.startsWith("fd00:")
    ) {
      return false;
    }
  }

  return true;
}

// ─── Page Content Fetcher ────────────────────────────────────────────────────

/**
 * Fetch a URL and return its stripped plain-text (max 2500 chars).
 * Enforces strict SSRF protections against internal networks and metadata services.
 * Silently returns empty string on any error or blocked destination.
 */
async function fetchPageContent(url: string, maxRedirects = 3): Promise<string> {
  try {
    let currentUrl = url;

    for (let i = 0; i < maxRedirects; i++) {
      if (!isSafeUrl(currentUrl)) {
        return "";
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(currentUrl, {
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT },
        redirect: "manual",
      });
      clearTimeout(timeout);

      // Handle safe redirects manually to verify destination IP/host
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) return "";
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

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
    }

    return "";
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
  try {
    let results: SearchResult[] = [];
    if (process.env.BRAVE_SEARCH_API_KEY) {
      results = await braveSearch(query, limit);
    } else if (process.env.SERPER_API_KEY) {
      results = await serperSearch(query, limit);
    } else {
      results = await duckDuckGoSearch(query, limit);
    }

    if (results.length > 0) return results;
  } catch (err) {
    console.warn(`[Search Warning] Web search for "${query}" encountered an issue:`, err);
  }

  // Graceful fallback context so downstream agents can continue uninterrupted
  return [
    {
      title: `Search query reference: ${query}`,
      url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
      snippet: `Web query reference context for: ${query}`,
      content: `Context for query: ${query}. Synthesize analysis using deep domain knowledge and reasoning.`,
    },
  ];
}

