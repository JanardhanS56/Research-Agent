"use client";

import type { AgentStep } from "../page";
import type { SubQuery } from "../lib/types";

interface Props {
  steps: AgentStep[];
  subQueries: SubQuery[];
}

const KIND_ICON: Record<string, string> = {
  plan: "🧠",
  search_start: "🔍",
  search_done: "🔍",
  synthesis_chunk: "⚗️",
  synthesis_done: "⚗️",
  report_chunk: "📄",
  done: "✅",
  error: "❌",
};

const STATUS_COLOR: Record<AgentStep["status"], string> = {
  pending: "border-white/10 bg-white/5 text-slate-500",
  running: "border-blue-500/50 bg-blue-500/10 text-blue-300",
  done: "border-green-500/40 bg-green-500/8 text-green-300",
  error: "border-red-500/40 bg-red-500/8 text-red-300",
};

const STATUS_DOT: Record<AgentStep["status"], string> = {
  pending: "bg-slate-600",
  running: "bg-blue-400 pulse-dot",
  done: "bg-green-400",
  error: "bg-red-400",
};

export default function AgentTimeline({ steps, subQueries }: Props) {
  return (
    <aside className="glass rounded-2xl p-5 h-fit sticky top-6">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-5 flex items-center gap-2">
        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Agent Pipeline
      </h2>

      {subQueries.length > 0 && (
        <div className="mb-5 p-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
          <p className="text-xs font-medium text-blue-300 mb-2">Research plan</p>
          <ul className="space-y-1.5">
            {subQueries.map((sq, i) => (
              <li key={sq.id} className="flex gap-2 text-xs text-slate-400">
                <span className="text-blue-400 font-mono shrink-0">{i + 1}.</span>
                <span className="leading-relaxed">{sq.query}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="relative space-y-2">
        {steps.map((step, i) => (
          <div
            key={step.id}
            className={`relative flex gap-3 p-3 rounded-xl border transition-all duration-300 animate-slide-in ${STATUS_COLOR[step.status]}`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="relative shrink-0 mt-0.5">
              <span className="text-base">{KIND_ICON[step.kind] ?? "•"}</span>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-surface-800 ${STATUS_DOT[step.status]}`}
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium leading-snug truncate">{step.label}</p>
              {step.detail && (
                <p className="text-xs opacity-70 mt-0.5">{step.detail}</p>
              )}
              {step.status === "running" && (
                <div className="mt-1.5 h-0.5 rounded-full bg-blue-400/20 overflow-hidden">
                  <div className="h-full w-1/2 bg-blue-400/60 shimmer rounded-full" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
