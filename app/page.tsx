"use client";

import { useState } from "react";
import QueryForm from "./components/QueryForm";
import AgentTimeline from "./components/AgentTimeline";
import ReportViewer from "./components/ReportViewer";
import type { AgentEvent, SubQuery } from "./lib/types";

export interface AgentStep {
  id: string;
  kind: AgentEvent["kind"];
  label: string;
  status: "pending" | "running" | "done" | "error";
  detail?: string;
}

export interface ResearchState {
  status: "idle" | "researching" | "done" | "error";
  query: string;
  subQueries: SubQuery[];
  steps: AgentStep[];
  report: string;
  error?: string;
}

export default function Home() {
  const [state, setState] = useState<ResearchState>({
    status: "idle",
    query: "",
    subQueries: [],
    steps: [],
    report: "",
  });

  function updateStep(id: string, updates: Partial<AgentStep>) {
    setState((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  }

  async function handleSubmit(query: string) {
    setState({
      status: "researching",
      query,
      subQueries: [],
      steps: [
        { id: "plan", kind: "plan", label: "Decomposing query into sub-questions", status: "running" },
      ],
      report: "",
    });

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!res.body) throw new Error("Connection failed: no response stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let reportAccum = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const raw = trimmed.slice(6);

          let event: AgentEvent;
          try {
            event = JSON.parse(raw) as AgentEvent;
          } catch {
            continue;
          }

          switch (event.kind) {
            case "plan": {
              const { subQueries } = event.payload as { subQueries: SubQuery[] };
              const searchSteps: AgentStep[] = subQueries.map((sq) => ({
                id: `search-${sq.id}`,
                kind: "search_start",
                label: `Web retrieval: "${sq.query}"`,
                status: "pending",
              }));
              const synthSteps: AgentStep[] = subQueries.map((sq) => ({
                id: `synth-${sq.id}`,
                kind: "synthesis_chunk",
                label: `Synthesizing evidence: "${sq.query}"`,
                status: "pending",
              }));

              setState((prev) => ({
                ...prev,
                subQueries,
                steps: [
                  { id: "plan", kind: "plan", label: "Decomposing query into sub-questions", status: "done" },
                  ...searchSteps,
                  ...synthSteps,
                  { id: "report", kind: "report_chunk", label: "Compiling cited research document", status: "pending" },
                ],
              }));
              break;
            }

            case "search_start": {
              const { queryId } = event.payload as { queryId: string };
              updateStep(`search-${queryId}`, { status: "running" });
              break;
            }

            case "search_done": {
              const { bundle } = event.payload as { bundle: { queryId: string; results: Array<{ title: string; url: string }> } };
              updateStep(`search-${bundle.queryId}`, {
                status: "done",
                detail: `${bundle.results.length} sources retrieved`,
              });
              updateStep(`synth-${bundle.queryId}`, { status: "running" });
              break;
            }

            case "synthesis_chunk": {
              // Internal token stream update
              break;
            }

            case "synthesis_done": {
              const { synthesis } = event.payload as { synthesis: { queryId: string; citations: Array<{ url: string }> } };
              updateStep(`synth-${synthesis.queryId}`, {
                status: "done",
                detail: `${synthesis.citations.length} cited reference(s)`,
              });
              break;
            }

            case "report_chunk": {
              const { chunk } = event.payload as { chunk: string };
              reportAccum += chunk;
              updateStep("report", { status: "running" });
              setState((prev) => ({ ...prev, report: reportAccum }));
              break;
            }

            case "done": {
              updateStep("report", { status: "done" });
              setState((prev) => ({ ...prev, status: "done" }));
              break;
            }

            case "error": {
              const { message } = event.payload as { message: string };
              setState((prev) => ({ ...prev, status: "error", error: message }));
              break;
            }
          }
        }
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      }));
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0c0e] text-zinc-100 font-sans">
      {/* Top Application Bar */}
      <header className="border-b border-[#20222a] bg-[#101216] px-4 py-2.5">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono font-semibold text-sm tracking-wide text-zinc-100">
              RESEARCH AGENT
            </span>
            <span className="text-[11px] font-mono text-zinc-500 px-1.5 py-0.5 rounded border border-[#262832] bg-[#16181e]">
              nemotron-3.5-bolt
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${state.status === "researching" ? "bg-amber-400" : "bg-emerald-400"}`} />
              {state.status === "researching" ? "Pipeline active" : "Engine ready"}
            </span>
            <span className="hidden sm:inline text-zinc-700">|</span>
            <span className="hidden sm:inline">DuckDuckGo / Brave</span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Compact Workspace Header */}
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
            Autonomous Deep Research
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Plans search matrices, parses live web sources, and compiles verified Markdown briefs with citations.
          </p>
        </div>

        {/* Query Input */}
        <QueryForm
          onSubmit={handleSubmit}
          isLoading={state.status === "researching"}
        />

        {/* Active Investigation Area */}
        {state.status !== "idle" ? (
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 pt-2">
            <AgentTimeline steps={state.steps} subQueries={state.subQueries} />
            <ReportViewer
              report={state.report}
              status={state.status}
              error={state.error}
              query={state.query}
              steps={state.steps}
            />
          </div>
        ) : (
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-xl border border-[#20232c] bg-[#111317]/60 hover:border-[#2e3340] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </div>
              <h3 className="text-xs font-semibold text-zinc-200">1. Query Decomposition</h3>
              <p className="mt-1 text-[11px] text-zinc-400 leading-relaxed">
                Breaks complex research inquiries into a multi-vector matrix of targeted sub-questions.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[#20232c] bg-[#111317]/60 hover:border-[#2e3340] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xs font-semibold text-zinc-200">2. Live Web Retrieval</h3>
              <p className="mt-1 text-[11px] text-zinc-400 leading-relaxed">
                Scrapes fresh web documents across search endpoints, filtering ads and noise.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[#20232c] bg-[#111317]/60 hover:border-[#2e3340] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xs font-semibold text-zinc-200">3. Cited Synthesis</h3>
              <p className="mt-1 text-[11px] text-zinc-400 leading-relaxed">
                Compiles structured Markdown briefs with chain-of-thought evidence and explicit source citations.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
