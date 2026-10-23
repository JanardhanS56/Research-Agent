"use client";

import { useState } from "react";
import QueryForm from "./components/QueryForm";
import AgentTimeline from "./components/AgentTimeline";
import ReportViewer from "./components/ReportViewer";
import type { AgentEvent, SubQuery, SearchBundle, Synthesis } from "./lib/types";

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
        { id: "plan", kind: "plan", label: "Planning research strategy…", status: "running" },
      ],
      report: "",
    });

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!res.body) throw new Error("No response body");

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
                label: `Searching: ${sq.query}`,
                status: "pending",
              }));
              const synthSteps: AgentStep[] = subQueries.map((sq) => ({
                id: `synth-${sq.id}`,
                kind: "synthesis_chunk",
                label: `Synthesising: ${sq.query}`,
                status: "pending",
              }));
              setState((prev) => ({
                ...prev,
                subQueries,
                steps: [
                  { ...prev.steps[0], status: "done", detail: `${subQueries.length} sub-queries planned` },
                  ...searchSteps,
                  ...synthSteps,
                  { id: "report", kind: "report_chunk", label: "Compiling final report…", status: "pending" },
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
              const { bundle } = event.payload as { bundle: SearchBundle };
              updateStep(`search-${bundle.queryId}`, {
                status: "done",
                detail: `${bundle.results.length} sources found`,
              });
              updateStep(`synth-${bundle.queryId}`, { status: "running" });
              break;
            }

            case "synthesis_done": {
              const { synthesis } = event.payload as { synthesis: Synthesis };
              updateStep(`synth-${synthesis.queryId}`, {
                status: "done",
                detail: `${synthesis.citations.length} citations`,
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
              updateStep("report", { status: "done", detail: "Report complete" });
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
    <main className="min-h-screen relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[100px]" />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full bg-cyan-600/5 blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-400 pulse-dot inline-block" />
            Powered by NVIDIA Nemotron-3.5-bolt
          </div>
          <h1 className="text-5xl font-bold mb-4">
            <span className="gradient-text">Research Agent</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Drop a research question. The agent plans, searches the web, synthesises sources,
            and delivers a fully cited report — live.
          </p>
        </header>

        {/* Query Form */}
        <QueryForm
          onSubmit={handleSubmit}
          isLoading={state.status === "researching"}
        />

        {/* Main Content */}
        {state.status !== "idle" && (
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 animate-fade-in">
            {/* Left: Timeline */}
            <AgentTimeline steps={state.steps} subQueries={state.subQueries} />

            {/* Right: Report */}
            <ReportViewer
              report={state.report}
              status={state.status}
              error={state.error}
              query={state.query}
            />
          </div>
        )}
      </div>
    </main>
  );
}
