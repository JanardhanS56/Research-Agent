"use client";

import type { AgentStep } from "../page";
import type { SubQuery } from "../lib/types";

interface Props {
  steps: AgentStep[];
  subQueries: SubQuery[];
}

function StepStatusIcon({ status }: { status: AgentStep["status"] }) {
  if (status === "running") {
    return (
      <span className="w-4 h-4 flex items-center justify-center shrink-0">
        <svg className="w-3.5 h-3.5 text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </span>
    );
  }

  if (status === "done") {
    return (
      <span className="w-4 h-4 flex items-center justify-center shrink-0 text-emerald-400">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="w-4 h-4 flex items-center justify-center shrink-0 text-rose-400">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </span>
    );
  }

  return (
    <span className="w-4 h-4 flex items-center justify-center shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
    </span>
  );
}

export default function AgentTimeline({ steps, subQueries }: Props) {
  return (
    <aside className="panel h-fit sticky top-4">
      <div className="panel-header flex items-center justify-between">
        <span>Execution Trace</span>
        <span className="text-[11px] font-mono text-zinc-500 lowercase">
          {steps.filter((s) => s.status === "done").length}/{steps.length} steps
        </span>
      </div>

      <div className="p-3 space-y-3">
        {/* Sub-Queries Plan */}
        {subQueries.length > 0 && (
          <div className="p-2.5 rounded border border-[#23262f] bg-[#111317]">
            <div className="text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-wider mb-2">
              Query Matrix ({subQueries.length})
            </div>
            <div className="space-y-1.5">
              {subQueries.map((sq, idx) => (
                <div key={sq.id} className="text-xs font-mono">
                  <div className="flex items-start gap-1.5 text-zinc-300">
                    <span className="text-zinc-600 select-none">[{idx + 1}]</span>
                    <span className="leading-snug break-all">{sq.query}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Steps List */}
        <div className="space-y-1.5">
          {steps.map((step) => {
            const isRunning = step.status === "running";
            return (
              <div
                key={step.id}
                className={`p-2 rounded text-xs transition-colors flex items-start gap-2 border ${
                  isRunning
                    ? "bg-[#181a22] border-amber-500/30 text-zinc-200"
                    : step.status === "done"
                    ? "bg-[#121418] border-transparent text-zinc-400"
                    : "bg-transparent border-transparent text-zinc-600"
                }`}
              >
                <StepStatusIcon status={step.status} />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[11px] leading-tight break-words">{step.label}</p>
                  {step.detail && (
                    <p className="mt-1 text-[11px] text-zinc-500 font-mono break-all">{step.detail}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
