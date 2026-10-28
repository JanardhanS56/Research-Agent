# Project Logbook: Research Agent

## Architecture & Engineering Decision Records (ADRs)

### ADR-001: Initial Repository Audit & Discovery
- **Date**: 2026-10-24
- **Status**: Accepted
- **Context**: Forked from `sameer10237/Research-Agent.git` to `JanardhanS56/Research-Agent.git`.
- **Finding**: Upstream repository contains only a single commit (`23e6af1`) with a Next.js `create-next-app` boilerplate `README.md`. No `package.json`, source files, or backend/frontend architectures were committed upstream.
- **Decision**: Document upstream status, present discovery findings to user, establish logbook, and propose Phase 1 project scaffolding (Next.js + TypeScript + AI agent runtime architecture).

### ADR-002: Model & Reasoning Engine Selection
- **Date**: 2026-10-24
- **Status**: Accepted
- **Context**: User provided NVIDIA API key and required integration with `nvidia/nemotron-3.5-bolt-e4b` using `chat_template_kwargs.enable_thinking: true`.
- **Decision**: Implement low-level fetch client `chatStream` and `chatJSON` targeting `https://integrate.api.nvidia.com/v1/chat/completions`. Strip reasoning thinking blocks when extracting final text or structured JSON schemas.

### ADR-003: Multi-Agent Pipeline Architecture
- **Date**: 2026-10-24
- **Status**: Accepted
- **Context**: Complex research questions require decomposition, retrieval, per-source synthesis, and cohesive report compilation.
- **Decision**: Structure pipeline into 4 autonomous agents:
  1. **Planner Agent**: Decomposes query into 3–5 targeted sub-questions with search queries.
  2. **Searcher Agent**: Parallel web search with snippet extraction.
  3. **Synthesizer Agent**: Summarizes and cites findings per sub-question.
  4. **Reporter Agent**: Synthesizes comprehensive markdown report with references.

### ADR-004: Dual-Engine Web Search Strategy
- **Date**: 2026-10-24
- **Status**: Accepted
- **Context**: Zero-config local execution needed without requiring paid search API keys upfront, while offering upgrade path to high-rate-limit commercial APIs.
- **Decision**: Default to DuckDuckGo HTML scraping (`node-html-parser`), with automatic fallback/upgrade to Brave Search API or Serper.dev if API keys are configured in `.env`.

### ADR-005: Real-Time SSE Streaming Protocol
- **Date**: 2026-10-24
- **Status**: Accepted
- **Context**: User needs continuous terminal and web visibility into agent thoughts, search events, and synthesis progress.
- **Decision**: Implement Server-Sent Events (`POST /api/research`) streaming strongly-typed `AgentEvent` payloads. Client renders agent timeline and streams report tokens live.

### ADR-006: Dual-Modal Runtime: Terminal CLI & Web Application
- **Date**: 2026-10-24
- **Status**: Accepted
- **Context**: User explicitly requested running the research agent directly in the user terminal as well as having a web interface.
- **Decision**: Implemented `bin/cli.ts` executed via `tsx` (`npm run cli` / `npm run research`). Features ANSI-styled stage outputs, token-by-token stdout report streaming, interactive prompt mode, query arg mode, zero-dependency `.env` parsing, and automatic disk persistence to `reports/report-<slug>-<timestamp>.md`.

### ADR-007: De-AI Aesthetic Refactor & Technical Workstation UI
- **Date**: 2026-10-24
- **Status**: Accepted
- **Context**: User provided a critique of generic AI design tells (purple-to-blue gradients, glowing background orbs, eyebrow badges with pulsing dots, emoji cards, pill buttons, uniform breathing animations, buzzword copy).
- **Decision**: Redesigned UI into a technical research studio / workstation:
  1. Palette: Deep graphite background (`#0b0c0e`), hairline neutral borders (`#252830`), high-contrast bone typography (`#f3f4f6`), and functional status badges. Eliminated all glowing orbs, rainbow gradient text, and glassmorphic blurs.
  2. Components: Replaced cartoon emojis (`🧠`, `🔍`, `⚗️`) with precision SVGs; replaced pill buttons with crisp tactile buttons with keyboard shortcut badges (`Ctrl+Enter`).
  3. Layout: Implemented an application top-bar with engine telemetry and a high-density split-pane workspace (Execution Trace & Investigation Brief).
  4. Copy: Replaced generic AI buzzwords with grounded engineering terminology and realistic benchmark inquiry presets.

