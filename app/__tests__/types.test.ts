import { describe, it, expect } from "vitest";
import type { SubQuery, SearchResult, Synthesis, Citation } from "../lib/types";

// ─── Type shape tests ─────────────────────────────────────────────────────────

describe("SubQuery type", () => {
  it("has id, query, rationale fields", () => {
    const sq: SubQuery = {
      id: "q1",
      query: "latest quantum computing breakthroughs 2025",
      rationale: "Establish current state of the field",
    };
    expect(sq.id).toBe("q1");
    expect(sq.query).toContain("quantum");
    expect(typeof sq.rationale).toBe("string");
  });
});

describe("SearchResult type", () => {
  it("has all required fields", () => {
    const result: SearchResult = {
      title: "Quantum breakthrough at IBM",
      url: "https://example.com/quantum",
      snippet: "IBM announced...",
      content: "Full text content...",
    };
    expect(result.url).toMatch(/^https?:\/\//);
  });
});

describe("Synthesis type", () => {
  it("contains citations array", () => {
    const citation: Citation = { num: 1, title: "Source", url: "https://example.com" };
    const synthesis: Synthesis = {
      queryId: "q1",
      query: "test query",
      synthesis: "Synthesised text [1]",
      citations: [citation],
    };
    expect(synthesis.citations).toHaveLength(1);
    expect(synthesis.citations[0].num).toBe(1);
  });
});

// ─── Agent event kind validation ─────────────────────────────────────────────

describe("AgentEventKind", () => {
  it("plan event has subQueries array", () => {
    const subQueries: SubQuery[] = [
      { id: "q1", query: "test", rationale: "because" },
    ];
    const event = { kind: "plan" as const, payload: { subQueries } };
    expect(event.kind).toBe("plan");
    expect(event.payload.subQueries).toHaveLength(1);
  });

  it("error event has message string", () => {
    const event = { kind: "error" as const, payload: { message: "Something went wrong" } };
    expect(typeof event.payload.message).toBe("string");
  });
});
