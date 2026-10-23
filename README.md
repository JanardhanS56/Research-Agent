# Research Agent

> An AI-powered autonomous research assistant powered by NVIDIA Nemotron-3.5-bolt-e4b — performs multi-step web research, synthesises findings, and delivers cited Markdown reports in real-time.

---

## What It Does

Instead of asking an LLM a question and getting one static response, **Research Agent**:

1. **Plans**: Decomposes your research question into targeted sub-queries.
2. **Searches**: Fetches real web results for each sub-query.
3. **Synthesises**: Reads and condenses what it found per topic.
4. **Reports**: Compiles a coherent, cited Markdown report — streamed live to your browser.

All steps are visible in the UI as they happen.

---

## Quick Start

### Prerequisites
- Node.js ≥ 20
- An [NVIDIA NIM API key](https://build.nvidia.com/)

### Install & Run

```bash
# 1. Clone
git clone https://github.com/JanardhanS56/Research-Agent.git
cd Research-Agent

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env and add your NVIDIA_API_KEY

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NVIDIA_API_KEY` | ✅ | Your NVIDIA NIM API key (`nvapi-...`) |
| `NVIDIA_MODEL` | ✅ | Model ID (default: `nvidia/nemotron-3.5-bolt-e4b`) |
| `BRAVE_SEARCH_API_KEY` | ❌ | Optional: Brave Search API for richer results |
| `SERPER_API_KEY` | ❌ | Optional: Serper.dev as search backend |

---

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full design.

```
Query → Planner → Searcher → Synthesizer → Reporter
                                               │
                         ◀──── SSE Stream ─────┘
```

---

## Available Scripts

```bash
npm run dev       # Start Next.js dev server
npm run build     # Production build
npm run lint      # ESLint check
npm test          # Vitest unit tests
npm run type-check # TypeScript strict check
```

---

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **LLM**: NVIDIA Nemotron-3.5-bolt-e4b (with chain-of-thought thinking)
- **Search**: DuckDuckGo (zero-config) | Brave | Serper
- **Streaming**: Server-Sent Events
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS

---

## License

MIT
