// ─── Research Library Storage & Model ──────────────────────────────────────────

export type TopicPriority = "low" | "medium" | "high";
export type TopicStatus = "queued" | "in_progress" | "completed";

export interface SavedResearch {
  id: string;
  query: string;
  report: string;
  createdAt: string; // ISO 8601 string
  updatedAt?: string;
  wordCount: number;
  citationsCount: number;
  tags: string[];
  notes?: string;
  pinned: boolean;
  subQueries?: string[];
}

export interface ResearchTopic {
  id: string;
  topic: string;
  notes?: string;
  priority: TopicPriority;
  status: TopicStatus;
  tags: string[];
  createdAt: string;
}

export interface LibraryExportData {
  version: 1;
  exportedAt: string;
  researches: SavedResearch[];
  topics: ResearchTopic[];
}

const STORAGE_KEY_RESEARCHES = "research_agent_library_items_v1";
const STORAGE_KEY_TOPICS = "research_agent_library_topics_v1";

// In-memory fallback if localStorage is unavailable (e.g. during SSR or test environments)
let memoryResearches: SavedResearch[] | null = null;
let memoryTopics: ResearchTopic[] | null = null;

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    const testKey = "__storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function calculateWordCount(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function extractCitationCount(text: string): number {
  if (!text) return 0;
  // Match standard citation patterns like [1], [2], or numbered reference links
  const matches = text.match(/\[\d+\]/g);
  if (!matches) return 0;
  return new Set(matches).size;
}

// ─── Saved Research Operations ───────────────────────────────────────────────

export function getSavedResearches(): SavedResearch[] {
  if (isLocalStorageAvailable()) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_RESEARCHES);
      if (raw) {
        return JSON.parse(raw) as SavedResearch[];
      }
    } catch {
      // Fall through to memory or empty
    }
  }
  return memoryResearches ?? [];
}

export function persistResearches(items: SavedResearch[]): void {
  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.setItem(STORAGE_KEY_RESEARCHES, JSON.stringify(items));
    } catch {
      // Storage quota or error fallback
    }
  }
  memoryResearches = [...items];
}

export function saveResearch(
  item: Omit<SavedResearch, "id" | "createdAt" | "wordCount" | "citationsCount"> & {
    id?: string;
    createdAt?: string;
    wordCount?: number;
    citationsCount?: number;
  }
): SavedResearch {
  const current = getSavedResearches();
  const id = item.id || `research-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const createdAt = item.createdAt || new Date().toISOString();
  const wordCount = item.wordCount ?? calculateWordCount(item.report);
  const citationsCount = item.citationsCount ?? extractCitationCount(item.report);

  const existingIndex = current.findIndex((r) => r.id === id || r.query.trim().toLowerCase() === item.query.trim().toLowerCase());

  const newEntry: SavedResearch = {
    ...item,
    id: existingIndex >= 0 ? current[existingIndex].id : id,
    createdAt: existingIndex >= 0 ? current[existingIndex].createdAt : createdAt,
    updatedAt: new Date().toISOString(),
    wordCount,
    citationsCount,
    pinned: item.pinned ?? false,
    tags: item.tags || [],
    subQueries: item.subQueries || [],
  };

  let updatedList: SavedResearch[];
  if (existingIndex >= 0) {
    updatedList = [...current];
    updatedList[existingIndex] = newEntry;
  } else {
    updatedList = [newEntry, ...current];
  }

  persistResearches(updatedList);
  return newEntry;
}

export function updateSavedResearch(id: string, updates: Partial<SavedResearch>): SavedResearch | null {
  const current = getSavedResearches();
  const index = current.findIndex((r) => r.id === id);
  if (index === -1) return null;

  const updated: SavedResearch = {
    ...current[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (updates.report !== undefined) {
    updated.wordCount = calculateWordCount(updates.report);
    updated.citationsCount = extractCitationCount(updates.report);
  }

  current[index] = updated;
  persistResearches(current);
  return updated;
}

export function deleteSavedResearch(id: string): boolean {
  const current = getSavedResearches();
  const next = current.filter((r) => r.id !== id);
  if (next.length === current.length) return false;
  persistResearches(next);
  return true;
}

export function togglePinResearch(id: string): SavedResearch | null {
  const current = getSavedResearches();
  const target = current.find((r) => r.id === id);
  if (!target) return null;
  return updateSavedResearch(id, { pinned: !target.pinned });
}

// ─── Research Topics (Backlog) Operations ───────────────────────────────────

export function getResearchTopics(): ResearchTopic[] {
  if (isLocalStorageAvailable()) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_TOPICS);
      if (raw) {
        return JSON.parse(raw) as ResearchTopic[];
      }
    } catch {
      // Fall through
    }
  }
  return memoryTopics ?? [];
}

export function persistTopics(items: ResearchTopic[]): void {
  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.setItem(STORAGE_KEY_TOPICS, JSON.stringify(items));
    } catch {
      // Storage quota or error fallback
    }
  }
  memoryTopics = [...items];
}

export function addResearchTopic(
  item: Omit<ResearchTopic, "id" | "createdAt" | "status"> & {
    id?: string;
    createdAt?: string;
    status?: TopicStatus;
  }
): ResearchTopic {
  const current = getResearchTopics();
  const id = item.id || `topic-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const createdAt = item.createdAt || new Date().toISOString();

  const newTopic: ResearchTopic = {
    ...item,
    id,
    createdAt,
    status: item.status || "queued",
    tags: item.tags || [],
  };

  const updated = [newTopic, ...current];
  persistTopics(updated);
  return newTopic;
}

