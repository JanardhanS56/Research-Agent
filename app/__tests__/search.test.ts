// Rollback: rm -f "app/__tests__/search.test.ts"
import { describe, it, expect, vi, beforeEach } from "vitest";
import { search } from "../lib/search";

describe("Search Service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.BRAVE_SEARCH_API_KEY;
    delete process.env.SERPER_API_KEY;
  });

  it("returns fallback results when search engines are unreachable or return no results", async () => {
    // Mock global fetch to return empty response
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => "<html><body>No results</body></html>",
    } as Response);

    const results = await search("nonexistent quantum anomaly test", 2);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].title).toContain("nonexistent quantum anomaly test");
    expect(results[0].url).toMatch(/^https:\/\//);
  });

  it("correctly extracts title, url, snippet, and content fields", async () => {
    const mockHtml = `
      <html>
        <body>
          <div class="result results_links">
            <a class="result__url" href="https://example.com/article"></a>
            <h2 class="result__title"><a class="result__a" href="https://example.com/article">Quantum Leap in Computing</a></h2>
            <div class="result__snippet">Scientists achieve 1000 qubit coherence.</div>
          </div>
        </body>
      </html>
    `;

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      text: async () => mockHtml,
    } as Response);

    const results = await search("quantum computing", 1);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].title).toBe("Quantum Leap in Computing");
    expect(results[0].url).toBe("https://example.com/article");
    expect(results[0].snippet).toContain("1000 qubit coherence");
  });
});
