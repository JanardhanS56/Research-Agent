"use client";

import { useState, useRef, FormEvent, KeyboardEvent } from "react";

interface Props {
  onSubmit: (query: string) => void;
  isLoading: boolean;
}

const SUGGESTIONS = [
  "What are the latest breakthroughs in quantum computing?",
  "How does CRISPR gene editing work and what are its ethical implications?",
  "Explain the current state of fusion energy research",
  "What is the impact of microplastics on human health?",
];

export default function QueryForm({ onSubmit, isLoading }: Props) {
  const [query, setQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onSubmit(query.trim());
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!query.trim() || isLoading) return;
      onSubmit(query.trim());
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} id="research-form">
        <div className="glass glow-blue rounded-2xl p-1 gradient-border">
          <div className="flex flex-col gap-0 rounded-xl overflow-hidden bg-surface-800">
            <textarea
              ref={textareaRef}
              id="research-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything that needs deep research…"
              disabled={isLoading}
              rows={3}
              className="w-full bg-transparent px-5 pt-5 pb-3 text-slate-200 placeholder-slate-500 resize-none outline-none text-base leading-relaxed"
            />
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
              <span className="text-xs text-slate-500">
                {isLoading ? (
                  <span className="flex items-center gap-2 text-blue-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 pulse-dot inline-block" />
                    Agent is researching…
                  </span>
                ) : (
                  "Shift+Enter for new line · Enter to research"
                )}
              </span>
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200
                  bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500
                  text-white disabled:opacity-40 disabled:cursor-not-allowed
                  shadow-lg shadow-blue-900/30 hover:shadow-blue-800/40"
              >
                {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Researching
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Research
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Suggestions */}
      {!isLoading && (
        <div className="mt-4 flex flex-wrap gap-2 justify-center animate-fade-in">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setQuery(s); textareaRef.current?.focus(); }}
              className="px-3 py-1.5 rounded-full text-xs text-slate-400 bg-surface-700 border border-white/5
                hover:border-blue-500/30 hover:text-blue-300 transition-all duration-150"
            >
              {s.length > 55 ? s.slice(0, 55) + "…" : s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
