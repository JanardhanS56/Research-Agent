import Link from "next/link";
import Footer from "../components/Footer";

export const metadata = {
  title: "Privacy Policy — Research Agent",
  description: "Privacy policy and local storage transparency for Research Agent.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0b0c0e] text-zinc-100 font-sans selection:bg-indigo-500/30">
      <header className="border-b border-[#20222a] bg-[#101216] px-4 py-2.5 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="font-mono font-semibold text-sm tracking-wide text-zinc-100">
              RESEARCH AGENT
            </span>
            <span className="text-[11px] font-mono text-zinc-500 px-1.5 py-0.5 rounded border border-[#262832] bg-[#16181e]">
              PRIVACY
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

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 space-y-8">
        <div>
          <span className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-widest px-2.5 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/40">
            Legal & Compliance
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 tracking-tight mt-3">
            Privacy Policy & Data Architecture
          </h1>
          <p className="text-xs font-mono text-zinc-500 mt-1">
            Last Updated: October 2026 · Effective Immediately
          </p>
        </div>

        <div className="space-y-6 text-sm text-zinc-300 leading-relaxed font-sans">
          <section className="p-5 rounded-xl border border-[#20232c] bg-[#111317]">
            <h2 className="text-base font-semibold text-zinc-100 mb-2">1. Core Privacy Principles</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Research Agent was developed with a privacy-by-design architecture. We do not operate third-party tracking scripts, advertising pixels, user behavioral analytics, or device fingerprinting. Your research activity remains confidential to your session.
            </p>
          </section>

          <section className="p-5 rounded-xl border border-[#20232c] bg-[#111317]">
            <h2 className="text-base font-semibold text-zinc-100 mb-2">2. Local Storage Persistence</h2>
            <p className="text-xs text-zinc-400 leading-relaxed mb-3">
              All personal library assets, including saved research briefs, personal tags, backlog topics, and user notes, are persisted strictly in your local browser using HTML5 <code className="text-zinc-200 font-mono">localStorage</code>.
            </p>
            <ul className="list-disc pl-5 text-xs text-zinc-400 space-y-1">
              <li>Library data never traverses our servers or third-party storage databases.</li>
              <li>You can export a full JSON archive of your library at any time via the Library view.</li>
              <li>Clearing your browser cache or deleting library entries permanently removes them from your disk.</li>
            </ul>
          </section>

          <section className="p-5 rounded-xl border border-[#20232c] bg-[#111317]">
            <h2 className="text-base font-semibold text-zinc-100 mb-2">3. External Service Dispatches</h2>
            <p className="text-xs text-zinc-400 leading-relaxed mb-3">
              To conduct deep research and conversational analysis, the backend server interacts with designated third-party API providers:
            </p>
            <div className="space-y-2 text-xs text-zinc-400">
              <div className="p-3 rounded-lg bg-[#0d0f14] border border-[#1b1e28]">
                <strong className="text-zinc-200 font-mono">NVIDIA NIM Cloud API:</strong> Query plans, source syntheses, and chat prompts are sent to NVIDIA endpoints running the <code className="text-zinc-300 font-mono">nemotron-3.5-bolt-e4b</code> model. API keys are maintained server-side in secure environment variables.
              </div>
              <div className="p-3 rounded-lg bg-[#0d0f14] border border-[#1b1e28]">
                <strong className="text-zinc-200 font-mono">Web Search Indices:</strong> Search sub-queries are dispatched to DuckDuckGo, Brave Search, or Serper. Search requests only transmit the generated sub-query strings and no user profile metadata.
              </div>
            </div>
          </section>

          <section className="p-5 rounded-xl border border-[#20232c] bg-[#111317]">
            <h2 className="text-base font-semibold text-zinc-100 mb-2">4. Server Logs & Rate Limiting</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Our backend endpoints employ an in-memory sliding window rate limiter that inspects client IP addresses strictly to prevent denial-of-wallet and infrastructure flooding. IP rate limits reside entirely in ephemeral RAM and are purged continuously without permanent persistence.
            </p>
          </section>

          <section className="p-5 rounded-xl border border-[#20232c] bg-[#111317]">
            <h2 className="text-base font-semibold text-zinc-100 mb-2">5. Data Deletion & User Rights</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Because research data is stored locally on your machine, you retain absolute ownership and control over your records. You may purge individual items or delete all stored data instantly from your browser settings or via the Library management panel.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
