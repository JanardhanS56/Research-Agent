// ─── Shared Types ───────────────────────────────────────────────────────────

/** A single web search result */
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  /** Extracted plain-text body (first ~2000 chars) */
  content: string;
}

/** Output of one sub-query search round */
export interface SearchBundle {
  queryId: string;
  query: string;
  results: SearchResult[];
}

/** A planned sub-query from the Planner agent */
export interface SubQuery {
  id: string;
  query: string;
  rationale: string;
}

/** Synthesis for a single sub-query */
export interface Synthesis {
  queryId: string;
  query: string;
  synthesis: string;
  citations: Citation[];
}

/** A numbered citation */
export interface Citation {
  num: number;
  title: string;
  url: string;
}

// ─── SSE Agent Events ────────────────────────────────────────────────────────

export type AgentEventKind =
  | "plan"
  | "search_start"
  | "search_done"
  | "synthesis_chunk"
  | "synthesis_done"
  | "report_chunk"
  | "done"
  | "error";

export interface AgentEvent<T = unknown> {
  kind: AgentEventKind;
  payload: T;
}

export type PlanEvent = AgentEvent<{ subQueries: SubQuery[] }>;
export type SearchStartEvent = AgentEvent<{ queryId: string; query: string }>;
export type SearchDoneEvent = AgentEvent<{ bundle: SearchBundle }>;
export type SynthesisChunkEvent = AgentEvent<{ queryId: string; chunk: string }>;
export type SynthesisDoneEvent = AgentEvent<{ synthesis: Synthesis }>;
export type ReportChunkEvent = AgentEvent<{ chunk: string }>;
export type DoneEvent = AgentEvent<{ totalCitations: number }>;
export type ErrorEvent = AgentEvent<{ message: string }>;

// ─── NVIDIA API Types ────────────────────────────────────────────────────────

export interface NvidiaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface NvidiaRequestOptions {
  messages: NvidiaMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  enable_thinking?: boolean;
}

// ─── Library Types ───────────────────────────────────────────────────────────
export type {
  SavedResearch,
  ResearchTopic,
  TopicPriority,
  TopicStatus,
  LibraryExportData,
} from "./library";

