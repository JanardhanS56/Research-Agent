# Research Agent – Architecture & Design

## 1. System Overview

```
User Query
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│                   RESEARCH AGENT PIPELINE                   │
│                                                             │
│  ┌──────────┐   ┌──────────┐   ┌───────────┐   ┌────────┐  │
│  │  PLANNER │──▶│ SEARCHER │──▶│SYNTHESIZER│──▶│REPORTER│  │
│  └──────────┘   └──────────┘   └───────────┘   └────────┘  │
│       │               │               │               │     │
│   Decompose       Web Search       Distill &       Compile  │
│   into N       (DuckDuckGo /     Fact-check      cited MD   │
│  sub-queries   Brave/SerpAPI)     per chunk        report   │
└─────────────────────────────────────────────────────────────┘
    │
    ▼ (Server-Sent Events – real-time streaming to browser)
┌────────────────────────────────────────────────────────────┐
│                       FRONTEND UI                          │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Query Input  │  │ Agent Steps  │  │   Final Report  │  │
│  │    Form      │  │  (Timeline)  │  │  (Markdown PDF) │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## 2. Agent Pipeline Detail

### 2.1 Planner Agent
- **Input**: Raw user research query.
- **Task**: Decompose into 3–5 concrete, answerable sub-questions, each optimised as a web search query.
- **Model**: NVIDIA Nemotron-3.5-bolt-e4b, `enable_thinking: true`.
- **Output**: JSON array of `{ id, query, rationale }`.

### 2.2 Searcher
- **Input**: Each sub-query from the Planner.
- **Task**: Execute web search (DuckDuckGo HTML scrape by default; pluggable for Brave/SerpAPI via env vars). Retrieve top 3 URLs. Fetch URL text, strip HTML, truncate to 2000 chars each.
- **Output**: Array of `{ query, results: [{ title, url, snippet, content }] }`.

### 2.3 Synthesizer Agent
- **Input**: Per-query search results bundle.
- **Task**: Ask the model to synthesise findings from the retrieved chunks, flag uncertain or contradictory claims.
- **Model**: NVIDIA Nemotron-3.5-bolt-e4b, streaming enabled.
- **Output**: Streamed `{ queryId, synthesis, citations }`.

### 2.4 Reporter Agent
- **Input**: All synthesis outputs.
- **Task**: Compile final Markdown report with:
  - Executive Summary
  - Section per sub-question
  - Key Findings
  - Numbered Citation list
- **Model**: NVIDIA Nemotron-3.5-bolt-e4b with structured system prompt.
- **Output**: Streamed Markdown string.

---

## 3. Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router) | Full-stack, streaming API routes, RSC |
| Language | TypeScript 5.x | Type safety across agents |
| LLM Provider | NVIDIA NIM API (Nemotron-3.5-bolt-e4b) | Provided by user |
| Web Search | DuckDuckGo (default, no key) | Zero-config; pluggable |
| HTML Parsing | `node-html-parser` | Lightweight, no headless browser |
| Streaming | Server-Sent Events (SSE) | Native in Next.js API routes |
| Styling | Tailwind CSS | Rapid premium UI |
| Tests | Vitest + Testing Library | Fast, ESM-native |
| Linting | ESLint (Next.js preset) + Prettier | R3 gate requirement |

---

## 4. Data Flow & Streaming Protocol

The client subscribes to `GET /api/research?q=...` as an SSE stream. Each event is a JSON-encoded `AgentEvent`:

```ts
type AgentEventKind =
  | "plan"          // Planner output: sub-queries
  | "search_start"  // Searcher starting a sub-query
  | "search_done"   // Searcher found results
  | "synthesis"     // Partial synthesis text (streaming)
  | "report"        // Partial final report text (streaming)
  | "done"          // Pipeline complete
  | "error";        // Fatal error

interface AgentEvent {
  kind: AgentEventKind;
  payload: unknown;
}
```

---

## 5. File Structure

```
Research Agent/
├── app/
│   ├── api/
│   │   └── research/
│   │       └── route.ts          # SSE streaming endpoint
│   ├── components/
│   │   ├── AgentTimeline.tsx     # Step-by-step progress sidebar
│   │   ├── QueryForm.tsx         # Search input + submit
│   │   └── ReportViewer.tsx      # Markdown renderer + export
│   ├── lib/
│   │   ├── nvidia.ts             # NVIDIA API wrapper
│   │   ├── search.ts             # DuckDuckGo search + fetch
│   │   ├── types.ts              # Shared TypeScript types
│   │   └── agents/
│   │       ├── planner.ts
│   │       ├── synthesizer.ts
│   │       └── reporter.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── ARCHITECTURE.md               ← this file
├── LOGBOOK.md
├── README.md
├── .env
├── .env.example
├── .gitignore
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## 6. Environment Variables

```bash
# Required
NVIDIA_API_KEY=nvapi-...

# Optional search backends (if blank, uses DuckDuckGo HTML)
BRAVE_SEARCH_API_KEY=
SERPER_API_KEY=
```

---

## 7. Phase Roadmap

| Phase | Branch | Scope |
|---|---|---|
| 1 | `feat/scaffold-core-engine` | Scaffold, ESLint, Vitest, types, NVIDIA client, search |
| 2 | `feat/agent-pipeline` | Planner, Synthesizer, Reporter agents + SSE route |
| 3 | `feat/research-dashboard` | Premium UI: QueryForm, AgentTimeline, ReportViewer |
