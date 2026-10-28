"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  getSavedResearches,
  getResearchTopics,
  type SavedResearch,
  type ResearchTopic,
} from "../lib/library";
import type { ResearchChatContext } from "../lib/chat-agent";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatAgentViewProps {
  initialContext?: ResearchChatContext | null;
  onContextChange?: (ctx: ResearchChatContext | null) => void;
  onOpenLibrary?: () => void;
}

export default function ChatAgentView({
  initialContext,
  onContextChange,
  onOpenLibrary,
}: ChatAgentViewProps) {
  const [context, setContext] = useState<ResearchChatContext | null>(initialContext ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [importSearch, setImportSearch] = useState("");
  const [importTab, setImportTab] = useState<"researches" | "topics">("researches");

  // Library items for import modal
  const [savedResearches, setSavedResearches] = useState<SavedResearch[]>([]);
  const [topics, setTopics] = useState<ResearchTopic[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sync initialContext when changed externally (e.g. from ReportViewer or Library)
  useEffect(() => {
    if (initialContext) {
      setContext(initialContext);
    }
  }, [initialContext]);

  // Load library records
  useEffect(() => {
    setSavedResearches(getSavedResearches());
    setTopics(getResearchTopics());
  }, [showImportModal]);

  // Seed initial welcome message whenever context is switched
  useEffect(() => {
    if (context && context.query) {
      setMessages([
        {
          id: "welcome-" + Date.now(),
          role: "assistant",
          content: `Hello! I am your **Research Chat Agent** (*nvidia/nemotron-3.5-bolt-e4b*), anchored to your research on:

> **${context.query}**

I have analyzed the synthesized report and cited evidence. You can ask me to:
- Clarify specific technical points, metrics, or mechanisms
- Break down nuances and compare alternatives
- Challenge conclusions or discuss real-world edge cases
- Synthesize actionable next steps based on the findings

What would you like to explore?`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } else {
      setMessages([
        {
          id: "welcome-general-" + Date.now(),
          role: "assistant",
          content: `Hello! I am your **Chat Agent** powered by NVIDIA Nemotron (*nvidia/nemotron-3.5-bolt-e4b*).

Currently in **General Assistant Mode**. You can ask any question, or click **"Attach Research"** above to ground our conversation in a specific investigation brief from your library.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [context]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  function handleSelectResearchContext(res: SavedResearch) {
    const newCtx: ResearchChatContext = {
      query: res.query,
      report: res.report,
      id: res.id,
    };
    setContext(newCtx);
    onContextChange?.(newCtx);
    setShowImportModal(false);
  }

  function handleSelectTopicContext(top: ResearchTopic) {
    const syntheticReport = top.notes
      ? `## Backlog Topic Overview\n**Topic:** ${top.topic}\n**Priority:** ${top.priority.toUpperCase()}\n**Status:** ${top.status}\n\n### Research Objectives & Notes:\n${top.notes}\n\nTags: ${top.tags.join(", ") || "None"}`
      : `## Backlog Topic\n**Topic:** ${top.topic}\n**Priority:** ${top.priority.toUpperCase()}\n**Status:** ${top.status}`;

    const newCtx: ResearchChatContext = {
      query: top.topic,
      report: syntheticReport,
      id: top.id,
    };
    setContext(newCtx);
    onContextChange?.(newCtx);
    setShowImportModal(false);
  }

  function handleClearContext() {
    setContext(null);
    onContextChange?.(null);
    setShowImportModal(false);
  }

  async function sendMessage(textToSend?: string) {
    const prompt = (textToSend ?? input).trim();
    if (!prompt || isGenerating) return;

    setInput("");

    const userMsg: ChatMessage = {
      id: "u-" + Date.now(),
      role: "user",
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const assistantMsgId = "a-" + Date.now();
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages([...updatedMessages, assistantMsg]);
    setIsGenerating(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context: context ? { query: context.query, report: context.report } : null,
        }),
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      if (!res.body) throw new Error("No response stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const payload = trimmed.slice(6);

          if (payload === "[DONE]") break;

          try {
            const data = JSON.parse(payload) as { chunk?: string; error?: string };
            if (data.error) {
              throw new Error(data.error);
            }
            if (data.chunk) {
              accumulated += data.chunk;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId ? { ...msg, content: accumulated } : msg
                )
              );
            }
          } catch {
            // Malformed chunk ignored
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: msg.content + "\n\n*[Generation stopped by user]*",
                }
              : msg
          )
        );
      } else {
        const errMsg = err instanceof Error ? err.message : "Error generating response";
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: `⚠️ **Generation Error:** ${errMsg}\n\nPlease verify your NVIDIA API key and connectivity.`,
                }
              : msg
          )
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }

  function handleStop() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function downloadTranscript() {
    if (messages.length === 0) return;
    const header = context
      ? `# Research Chat Transcript\n**Topic:** ${context.query}\n**Model:** nvidia/nemotron-3.5-bolt-e4b\n**Date:** ${new Date().toLocaleString()}\n\n---\n\n`
      : `# General Chat Transcript\n**Model:** nvidia/nemotron-3.5-bolt-e4b\n**Date:** ${new Date().toLocaleString()}\n\n---\n\n`;

    const body = messages
      .map((m) => `### ${m.role === "user" ? "User" : "Nemotron Agent"} (${m.timestamp})\n\n${m.content}\n`)
      .join("\n---\n\n");

    const blob = new Blob([header + body], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-transcript-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const promptSuggestions = context
    ? [
        "Summarize the top 3 critical takeaways",
        "Explain the core methodology and evidence",
        "What are the main limitations or caveats?",
        "Suggest 3 actionable next steps from this",
      ]
    : [
        "Explain transformer attention mechanisms simply",
        "Compare REST vs gRPC for microservices",
        "How do LLM quantization techniques work?",
        "Suggest a research plan for autonomous agents",
      ];

  const filteredResearches = savedResearches.filter((r) =>
    r.query.toLowerCase().includes(importSearch.toLowerCase()) ||
    r.tags?.some((t) => t.toLowerCase().includes(importSearch.toLowerCase()))
  );

  const filteredTopics = topics.filter((t) =>
    t.topic.toLowerCase().includes(importSearch.toLowerCase()) ||
    t.notes?.toLowerCase().includes(importSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[580px] panel bg-[#0e1014] border-[#20232c] rounded-2xl overflow-hidden">
      {/* ── Top Context Bar ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 md:px-5 border-b border-[#20232c] bg-[#12141a]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-100 font-mono tracking-wide">
                CHAT AGENT
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#2a2d38] bg-[#161820] text-zinc-400">
                nemotron-3.5-bolt-e4b
              </span>
            </div>

            {/* Context anchor pill */}
            <div className="flex items-center gap-2 mt-0.5">
              {context ? (
                <div className="flex items-center gap-1.5 text-xs text-indigo-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  <span className="font-medium text-zinc-400 text-[11px]">Anchored to:</span>
                  <span className="font-semibold text-indigo-200 truncate max-w-[280px] md:max-w-[420px]" title={context.query}>
                    {context.query}
                  </span>
                </div>
              ) : (
                <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  General Mode (No research anchored)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {context && (
            <button
              type="button"
              onClick={() => setShowReportPreview(true)}
              className="px-2.5 py-1 rounded border border-[#262832] bg-[#161820] hover:bg-[#1f222c] text-zinc-300 text-xs font-mono transition-colors flex items-center gap-1.5"
              title="Preview the full research report text"
            >
              <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Report
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="px-2.5 py-1 rounded border border-indigo-700/50 bg-indigo-950/25 hover:bg-indigo-950/45 text-indigo-300 text-xs font-mono transition-colors flex items-center gap-1.5"
            title="Import or switch grounded research context from Library"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
            {context ? "Change Context" : "Attach Research"}
          </button>

          {context && (
            <button
              type="button"
              onClick={handleClearContext}
              className="px-2 py-1 rounded border border-[#2a2d38] bg-[#161820] hover:bg-[#1f222c] text-zinc-400 hover:text-zinc-200 text-xs font-mono transition-colors"
              title="Detach research and switch to general chat mode"
            >
              Detach
            </button>
          )}

          <button
            type="button"
            onClick={downloadTranscript}
            disabled={messages.length === 0}
            className="px-2 py-1 rounded border border-[#262832] bg-[#161820] hover:bg-[#1f222c] text-zinc-400 hover:text-zinc-200 text-xs font-mono transition-colors disabled:opacity-40"
            title="Export conversation as Markdown"
          >
            Export .md
          </button>

          <button
            type="button"
            onClick={() => setMessages([])}
            disabled={messages.length === 0}
            className="px-2 py-1 rounded border border-[#262832] bg-[#161820] hover:bg-rose-950/30 hover:border-rose-800/40 hover:text-rose-300 text-zinc-500 text-xs font-mono transition-colors disabled:opacity-40"
            title="Clear chat history"
          >
            Clear
          </button>
        </div>
      </div>

      {/* ── Message Stream Area ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-[11px] font-mono text-zinc-500 font-semibold">
                {msg.role === "user" ? "You" : "Nemotron Agent"}
              </span>
              <span className="text-[10px] font-mono text-zinc-600">
                {msg.timestamp}
              </span>
            </div>

            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed transition-all ${
                msg.role === "user"
                  ? "bg-indigo-600/20 border border-indigo-500/30 text-indigo-100 rounded-tr-xs"
                  : "bg-[#14161f] border border-[#222530] text-zinc-200 rounded-tl-xs shadow-md report-content"
              }`}
            >
              {msg.role === "assistant" ? (
                msg.content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono py-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                    Thinking with Nemotron 3.5 Bolt…
                  </div>
                )
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Suggestions Bar ────────────────────────────────────────────── */}
      {messages.length <= 2 && (
        <div className="px-4 md:px-6 py-2 border-t border-[#1b1d24] bg-[#0c0e12]/60 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-mono uppercase text-zinc-500 shrink-0">
            Suggested:
          </span>
          {promptSuggestions.map((sugg) => (
            <button
              key={sugg}
              type="button"
              onClick={() => sendMessage(sugg)}
              disabled={isGenerating}
              className="text-xs font-mono text-zinc-400 hover:text-indigo-300 bg-[#141620] hover:bg-[#1d202e] border border-[#252835] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
            >
              {sugg}
            </button>
          ))}
        </div>
      )}

      {/* ── Input Box ─────────────────────────────────────────────────── */}
      <div className="p-3.5 md:p-4 border-t border-[#20232c] bg-[#111319]">
        <div className="relative rounded-xl border border-[#2a2e3a] bg-[#0a0c10] focus-within:border-indigo-500/60 transition-colors">
          <textarea
            ref={inputRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              context
                ? `Ask anything about "${context.query}"... (Enter to send, Shift+Enter for new line)`
                : "Ask general questions or attach a research report above... (Enter to send)"
            }
            className="w-full bg-transparent px-3.5 py-2.5 text-xs md:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none resize-none font-sans"
          />

          <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-[#171920]">
            <span className="text-[10px] font-mono text-zinc-500">
              {context ? "Grounded in research findings" : "General conversation mode"}
            </span>

            <div className="flex items-center gap-2">
              {isGenerating ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="px-3 py-1 rounded-lg border border-rose-800/60 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 text-xs font-mono transition-colors flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-xs bg-rose-400" />
                  Stop
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => sendMessage()}
                  disabled={!input.trim()}
                  className="px-3.5 py-1 rounded-lg border border-indigo-600 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-mono font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>Send</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL: IMPORT RESEARCH FROM LIBRARY ────────────────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-[#2b303c] bg-[#101217] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 md:px-6 border-b border-[#20222a] bg-[#14161e]">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 font-mono">
                  ATTACH RESEARCH CONTEXT
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Select a saved investigation or backlog topic to ground the Chat Agent.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-zinc-400 hover:text-white text-sm font-mono p-1"
              >
                ✕
              </button>
            </div>

            {/* Filter and Tabs */}
            <div className="p-4 border-b border-[#1f222a] bg-[#0d0f14] flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex items-center gap-1 bg-[#141720] p-0.5 rounded-lg border border-[#222530]">
                <button
                  type="button"
                  onClick={() => setImportTab("researches")}
                  className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
                    importTab === "researches"
                      ? "bg-[#202433] text-indigo-200 font-medium"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Saved Reports ({savedResearches.length})
                </button>
                <button
                  type="button"
                  onClick={() => setImportTab("topics")}
                  className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
                    importTab === "topics"
                      ? "bg-[#202433] text-indigo-200 font-medium"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Topics ({topics.length})
                </button>
              </div>

              <input
                type="text"
                value={importSearch}
                onChange={(e) => setImportSearch(e.target.value)}
                placeholder="Filter by title or tag…"
                className="w-full sm:w-60 bg-[#141720] border border-[#252835] rounded-lg px-3 py-1 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Modal Body List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {importTab === "researches" ? (
                filteredResearches.length === 0 ? (
                  <div className="text-center py-10 text-xs text-zinc-500">
                    No saved researches found matching your search.
                  </div>
                ) : (
                  filteredResearches.map((r) => (
                    <div
                      key={r.id}
                      className="p-3.5 rounded-xl border border-[#20232c] bg-[#13151c] hover:border-indigo-500/40 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {r.pinned && <span className="text-amber-400 text-xs">★</span>}
                          <h4 className="text-xs font-semibold text-zinc-200 truncate">
                            {r.query}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 mt-1">
                          <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                          <span>·</span>
                          <span>{r.wordCount} words</span>
                          <span>·</span>
                          <span>{r.citationsCount} citations</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectResearchContext(r)}
                        className="px-3 py-1.5 rounded-lg border border-indigo-700/60 bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 text-xs font-mono transition-colors shrink-0"
                      >
                        Attach
                      </button>
                    </div>
                  ))
                )
              ) : filteredTopics.length === 0 ? (
                <div className="text-center py-10 text-xs text-zinc-500">
                  No topics found matching your search.
                </div>
              ) : (
                filteredTopics.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl border border-[#20232c] bg-[#13151c] hover:border-indigo-500/40 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
                          {t.priority}
                        </span>
                        <h4 className="text-xs font-semibold text-zinc-200 truncate">
                          {t.topic}
                        </h4>
                      </div>
                      {t.notes && (
                        <p className="text-[11px] text-zinc-400 mt-1 truncate">
                          {t.notes}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectTopicContext(t)}
                      className="px-3 py-1.5 rounded-lg border border-indigo-700/60 bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 text-xs font-mono transition-colors shrink-0"
                    >
                      Attach
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-[#1f222a] bg-[#12141a] flex items-center justify-between">
              <button
                type="button"
                onClick={handleClearContext}
                className="text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Clear Context (General Chat Mode)
              </button>

              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-3 py-1 rounded-md border border-[#262832] bg-[#181a22] text-xs font-mono text-zinc-300 hover:bg-[#20232c]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: PREVIEW FULL REPORT ─────────────────────────────────── */}
      {showReportPreview && context && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl border border-[#2b303c] bg-[#101217] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 md:px-6 border-b border-[#20222a] bg-[#14161e]">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 font-mono">
                  ACTIVE RESEARCH CONTEXT
                </h3>
                <p className="text-xs text-indigo-300 mt-0.5 font-medium">
                  {context.query}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowReportPreview(false)}
                className="text-zinc-400 hover:text-white text-sm font-mono p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 report-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {context.report}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
