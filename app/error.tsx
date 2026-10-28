"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log exception safely to client telemetry/console without exposing on page
    console.error("[Runtime Error Boundary Caught Exception]:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0c0e] text-zinc-100 font-sans selection:bg-rose-500/30">
      <header className="border-b border-[#20222a] bg-[#101216] px-4 py-2.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-mono font-semibold text-sm tracking-wide text-zinc-100">
              RESEARCH AGENT
            </span>
            <span className="text-[11px] font-mono text-rose-400 px-1.5 py-0.5 rounded border border-rose-900/40 bg-rose-950/30">
              FATAL ERROR
            </span>
          </div>

          <Link
            href="/"
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            ← Return to Workspace
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-6 md:p-12 flex flex-col items-center justify-center text-center">
        <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-900/40 mb-6">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        <span className="text-xs font-mono font-semibold text-rose-400 uppercase tracking-widest px-2.5 py-1 rounded-full bg-rose-950/40 border border-rose-800/40 mb-3">
          Runtime Exception Intercepted
        </span>

        <h1 className="text-2xl md:text-3xl font-semibold text-zinc-100 tracking-tight">
          Application Render Interrupted
        </h1>

        <p className="mt-3 text-xs md:text-sm text-zinc-400 max-w-lg leading-relaxed">
          An unhandled error occurred in the component lifecycle. The fault has been isolated to prevent corruption of your active research session.
        </p>

        {error.digest && (
          <div className="mt-4 px-3 py-1 rounded border border-[#252834] bg-[#12141c] text-[11px] font-mono text-zinc-500">
            Error Digest ID: <span className="text-zinc-400">{error.digest}</span>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 font-mono text-xs">
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 rounded-lg border border-cyan-600 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-200 transition-colors flex items-center gap-2 font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Re-render Component
          </button>

          <Link
            href="/"
            className="px-4 py-2 rounded-lg border border-[#282c38] bg-[#141620] hover:bg-[#1d202c] text-zinc-300 transition-colors"
          >
            Reload Home Workspace
          </Link>
        </div>
      </main>
    </div>
  );
}
