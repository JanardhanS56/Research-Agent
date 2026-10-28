"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AgentStep, ResearchState } from "../page";
import AILoadingState from "@/components/ui/ai-loading";
import { saveResearch, getSavedResearches, type SavedResearch } from "../lib/library";
import { safeMarkdownComponents } from "../lib/markdown-security";

interface Props {
  report: string;
  status: ResearchState["status"];
  error?: string;
  query: string;
  steps?: AgentStep[];
  subQueries?: Array<{ id: string; query: string }>;
  onSaved?: (item: SavedResearch) => void;
  onOpenLibrary?: () => void;
  onChatWithReport?: (query: string, report: string) => void;
}

function downloadMarkdown(content: string, query: string) {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const slug = query
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40)
    .replace(/^-|-$/g, "");
  a.download = `research-${slug || "report"}-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportViewer({
  report,
  status,
  error,
  query,
  steps,
  subQueries,
  onSaved,
  onOpenLibrary,
  onChatWithReport,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Check if current query is already saved
  useEffect(() => {
    if (!query) return;
    const existing = getSavedResearches().find(
      (r) => r.query.trim().toLowerCase() === query.trim().toLowerCase()
    );
    if (existing) {
      setIsSaved(true);
      setTagsInput(existing.tags.join(", "));
      setNotesInput(existing.notes || "");
    } else {
      setIsSaved(false);
    }
  }, [query, report]);

  function handleCopy() {
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSaveToLibrary() {
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const saved = saveResearch({
      query: query || "Autonomous Research",
      report,
      tags,
      notes: notesInput.trim() || undefined,
      pinned: false,
      subQueries: subQueries?.map((sq) => sq.query) || [],
    });

    setIsSaved(true);
    setShowSaveModal(false);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
    if (onSaved) onSaved(saved);
  }

  const wordCount = report ? report.trim().split(/\s+/).filter(Boolean).length : 0;

  if (error) {
    return (
      <div className="panel p-6 border-rose-900/40 bg-rose-950/10 text-rose-300">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-rose-200">Execution Terminated</h3>
            <p className="mt-1 text-xs text-rose-300/80 font-mono break-all">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    const runningStep = steps?.find((s) => s.status === "running");
    const completedCount = steps ? steps.filter((s) => s.status === "done").length : 0;
    const totalCount = steps && steps.length > 0 ? steps.length : 1;
    const calculatedProgress = steps && steps.length > 0
      ? Math.round((completedCount / totalCount) * 100)
      : undefined;

    return (
      <div className="panel p-4 flex flex-col items-center justify-center min-h-[380px] bg-[#111318]/80 border-[#222530] backdrop-blur-sm">
        <AILoadingState
          customStatus={runningStep?.label}
          customProgress={calculatedProgress}
        />
      </div>
    );
  }

  const isStreaming = status === "researching";

  return (
    <article className="panel relative">
      {/* Top Meta Bar */}
      <div className="panel-header flex flex-wrap items-center justify-between gap-2 border-b border-[#22252e]">
        <div className="flex items-center gap-3">
          <span className="text-zinc-300 font-medium">Investigation Brief</span>
          <span className="text-zinc-600">|</span>
          <span className="text-[11px] font-mono text-zinc-500">{wordCount} words</span>
          {isStreaming && (
            <span className="flex items-center gap-1.5 text-amber-400 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-sm bg-amber-400 animate-pulse" />
              Streaming tokens…
            </span>
          )}
          {saveSuccessMsg && (
            <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-mono bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded animate-fade-in">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved to Library
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Save to Library button */}
          <button
            type="button"
            onClick={() => setShowSaveModal(true)}
            disabled={isStreaming}
            title={isSaved ? "Edit Library Metadata" : "Save this research to your personal library"}
            className={`px-2.5 py-1 rounded border text-xs font-mono transition-colors flex items-center gap-1.5 ${
              isSaved
                ? "border-emerald-600/40 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-950/40"
                : "border-cyan-600/40 bg-cyan-950/20 text-cyan-300 hover:bg-cyan-950/40"
            } ${isStreaming ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <svg className="w-3.5 h-3.5" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            {isSaved ? "In Library" : "Save to Library"}
          </button>

          {onChatWithReport && (
            <button
              type="button"
              onClick={() => onChatWithReport(query, report)}
              disabled={isStreaming}
              title="Open in Chat Agent to ask follow-up questions grounded in this report"
              className={`px-2.5 py-1 rounded border border-indigo-700/50 bg-indigo-950/25 hover:bg-indigo-950/45 text-indigo-300 text-xs font-mono transition-colors flex items-center gap-1.5 ${
                isStreaming ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Chat with Report
            </button>
          )}

          {onOpenLibrary && (
            <button
              type="button"
              onClick={onOpenLibrary}
              className="px-2.5 py-1 rounded border border-[#262832] bg-[#16181e] hover:bg-[#1f222a] text-zinc-400 hover:text-zinc-200 text-xs font-mono transition-colors"
            >
              View Library
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1 rounded border border-[#262832] bg-[#16181e] hover:bg-[#1f222a] text-zinc-300 text-xs font-mono transition-colors"
          >
            {copied ? "Copied" : "Copy Raw"}
          </button>
          <button
            type="button"
            onClick={() => downloadMarkdown(report, query)}
            className="px-2.5 py-1 rounded border border-[#262832] bg-[#16181e] hover:bg-[#1f222a] text-zinc-300 text-xs font-mono transition-colors"
          >
            Export .md
          </button>
        </div>
      </div>

      {/* Save to Library Modal / Popover */}
      {showSaveModal && (
        <div className="absolute inset-x-0 top-12 z-20 mx-4 md:mx-8 p-4 rounded-xl border border-[#2e3340] bg-[#111318] shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-[#22252e]">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <h3 className="text-xs font-semibold text-zinc-100 uppercase tracking-wider font-mono">
                {isSaved ? "Update Library Entry" : "Save Investigation to Library"}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowSaveModal(false)}
              className="text-zinc-400 hover:text-zinc-200 text-xs font-mono"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                Investigation Query
              </label>
              <p className="text-xs text-zinc-200 bg-[#0c0d11] p-2 rounded border border-[#1e2129] font-mono truncate">
                {query}
              </p>
            </div>

            <div>
              <label htmlFor="library-tags" className="block text-[11px] font-mono text-zinc-400 mb-1">
                Tags (comma separated)
              </label>
              <input
                id="library-tags"
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. AI, Architecture, Quantum, Finance"
                className="w-full text-xs font-mono bg-[#0c0d11] border border-[#262832] focus:border-cyan-500 rounded px-2.5 py-1.5 text-zinc-200 outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="library-notes" className="block text-[11px] font-mono text-zinc-400 mb-1">
                Personal Notes / Insights (optional)
              </label>
              <textarea
                id="library-notes"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Key takeaways, context, or follow-up questions..."
                rows={2}
                className="w-full text-xs font-mono bg-[#0c0d11] border border-[#262832] focus:border-cyan-500 rounded px-2.5 py-1.5 text-zinc-200 outline-none transition-colors resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e2129]">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="px-3 py-1.5 rounded border border-[#262832] bg-[#16181e] hover:bg-[#1f222a] text-zinc-400 hover:text-zinc-200 text-xs font-mono transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveToLibrary}
                className="px-3.5 py-1.5 rounded border border-cyan-600 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-200 text-xs font-mono font-medium transition-colors"
              >
                {isSaved ? "Update in Library" : "Confirm & Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Content */}
      <div className="p-6 md:p-8 report-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={safeMarkdownComponents}>
          {report}
        </ReactMarkdown>
        {isStreaming && <span className="terminal-cursor" />}
      </div>
    </article>
  );
}
