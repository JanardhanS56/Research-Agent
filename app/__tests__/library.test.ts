import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateWordCount,
  extractCitationCount,
  saveResearch,
  getSavedResearches,
  updateSavedResearch,
  deleteSavedResearch,
  togglePinResearch,
  addResearchTopic,
  getResearchTopics,
  updateResearchTopic,
  deleteResearchTopic,
  filterResearches,
  filterTopics,
  exportLibraryJSON,
  importLibraryJSON,
  persistResearches,
  persistTopics,
} from "../lib/library";

describe("Library Storage & Utilities", () => {
  beforeEach(() => {
    persistResearches([]);
    persistTopics([]);
  });

  describe("Utility functions", () => {
    it("calculates word count accurately", () => {
      expect(calculateWordCount("")).toBe(0);
      expect(calculateWordCount("   ")).toBe(0);
      expect(calculateWordCount("Autonomous Deep Research Agent")).toBe(4);
      expect(calculateWordCount("Word1\n\nWord2  \tWord3")).toBe(3);
    });

    it("extracts citation count accurately", () => {
      const sample = "According to study [1], results indicate [2]. Further confirmed by [1] and [3].";
      expect(extractCitationCount(sample)).toBe(3);
      expect(extractCitationCount("No citations here")).toBe(0);
    });
  });

  describe("Saved Research CRUD", () => {
    it("saves and retrieves a research item", () => {
      const item = saveResearch({
        query: "Quantum Computing Advances",
        report: "# Quantum Advances\n\nRecent benchmarks show exponential speedup [1].",
        tags: ["Quantum", "Physics"],
        pinned: false,
      });

      expect(item.id).toBeDefined();
      expect(item.wordCount).toBe(9);
      expect(item.citationsCount).toBe(1);

      const all = getSavedResearches();
      expect(all).toHaveLength(1);
      expect(all[0].query).toBe("Quantum Computing Advances");
    });

    it("updates and toggles pin for a saved research", () => {
      const item = saveResearch({
        query: "AI Agents in 2026",
        report: "Full report on autonomous reasoning systems.",
        tags: ["AI"],
        pinned: false,
      });

      const updated = updateSavedResearch(item.id, { notes: "Very promising study" });
      expect(updated?.notes).toBe("Very promising study");

      const pinned = togglePinResearch(item.id);
      expect(pinned?.pinned).toBe(true);

      const unpinned = togglePinResearch(item.id);
      expect(unpinned?.pinned).toBe(false);
    });

    it("deletes a saved research item", () => {
      const item = saveResearch({
        query: "Temporary Topic",
        report: "Short summary.",
        tags: [],
        pinned: false,
      });

      expect(getSavedResearches()).toHaveLength(1);
      const deleted = deleteSavedResearch(item.id);
      expect(deleted).toBe(true);
      expect(getSavedResearches()).toHaveLength(0);
    });
  });

  describe("Research Topics Backlog CRUD", () => {
    it("adds, updates and deletes backlog topics", () => {
      const topic = addResearchTopic({
        topic: "CRISPR off-target validation",
        notes: "Investigate latest base editing methods",
        priority: "high",
        tags: ["Bio", "Genetics"],
      });

      expect(topic.id).toBeDefined();
      expect(topic.status).toBe("queued");
      expect(getResearchTopics()).toHaveLength(1);

      const updated = updateResearchTopic(topic.id, { status: "completed" });
      expect(updated?.status).toBe("completed");

      const deleted = deleteResearchTopic(topic.id);
      expect(deleted).toBe(true);
      expect(getResearchTopics()).toHaveLength(0);
    });
  });

  describe("Search & Filtering", () => {
    it("filters saved research by text, tag, and sort order", () => {
      saveResearch({
        query: "Neural Networks Overview",
        report: "Deep learning models [1] and backpropagation.",
        tags: ["AI", "Tech"],
        pinned: false,
      });

      saveResearch({
        query: "CRISPR Therapeutics",
        report: "Gene therapy trial results [1] [2].",
        tags: ["Bio"],
        pinned: true,
      });

      const all = getSavedResearches();

      // Text search
      const searchResult = filterResearches(all, "neural");
      expect(searchResult).toHaveLength(1);
      expect(searchResult[0].query).toBe("Neural Networks Overview");

      // Tag filter
      const bioFilter = filterResearches(all, "", "Bio");
      expect(bioFilter).toHaveLength(1);
      expect(bioFilter[0].query).toBe("CRISPR Therapeutics");

      // Pinned sort
      const pinnedSorted = filterResearches(all, "", "all", "pinned");
      expect(pinnedSorted[0].pinned).toBe(true);
    });

    it("filters research topics by priority and status", () => {
      addResearchTopic({ topic: "Topic A", priority: "low", tags: [] });
      addResearchTopic({ topic: "Topic B", priority: "high", tags: [] });
      addResearchTopic({ topic: "Topic C", priority: "medium", tags: [] });

      const all = getResearchTopics();
      const highOnly = filterTopics(all, "", "high");
      expect(highOnly).toHaveLength(1);
      expect(highOnly[0].topic).toBe("Topic B");

      const sorted = filterTopics(all);
      expect(sorted[0].priority).toBe("high");
      expect(sorted[1].priority).toBe("medium");
      expect(sorted[2].priority).toBe("low");
    });
  });

  describe("Export & Import", () => {
    it("exports and imports library data accurately", () => {
      saveResearch({
        query: "Export Test Query",
        report: "Report body for test",
        tags: ["Test"],
        pinned: true,
      });

      addResearchTopic({
        topic: "Export Test Topic",
        priority: "medium",
        tags: ["Test"],
      });

      const jsonStr = exportLibraryJSON();
      expect(jsonStr).toContain("Export Test Query");
      expect(jsonStr).toContain("Export Test Topic");

      // Clear
      persistResearches([]);
      persistTopics([]);
      expect(getSavedResearches()).toHaveLength(0);
      expect(getResearchTopics()).toHaveLength(0);

      // Import back
      const result = importLibraryJSON(jsonStr);
      expect(result.success).toBe(true);
      expect(result.importedResearches).toBe(1);
      expect(result.importedTopics).toBe(1);

      expect(getSavedResearches()).toHaveLength(1);
      expect(getResearchTopics()).toHaveLength(1);
    });
  });
});
