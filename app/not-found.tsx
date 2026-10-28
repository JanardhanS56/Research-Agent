import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0b0c0e] text-zinc-100 font-sans selection:bg-indigo-500/30">
      {/* Top Header Bar */}
      <header className="border-b border-[#20222a] bg-[#101216] px-4 py-2.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <span className="font-mono font-semibold text-sm tracking-wide text-zinc-100">
              RESEARCH AGENT
            </span>
            <span className="text-[11px] font-mono text-zinc-500 px-1.5 py-0.5 rounded border border-[#262832] bg-[#16181e]">
              404
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            ← Return to Workspace
          </Link>
        </div>
      </header>

      {/* 404 Hero Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12 flex flex-col items-center justify-center text-center">
        <div className="p-3 rounded-2xl bg-zinc-900/60 border border-[#222530] mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        <span className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-950/40 border border-amber-800/40 mb-3">
          Error 404: Route Not Indexed
        </span>

        <h1 className="text-2xl md:text-3xl font-semibold text-zinc-100 tracking-tight max-w-md">
          Destination unreachable in research cluster
        </h1>

        <p className="mt-3 text-xs md:text-sm text-zinc-400 max-w-lg leading-relaxed font-sans">
          The requested path could not be resolved by the agent router. The endpoint may have been relocated, unmounted, or entered with an invalid query parameter.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 font-mono text-xs">
          <Link
            href="/"
            className="px-4 py-2 rounded-lg border border-cyan-600 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-200 transition-colors flex items-center gap-2 font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Workspace Dashboard
          </Link>

          <Link
            href="/manual"
            className="px-4 py-2 rounded-lg border border-[#282c38] bg-[#141620] hover:bg-[#1d202c] text-zinc-300 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            User Manual
          </Link>
        </div>

        <div className="mt-12 p-3.5 rounded-xl border border-[#1f222c] bg-[#0f1116] max-w-md w-full text-left font-mono text-[11px] text-zinc-500">
          <div className="text-zinc-400 font-semibold mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            Diagnostics:
          </div>
          <div>STATUS: HTTP_404_NOT_FOUND</div>
          <div>ROUTER: Next.js App Router (Client Fallback)</div>
        </div>
      </main>
    </div>
  );
}
