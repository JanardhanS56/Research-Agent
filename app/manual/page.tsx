import Link from "next/link";
import Footer from "../components/Footer";

export const metadata = {
  title: "User Manual & Architecture Guide — Research Agent",
  description:
    "Comprehensive technical documentation, CLI guide, architecture specifications, and operational handbook for Research Agent.",
};

export default function ManualPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0b0c0e] text-zinc-100 font-sans selection:bg-indigo-500/30">
      {/* Top Header */}
      <header className="border-b border-[#20222a] bg-[#101216] px-4 py-2.5 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="font-mono font-semibold text-sm tracking-wide text-zinc-100">
              RESEARCH AGENT
            </span>
            <span className="text-[11px] font-mono text-zinc-500 px-1.5 py-0.5 rounded border border-[#262832] bg-[#16181e]">
              MANUAL v0.2.0
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/features"
              className="text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors hidden sm:inline"
            >
              Features Overview
            </Link>
            <Link
              href="/"
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              ← Back to Workstation
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 space-y-10">
        <div>
          <span className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-widest px-2.5 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/40">
            System Documentation
          </span>
          <h1 className="text-2xl md:text-4xl font-bold text-zinc-100 tracking-tight mt-3">
            User Manual & Operational Handbook
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Detailed guide covering multi-agent orchestration, CLI runner operations, grounded Chat Agent workflows, and security architecture.
          </p>
        </div>

        {/* Section 1: Quickstart */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-100 font-mono flex items-center gap-2 border-b border-[#20232c] pb-2">
            <span className="text-cyan-400">01.</span> Quickstart & Workflow
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs text-zinc-300">
            <div className="p-4 rounded-xl border border-[#20232c] bg-[#111317]">
              <div className="font-semibold text-zinc-200 mb-1 font-mono">1. Submit Query</div>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                Enter a targeted research question or hypothesis in the workspace input box. Press <kbd className="px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px]">Ctrl+Enter</kbd> to execute.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[#20232c] bg-[#111317]">
              <div className="font-semibold text-zinc-200 mb-1 font-mono">2. Observe Pipeline</div>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                The agent planner decomposes the inquiry into 3–5 sub-questions, executes parallel search queries, and streams synthesis tokens in real time.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[#20232c] bg-[#111317]">
              <div className="font-semibold text-zinc-200 mb-1 font-mono">3. Interrogate & Save</div>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                Save the generated Markdown brief to your local library, export a clean <code className="text-zinc-200">.md</code> file, or click <strong>"Chat with Report"</strong> for conversational follow-ups.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Multi-Agent Architecture */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-100 font-mono flex items-center gap-2 border-b border-[#20232c] pb-2">
            <span className="text-cyan-400">02.</span> Multi-Agent Pipeline Architecture
          </h2>
          <div className="p-5 rounded-xl border border-[#20232c] bg-[#111317] space-y-4 text-xs">
            <p className="text-zinc-300 leading-relaxed">
              Research Agent operates as a coordinated 4-stage pipeline orchestrated over Server-Sent Events (SSE):
            </p>
            <div className="space-y-3 font-mono text-[11px]">
              <div className="p-3 rounded-lg bg-[#0d0f14] border border-[#1d202a]">
                <span className="text-cyan-300 font-semibold">[Stage 1: Planner Agent]</span> Decomposes the research inquiry into a matrix of 3 to 5 independent, web-optimized sub-queries using structured JSON parsing.
              </div>
              <div className="p-3 rounded-lg bg-[#0d0f14] border border-[#1d202a]">
                <span className="text-emerald-300 font-semibold">[Stage 2: Search Engine Adapter]</span> Dispatches queries across Brave Search API, Serper.dev, or DuckDuckGo. Enforces SSRF blocklists and strips raw HTML safely.
              </div>
              <div className="p-3 rounded-lg bg-[#0d0f14] border border-[#1d202a]">
                <span className="text-purple-300 font-semibold">[Stage 3: Synthesizer Agent]</span> Ingests isolated web sources, reconciles conflicting facts, flags uncertainty, and formats inline numbered citations.
              </div>
              <div className="p-3 rounded-lg bg-[#0d0f14] border border-[#1d202a]">
                <span className="text-amber-300 font-semibold">[Stage 4: Reporter Agent]</span> Merges individual syntheses into an executive Markdown brief complete with structural headings and a verifiable references table.
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Grounded Chat Agent */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-100 font-mono flex items-center gap-2 border-b border-[#20232c] pb-2">
            <span className="text-cyan-400">03.</span> Grounded Chat Agent & Library Interrogation
          </h2>
          <div className="p-5 rounded-xl border border-[#20232c] bg-[#111317] space-y-3 text-xs text-zinc-300 leading-relaxed">
            <p>
              The <strong>Chat Agent</strong> runs as a conversational engine powered by the same model (<code className="text-indigo-300 font-mono">nvidia/nemotron-3.5-bolt-e4b</code>). It operates in two modes:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-400 text-[11px]">
              <li><strong className="text-zinc-200">Grounded Research Mode:</strong> Anchored to a specific research report from the workspace or Library. When questions are asked, the model grounds its answers in the factual evidence and citations of that report.</li>
              <li><strong className="text-zinc-200">General Assistant Mode:</strong> Operates as a fast, general-purpose technical assistant when no research is attached.</li>
              <li><strong className="text-zinc-200">Context Switching:</strong> Click <em>"Attach Research"</em> in the Chat header to browse saved investigations or backlog topics without leaving the conversation.</li>
            </ul>
          </div>
        </section>

        {/* Section 4: Terminal CLI Runner */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-100 font-mono flex items-center gap-2 border-b border-[#20232c] pb-2">
            <span className="text-cyan-400">04.</span> Terminal CLI Execution
          </h2>
          <div className="p-5 rounded-xl border border-[#20232c] bg-[#111317] space-y-3 text-xs">
            <p className="text-zinc-300">
              For headless environments or command-line workflows, execute the terminal runner directly:
            </p>
            <div className="p-3.5 rounded-lg bg-[#08090c] border border-[#1c1f28] font-mono text-[11px] text-zinc-300 space-y-2">
              <div className="text-zinc-500"># Interactive prompt mode:</div>
              <div className="text-cyan-300">npm run cli</div>
              <div className="text-zinc-500 pt-1"># Direct single-query execution:</div>
              <div className="text-cyan-300">npm run research -- "Post-quantum cryptography latency benchmarks"</div>
            </div>
            <p className="text-[11px] text-zinc-400">
              Reports generated via CLI are automatically saved to disk in <code className="text-zinc-200 font-mono">reports/report-&lt;slug&gt;-&lt;timestamp&gt;.md</code>.
            </p>
          </div>
        </section>

        {/* Section 5: Security Architecture */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-100 font-mono flex items-center gap-2 border-b border-[#20232c] pb-2">
            <span className="text-cyan-400">05.</span> Infiltrator & Security Defense Model
          </h2>
          <div className="p-5 rounded-xl border border-[#20232c] bg-[#111317] space-y-3 text-xs text-zinc-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div className="p-3 rounded-lg bg-[#0d0f14] border border-[#1d202a]">
                <div className="font-semibold text-zinc-200 mb-1 font-mono">SSRF & Metadata Defense</div>
                <p className="text-zinc-400">
                  Search URL fetcher enforces strict rejection of loopback, RFC-1918 private subnets, cloud metadata IPs (<code className="text-zinc-300">169.254.169.254</code>), and decimal IP evasion formats.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#0d0f14] border border-[#1d202a]">
                <div className="font-semibold text-zinc-200 mb-1 font-mono">In-Memory Rate Limiting</div>
                <p className="text-zinc-400">
                  Protects API quotas with sliding window rate limiting (5 req/min on research, 30 req/min on chat) returning HTTP 429.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#0d0f14] border border-[#1d202a]">
                <div className="font-semibold text-zinc-200 mb-1 font-mono">Prompt Injection Isolation</div>
                <p className="text-zinc-400">
                  Untrusted web content is wrapped in sanitized XML tags with strict system directives disallowing command execution or Markdown image tags.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#0d0f14] border border-[#1d202a]">
                <div className="font-semibold text-zinc-200 mb-1 font-mono">Markdown Image Disabling</div>
                <p className="text-zinc-400">
                  Frontend markdown parser disables arbitrary external <code className="text-zinc-300">&lt;img&gt;</code> rendering to eliminate silent data exfiltration and tracking pixels.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Keyboard Shortcuts */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-100 font-mono flex items-center gap-2 border-b border-[#20232c] pb-2">
            <span className="text-cyan-400">06.</span> Keyboard Shortcuts
          </h2>
          <div className="p-4 rounded-xl border border-[#20232c] bg-[#111317]">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1f222c] text-zinc-400">
                  <th className="pb-2">Shortcut</th>
                  <th className="pb-2">Scope</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171a22] text-zinc-300 text-[11px]">
                <tr>
                  <td className="py-2.5 text-cyan-400">Ctrl + Enter / Cmd + Enter</td>
                  <td className="py-2.5">Workspace Query Form</td>
                  <td className="py-2.5 text-zinc-400">Submit inquiry & launch pipeline</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-cyan-400">Enter</td>
                  <td className="py-2.5">Chat Agent Input</td>
                  <td className="py-2.5 text-zinc-400">Send chat message</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-cyan-400">Shift + Enter</td>
                  <td className="py-2.5">Chat Agent Input</td>
                  <td className="py-2.5 text-zinc-400">Insert new line without sending</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
