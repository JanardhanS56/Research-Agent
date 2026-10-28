"use client";

import { useState, useEffect } from "react";
import QueryForm from "./components/QueryForm";
import AgentTimeline from "./components/AgentTimeline";
import ReportViewer from "./components/ReportViewer";
import LibraryView from "./components/LibraryView";
import ChatAgentView from "./components/ChatAgentView";
import type { AgentEvent, SubQuery } from "./lib/types";
import { getSavedResearches, getResearchTopics } from "./lib/library";
import type { ResearchChatContext } from "./lib/chat-agent";
import Footer from "./components/Footer";
import CookieBanner from "./components/CookieBanner";

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
  const [currentView, setCurrentView] = useState<"workspace" | "chat" | "library">("workspace");
  const [libraryCounts, setLibraryCounts] = useState({ saved: 0, topics: 0 });
  const [chatContext, setChatContext] = useState<ResearchChatContext | null>(null);

  const [state, setState] = useState<ResearchState>({
    status: "idle",
    query: "",
    subQueries: [],
    steps: [],
    report: "",
  });

  // Keep library badge counts synchronized
  function refreshLibraryCounts() {
    setLibraryCounts({
      saved: getSavedResearches().length,
      topics: getResearchTopics().filter((t) => t.status !== "completed").length,
    });
  }

  useEffect(() => {
    refreshLibraryCounts();
  }, [currentView]);

  function updateStep(id: string, updates: Partial<AgentStep>) {
    setState((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  }

  async function handleSubmit(query: string) {
    setCurrentView("workspace");
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

  // Load an existing library research into workspace viewer
  function handleLoadResearchToWorkspace(query: string, report: string) {
    setState({
      status: "done",
      query,
      subQueries: [],
      steps: [
        { id: "loaded", kind: "report_chunk", label: "Loaded from Library archive", status: "done" },
      ],
      report,
    });
    setCurrentView("workspace");
  }

  // Launch direct research on a backlog topic
  function handleLaunchTopicResearch(topicQuery: string) {
    setCurrentView("workspace");
    handleSubmit(topicQuery);
  }

  // Open Chat Agent grounded in a specific research report
  function handleOpenChatWithResearch(query: string, report: string) {
    setChatContext({ query, report });
    setCurrentView("chat");
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0c0e] text-zinc-100 font-sans">
      {/* Top Application Bar */}
      <header className="border-b border-[#20222a] bg-[#101216] px-4 py-2.5 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono font-semibold text-sm tracking-wide text-zinc-100">
              RESEARCH AGENT
            </span>
            <span className="text-[11px] font-mono text-zinc-500 px-1.5 py-0.5 rounded border border-[#262832] bg-[#16181e]">
              nemotron-3.5-bolt
            </span>

            {/* View Switcher Tabs */}
            <div className="ml-2 flex items-center bg-[#0c0e12] p-0.5 rounded-lg border border-[#20222a]">
              <button
                type="button"
                onClick={() => setCurrentView("workspace")}
                className={`px-3 py-1 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 ${
                  currentView === "workspace"
                    ? "bg-[#1d202a] text-zinc-100 shadow-sm font-medium"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Workspace
              </button>

              <button
                type="button"
                onClick={() => setCurrentView("chat")}
                className={`px-3 py-1 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 ${
                  currentView === "chat"
                    ? "bg-[#1d202a] text-zinc-100 shadow-sm font-medium"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Chat Agent
                {chatContext && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" title={`Anchored: ${chatContext.query}`} />
                )}
              </button>

              <button
                type="button"
                onClick={() => setCurrentView("library")}
                className={`px-3 py-1 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 ${
                  currentView === "library"
                    ? "bg-[#1d202a] text-zinc-100 shadow-sm font-medium"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Library
                {(libraryCounts.saved > 0 || libraryCounts.topics > 0) && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-800/50">
                    {libraryCounts.saved + libraryCounts.topics}
                  </span>
                )}
              </button>
            </div>
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

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 space-y-6">
        {currentView === "library" ? (
          <LibraryView
            onLoadResearchToWorkspace={handleLoadResearchToWorkspace}
            onLaunchTopicResearch={handleLaunchTopicResearch}
            onBackToWorkspace={() => setCurrentView("workspace")}
            onChatWithResearch={handleOpenChatWithResearch}
          />
        ) : currentView === "chat" ? (
          <ChatAgentView
            initialContext={chatContext}
            onContextChange={setChatContext}
            onOpenLibrary={() => setCurrentView("library")}
          />
        ) : (
          <>
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
                  subQueries={state.subQueries}
                  onSaved={refreshLibraryCounts}
                  onOpenLibrary={() => setCurrentView("library")}
                  onChatWithReport={handleOpenChatWithResearch}
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
          </>
        )}
      </main>
      <Footer />
      <CookieBanner />
    </div>
  );
}
