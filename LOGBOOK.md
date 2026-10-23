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
