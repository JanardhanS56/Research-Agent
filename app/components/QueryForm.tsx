"use client";

import { useState, useRef, FormEvent, KeyboardEvent } from "react";

interface Props {
  onSubmit: (query: string) => void;
  isLoading: boolean;
}

const BENCHMARK_TOPICS = [
  "Quantum error mitigation vs fault-tolerant thresholds in superconducting qubits",
  "CRISPR-Cas9 off-target cleavage reduction strategies",
  "Sodium-ion battery cathode degradation mechanisms at high voltages",
  "Comparative benchmarks of open-weights reasoning LLMs against proprietary models",
];

export default function QueryForm({ onSubmit, isLoading }: Props) {
  const [query, setQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!query.trim() || isLoading) return;
    onSubmit(query.trim());
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} id="research-form" className="panel p-3">
        <div className="relative">
          <textarea
            ref={textareaRef}
            id="research-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter research topic, technical inquiry, or hypothesis to investigate…"
            disabled={isLoading}
            rows={3}
            className="w-full bg-transparent px-3 py-2 text-zinc-100 placeholder-zinc-500 resize-none outline-none text-sm leading-relaxed font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 mt-1 border-t border-[#22252e]">
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
            {isLoading ? (
              <span className="flex items-center gap-2 text-amber-400">
                <span className="inline-block w-2 h-2 rounded-sm bg-amber-400 animate-pulse" />
                Pipeline active: gathering & synthesizing sources
              </span>
            ) : (
              <span>
                Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px]">Ctrl+Enter</kbd> to execute
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {query.trim() && !isLoading && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Clear
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing
                </>
              ) : (
                <>
                  <span>Run Investigation</span>
                  <span className="text-[10px] text-zinc-500">→</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Preset Topics */}
      {!isLoading && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-zinc-500 text-[11px] font-mono mr-1">Presets:</span>
          {BENCHMARK_TOPICS.map((topic, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setQuery(topic);
                textareaRef.current?.focus();
              }}
              className="px-2 py-1 rounded border border-[#23262f] bg-[#121418] hover:border-zinc-600 text-zinc-400 hover:text-zinc-200 text-[11px] transition-colors"
            >
              {topic.length > 45 ? topic.slice(0, 45) + "…" : topic}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
