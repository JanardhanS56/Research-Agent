import Link from "next/link";
import Footer from "../components/Footer";

export const metadata = {
  title: "Terms of Service — Research Agent",
  description: "Terms of service and operational guidelines for Research Agent.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0b0c0e] text-zinc-100 font-sans selection:bg-indigo-500/30">
      <header className="border-b border-[#20222a] bg-[#101216] px-4 py-2.5 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="font-mono font-semibold text-sm tracking-wide text-zinc-100">
              RESEARCH AGENT
            </span>
            <span className="text-[11px] font-mono text-zinc-500 px-1.5 py-0.5 rounded border border-[#262832] bg-[#16181e]">
              TERMS
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
            Terms & Conditions
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 tracking-tight mt-3">
            Terms of Service
          </h1>
          <p className="text-xs font-mono text-zinc-500 mt-1">
            Last Updated: October 2026 · Effective Immediately
          </p>
        </div>

        <div className="space-y-6 text-sm text-zinc-300 leading-relaxed font-sans">
          <section className="p-5 rounded-xl border border-[#20232c] bg-[#111317]">
            <h2 className="text-base font-semibold text-zinc-100 mb-2">1. Autonomous Research Disclaimers</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Research Agent functions as an autonomous information retrieval and synthesis tool. While the underlying models strive for empirical accuracy and link to citations, AI-generated reports may occasionally contain inaccuracies, misinterpretations, or model hallucinations. Users are advised to independently verify critical claims and figures against the provided primary citations.
            </p>
          </section>

          <section className="p-5 rounded-xl border border-[#20232c] bg-[#111317]">
            <h2 className="text-base font-semibold text-zinc-100 mb-2">2. User Ownership & Generated Content</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              You retain all ownership, intellectual property rights, and commercial privileges over research briefs, transcripts, and Markdown documents generated through your use of the application. Research Agent claims no copyright or proprietary interest in your research findings.
            </p>
          </section>

          <section className="p-5 rounded-xl border border-[#20232c] bg-[#111317]">
            <h2 className="text-base font-semibold text-zinc-100 mb-2">3. Acceptable Use Policy</h2>
            <p className="text-xs text-zinc-400 leading-relaxed mb-2">
              You agree not to use the application or its underlying endpoints to:
            </p>
            <ul className="list-disc pl-5 text-xs text-zinc-400 space-y-1">
              <li>Launch automated denial-of-service, flood attacks, or probe private network interfaces (SSRF).</li>
              <li>Circumvent or tamper with rate limits, origin checks, or payload size restrictions.</li>
              <li>Distribute malicious payloads or generate illegal materials.</li>
            </ul>
          </section>

          <section className="p-5 rounded-xl border border-[#20232c] bg-[#111317]">
            <h2 className="text-base font-semibold text-zinc-100 mb-2">4. Service Availability & Rate Limits</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              To safeguard server resources and external inference quotas, endpoints are subject to rate limiting. We reserve the right to temporarily throttle or block requests that exhibit abusive or automated attack patterns.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
