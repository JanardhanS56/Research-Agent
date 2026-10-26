"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AgentStep, ResearchState } from "../page";
import AILoadingState from "@/components/ui/ai-loading";

interface Props {
  report: string;
  status: ResearchState["status"];
  error?: string;
  query: string;
  steps?: AgentStep[];
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

export default function ReportViewer({ report, status, error, query, steps }: Props) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    <article className="panel">
      {/* Top Meta Bar */}
      <div className="panel-header flex flex-wrap items-center justify-between gap-2 border-b border-[#22252e]">
        <div className="flex items-center gap-3">
          <span className="text-zinc-300">Investigation Brief</span>
          <span className="text-zinc-600">|</span>
          <span className="text-[11px] font-mono text-zinc-500">{wordCount} words</span>
          {isStreaming && (
            <span className="flex items-center gap-1.5 text-amber-400 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-sm bg-amber-400 animate-pulse" />
              Streaming tokens…
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
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

      {/* Document Content */}
      <div className="p-6 md:p-8 report-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {report}
        </ReactMarkdown>
        {isStreaming && <span className="terminal-cursor" />}
      </div>
    </article>
  );
}
