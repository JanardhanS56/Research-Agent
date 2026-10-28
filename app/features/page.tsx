import Link from "next/link";
import Footer from "../components/Footer";

export const metadata = {
  title: "Platform Features & Capabilities — Research Agent",
  description:
    "Explore the technical architecture, security perimeter, and autonomous intelligence features of Research Agent.",
};

const FEATURES = [
  {
    tag: "Orchestration",
    title: "Multi-Agent Query Decomposition",
    desc: "Autonomous research topics are parsed into discrete sub-queries via deterministic heuristic and LLM planning, maximizing search breadth across heterogeneous sources.",
    icon: (
      <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    details: [
      "Parallel sub-query dispatch",
      "Dynamic search depth tuning (1-5)",
      "Automated deduplication and ranking",
    ],
  },
  {
    tag: "Adversarial Defense",
    title: "SSRF & Network Boundary Shield",
    desc: "Web queries and scraping engines are sandboxed with rigorous private IP filtering, DNS resolution pinning, and cloud metadata blocking (RFC 1918 / 169.254.169.254).",
    icon: (
      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    details: [
      "Strict protocol enforcement (HTTPS only)",
      "Zero egress to loopback/private subnets",
      "In-memory rate limit token buckets",
    ],
  },
  {
    tag: "Synthesis Engine",
    title: "Citation-Backed Evidence Matrix",
    desc: "Generates comprehensive executive briefs, bulleted evidence points, and verified source citations with real-time SSE streaming for zero time-to-first-token delay.",
    icon: (
      <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    details: [
      "Numbered source hyperlinking",
      "Dual streaming (Status + Markdown text)",
      "Markdown sanitization against DOM XSS",
    ],
  },
  {
    tag: "Contextual AI",
    title: "Grounded Chat Agent (Nemotron)",
    desc: "Powered by nvidia/nemotron-3.5-bolt-e4b with dedicated reasoning tokens, answering technical follow-up questions strictly anchored to research outputs or saved vault artifacts.",
    icon: (
      <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    details: [
      "Context injection isolation tags",
      "Import previous findings from Library",
      "Direct chat session reset & history",
    ],
  },
  {
    tag: "Data Sovereignty",
    title: "Zero-Telemetry Local Vault",
    desc: "All queries, research syntheses, chat records, and custom configurations remain strictly within your local browser storage. No user accounts, tracking cookies, or remote databases.",
    icon: (
      <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    details: [
      "localStorage schema versioning (v1)",
      "Single-click export & vault clearing",
      "Zero telemetry tracking or ad beacons",
    ],
  },
  {
    tag: "Security Architecture",
    title: "OWASP Hardened Perimeter",
    desc: "Built with defensive defaults: CSP, Strict Transport Security, Anti-Clickjacking headers, Cross-Origin Isolation, and strict same-origin request validation.",
    icon: (
      <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    details: [
      "Strict Content-Security-Policy",
      "Sec-Fetch-Site and Origin verification",
      "Masked technical error boundaries",
    ],
  },
];

const SPECS = [
  { spec: "Inference Engine", value: "NVIDIA Nemotron 3.5 Bolt (nvidia/nemotron-3.5-bolt-e4b)" },
  { spec: "Context Window & Deliberation", value: "Enabled (<thought> reasoning block isolation)" },
  { spec: "API Gateway Protocol", value: "Server-Sent Events (SSE) streaming with Keep-Alive" },
  { spec: "Web Search Layer", value: "SearXNG / Public Search Fallback with SSRF Defense" },
  { spec: "Local Persistence", value: "Client-side localStorage with JSON schema validation" },
  { spec: "Origin Security", value: "CSRF Origin Match, Sec-Fetch-Site validation & CSP Nonce ready" },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0b0c0e] text-zinc-100 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-[#20222a] bg-[#101216] px-4 py-2.5 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="font-mono font-semibold text-sm tracking-wide text-zinc-100">
              RESEARCH AGENT
            </span>
            <span className="text-[11px] font-mono text-zinc-500 px-1.5 py-0.5 rounded border border-[#262832] bg-[#16181e]">
              FEATURES
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/manual"
              className="text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors hidden sm:inline"
            >
              User Manual
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

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 space-y-12">
        {/* Hero Section */}
        <div className="space-y-3">
          <span className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-widest px-2.5 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/40">
            Platform Capabilities
          </span>
          <h1 className="text-2xl md:text-4xl font-bold text-zinc-100 tracking-tight">
            Architected for Autonomous Intelligence & Adversarial Rigor
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Research Agent unites multi-agent decomposition, live web reconnaissance, grounded LLM synthesis, and an infiltrator-tested defense perimeter into a cohesive sovereign workstation.
          </p>
        </div>

        {/* Feature Grid */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-100 font-mono flex items-center gap-2 border-b border-[#20232c] pb-2">
            <span className="text-cyan-400">01.</span> Core Architectural Pillars
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feat) => (
              <div
                key={feat.title}
                className="p-4 rounded-lg border border-[#20222a] bg-[#12141a] hover:border-[#2f3240] transition-colors flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 bg-[#191b22] px-2 py-0.5 rounded border border-[#272935]">
                      {feat.tag}
                    </span>
                    <div className="p-1.5 rounded bg-[#171922] border border-[#232634]">
                      {feat.icon}
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm text-zinc-100">{feat.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{feat.desc}</p>
                </div>
                <div className="border-t border-[#1c1f28] pt-2.5 space-y-1">
                  {feat.details.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
                      <span className="text-cyan-500">›</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Technical Specification Matrix */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-100 font-mono flex items-center gap-2 border-b border-[#20232c] pb-2">
            <span className="text-cyan-400">02.</span> Technical Specification Matrix
          </h2>
          <div className="border border-[#20222a] rounded-lg overflow-x-auto bg-[#12141a]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#171922] border-b border-[#20222a] text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Subsystem Dimension</th>
                  <th className="py-2.5 px-4 font-semibold">Implementation Parameter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2029] text-zinc-300">
                {SPECS.map((row) => (
                  <tr key={row.spec} className="hover:bg-[#151720] transition-colors">
                    <td className="py-2.5 px-4 font-medium text-zinc-200">{row.spec}</td>
                    <td className="py-2.5 px-4 text-cyan-400/90">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick Launch CTA */}
        <section className="p-5 md:p-6 rounded-lg border border-cyan-900/40 bg-gradient-to-r from-cyan-950/20 via-[#10131b] to-indigo-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-semibold text-sm text-zinc-100">Ready to initiate an autonomous investigation?</h3>
            <p className="text-xs text-zinc-400">Access the primary workstation or explore the operational handbook.</p>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <Link
              href="/manual"
              className="px-3 py-1.5 rounded border border-[#2b2e3a] bg-[#161820] text-xs font-mono text-zinc-300 hover:text-zinc-100 hover:border-zinc-500 transition-colors"
            >
              Read Manual
            </Link>
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-semibold text-xs font-mono transition-colors shadow-sm"
            >
              Launch Workstation →
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