### ADR-008: Research Library & Investigation Backlog Architecture
- **Date**: 2026-10-27
- **Status**: Accepted
- **Context**: User required the ability to save completed research briefs to a persistent library with search and tagging capabilities, as well as maintain an ideation/task backlog of topics to research later with one-click automated execution.
- **Decision**:
  1. Implemented client-side persistent storage layer (`app/lib/library.ts`) utilizing `localStorage` with in-memory test fallback, supporting `SavedResearch` and `ResearchTopic` schemas.
  2. Built `LibraryView` component supporting full-text search, multi-tag filtering, sort orders (pinned first, recent, word count, alphabetical), reader modal with Markdown rendering, and JSON backup export/import.
  3. Integrated "Save to Library" directly into `ReportViewer` with metadata tagging and personal note attachments.
  4. Implemented Topics Backlog with priority badges (High, Medium, Low) and direct "Launch Research" dispatch that transitions seamlessly into active execution.

### ADR-009: KokonutUI Animated AI Loading State & Workspace Refinement
- **Date**: 2026-10-27
- **Status**: Accepted
- **Context**: User provided visual and loading assets in a temporary `UI refinement` directory and requested a smooth, attractive loading experience during query synthesis, along with removal of the temporary assets.
- **Decision**:
  1. Built `app/components/ui/ai-loading.tsx` integrating multi-ring concentric SVG rotating animations, real-time terminal output, line numbering, and step progress indicators.
  2. Integrated `AILoadingState` directly into `ReportViewer.tsx` as the primary execution screen when research is in progress.
  3. Added a clean, 3-column capability grid on the workspace home page displayed during idle state.
  4. Permanently deleted the temporary `UI refinement` directory.

### ADR-010: Context-Grounded Conversational Chat Agent & Library Interrogation
- **Date**: 2026-10-28
- **Status**: Accepted
- **Context**: User required a dedicated Chat Agent distinct from the Research Agent, powered by the same NVIDIA Nemotron model (`nvidia/nemotron-3.5-bolt-e4b`), that handles general conversation but can be contextually anchored to specific research briefs (from active workspace or imported from the Library).
- **Decision**:
  1. Built `app/lib/chat-agent.ts` with system prompt crafting that injects research context and operational directives (grounded citations, synthesis, discrepancy checking).
  2. Created streaming SSE route `POST /api/chat` streaming tokens from NVIDIA Nemotron.
  3. Developed `app/components/ChatAgentView.tsx` featuring context indicator header, "Attach Research" modal for importing saved reports or backlog topics from the Library, report preview slide-over, suggested prompt chips, and Markdown transcript export.
  4. Cross-linked "Chat with Report" action buttons across `ReportViewer.tsx` and `LibraryView.tsx`, adding the Chat Agent tab to the top navigation bar.

### ADR-011: Endpoint Security Hardening, SSRF Mitigation & Threat Defense
- **Date**: 2026-10-28
- **Status**: Accepted
- **Context**: User requested an adversarial security audit across all application endpoints to identify potential compromise vectors, data leaks, and DoS risks, followed by iterative remediation.
- **Decision**:
  1. **SSRF & Metadata Defense**: Implemented `isSafeUrl` in `app/lib/search.ts` blocking loopback, RFC-1918 private subnets, cloud metadata services (`169.254.169.254`, `metadata.google.internal`), decimal/hex IP encodings, and non-HTTP schemes. Enforced manual redirect validation to prevent redirect-based SSRF.
  2. **In-Memory Rate Limiting**: Created `app/lib/rate-limit.ts` implementing a sliding window token bucket per IP (5 req/min on `/api/research`, 30 req/min on `/api/chat`) returning HTTP 429 with `Retry-After`. Added safe JSON parsing and strict input limits (1,000 chars query, 50 chat messages, 8,000 chars/message, 50,000 chars report).
  3. **Prompt Injection & Exfiltration Defense**: Enclosed untrusted web page text in explicit `<untrusted_source>` XML delimiters in `synthesizer.ts`. Created `safeMarkdownComponents` in `app/lib/markdown-security.tsx` disabling external markdown image rendering to prevent tracking pixels and silent data exfiltration.
  4. **OWASP Security Headers & Error Masking**: Configured `next.config.ts` with `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy`. Added `validateOrigin` cross-origin enforcement and sanitized server error payloads to prevent internal telemetry disclosure.



