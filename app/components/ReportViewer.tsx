"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ResearchState } from "../page";

interface Props {
  report: string;
  status: ResearchState["status"];
  error?: string;
  query: string;
}

function downloadMarkdown(content: string, query: string) {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `research-${query.slice(0, 40).replace(/[^a-z0-9]/gi, "-").toLowerCase()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportViewer({ report, status, error, query }: Props) {
  if (error) {
    return (
      <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center gap-4 min-h-[300px]">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-2xl">
          ❌
        </div>
        <div className="text-center">
          <p className="font-semibold text-red-400 mb-1">Research Failed</p>
          <p className="text-sm text-slate-500 max-w-md">{error}</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center gap-5 min-h-[300px]">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">🔭</div>
        </div>
        <div className="text-center">
          <p className="font-medium text-slate-300 mb-1">Agent is researching…</p>
          <p className="text-sm text-slate-500 max-w-xs">Searching, reading, and synthesising sources. This takes 30–60 seconds.</p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-blue-400"
              style={{ animation: `pulseDot 1.5s ease-in-out ${i * 0.3}s infinite` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-base">📄</span>
          <span className="text-sm font-medium text-slate-300">Research Report</span>
          {status === "researching" && (
            <span className="flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 pulse-dot inline-block" />
              Streaming…
            </span>
          )}
          {status === "done" && (
            <span className="ml-2 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-xs text-green-400">
              Complete
            </span>
          )}
        </div>
        {status === "done" && report && (
          <button
            onClick={() => downloadMarkdown(report, query)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
              bg-surface-700 hover:bg-surface-600 border border-white/5 hover:border-white/10
              text-slate-300 hover:text-white transition-all duration-150"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download .md
          </button>
        )}
      </div>

      {/* Report Content */}
      <div className="flex-1 p-6 overflow-auto max-h-[80vh]">
        <div className="report-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
        </div>
        {status === "researching" && (
          <span className="inline-block w-0.5 h-5 bg-blue-400 ml-0.5 animate-pulse align-middle" />
        )}
      </div>
    </div>
  );
}