export function updateResearchTopic(id: string, updates: Partial<ResearchTopic>): ResearchTopic | null {
  const current = getResearchTopics();
  const index = current.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const updated: ResearchTopic = {
    ...current[index],
    ...updates,
  };

  current[index] = updated;
  persistTopics(current);
  return updated;
}

export function deleteResearchTopic(id: string): boolean {
  const current = getResearchTopics();
  const next = current.filter((t) => t.id !== id);
  if (next.length === current.length) return false;
  persistTopics(next);
  return true;
}

// ─── Query & Filtering Helpers ───────────────────────────────────────────────

export function filterResearches(
  items: SavedResearch[],
  search = "",
  tagFilter = "all",
  sortBy: "recent" | "words" | "pinned" | "alpha" = "pinned"
): SavedResearch[] {
  let filtered = [...items];

  const query = search.trim().toLowerCase();
  if (query) {
    filtered = filtered.filter((item) => {
      const queryMatch = item.query.toLowerCase().includes(query);
      const notesMatch = item.notes?.toLowerCase().includes(query) ?? false;
      const tagsMatch = item.tags.some((t) => t.toLowerCase().includes(query));
      const contentMatch = item.report.toLowerCase().includes(query);
      return queryMatch || notesMatch || tagsMatch || contentMatch;
    });
  }

  if (tagFilter && tagFilter !== "all") {
    filtered = filtered.filter((item) =>
      item.tags.some((t) => t.toLowerCase() === tagFilter.toLowerCase())
    );
  }

  filtered.sort((a, b) => {
    if (sortBy === "pinned") {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === "words") {
      return b.wordCount - a.wordCount;
    }
    if (sortBy === "alpha") {
      return a.query.localeCompare(b.query);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return filtered;
}

export function filterTopics(
  topics: ResearchTopic[],
  search = "",
  priorityFilter = "all",
  statusFilter = "all"
): ResearchTopic[] {
  let filtered = [...topics];

  const query = search.trim().toLowerCase();
  if (query) {
    filtered = filtered.filter((t) => {
      const titleMatch = t.topic.toLowerCase().includes(query);
      const notesMatch = t.notes?.toLowerCase().includes(query) ?? false;
      const tagsMatch = t.tags.some((tag) => tag.toLowerCase().includes(query));
      return titleMatch || notesMatch || tagsMatch;
    });
  }

  if (priorityFilter && priorityFilter !== "all") {
    filtered = filtered.filter((t) => t.priority === priorityFilter);
  }

  if (statusFilter && statusFilter !== "all") {
    filtered = filtered.filter((t) => t.status === statusFilter);
  }

  const priorityWeights: Record<TopicPriority, number> = { high: 3, medium: 2, low: 1 };
  filtered.sort((a, b) => {
    const diff = priorityWeights[b.priority] - priorityWeights[a.priority];
    if (diff !== 0) return diff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return filtered;
}

// ─── Export & Import ─────────────────────────────────────────────────────────

export function exportLibraryJSON(): string {
  const data: LibraryExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    researches: getSavedResearches(),
    topics: getResearchTopics(),
  };
  return JSON.stringify(data, null, 2);
}

export function importLibraryJSON(jsonString: string): {
  success: boolean;
  importedResearches: number;
  importedTopics: number;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonString) as Partial<LibraryExportData>;
    if (!parsed || (typeof parsed !== "object")) {
      return { success: false, importedResearches: 0, importedTopics: 0, error: "Invalid JSON format" };
    }

    let rCount = 0;
    if (Array.isArray(parsed.researches)) {
      const current = getSavedResearches();
      const existingIds = new Set(current.map((c) => c.id));
      const newItems: SavedResearch[] = [];
      for (const item of parsed.researches) {
        if (item.query && item.report) {
          if (!existingIds.has(item.id)) {
            newItems.push({
              ...item,
              id: item.id || `research-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              wordCount: item.wordCount ?? calculateWordCount(item.report),
              citationsCount: item.citationsCount ?? extractCitationCount(item.report),
              createdAt: item.createdAt || new Date().toISOString(),
              pinned: Boolean(item.pinned),
              tags: Array.isArray(item.tags) ? item.tags : [],
            });
            rCount++;
          }
        }
      }
      persistResearches([...newItems, ...current]);
    }

    let tCount = 0;
    if (Array.isArray(parsed.topics)) {
      const current = getResearchTopics();
      const existingIds = new Set(current.map((c) => c.id));
      const newTopics: ResearchTopic[] = [];
      for (const topic of parsed.topics) {
        if (topic.topic) {
          if (!existingIds.has(topic.id)) {
            newTopics.push({
              ...topic,
              id: topic.id || `topic-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              priority: topic.priority || "medium",
              status: topic.status || "queued",
              tags: Array.isArray(topic.tags) ? topic.tags : [],
              createdAt: topic.createdAt || new Date().toISOString(),
            });
            tCount++;
          }
        }
      }
      persistTopics([...newTopics, ...current]);
    }

    return {
      success: true,
      importedResearches: rCount,
      importedTopics: tCount,
    };
  } catch (err) {
    return {
      success: false,
      importedResearches: 0,
      importedTopics: 0,
      error: err instanceof Error ? err.message : "Failed to parse import JSON",
    };
  }
}
