import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[#1e2129] bg-[#0c0d11] text-zinc-400 text-xs font-sans mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Engine Overview */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-sm tracking-wide text-zinc-100">
                RESEARCH AGENT
              </span>
              <span className="text-[10px] font-mono text-cyan-400 px-1.5 py-0.2 rounded border border-cyan-800/40 bg-cyan-950/20">
                v0.2.0
              </span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed max-w-sm">
              Autonomous multi-agent deep research and grounded conversational workstation. Plans query matrices, scrapes web sources with SSRF shielding, and synthesizes Markdown briefs with citations.
            </p>
            <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                NVIDIA Nemotron 3.5 Bolt
              </span>
              <span>·</span>
              <span>DuckDuckGo / Brave</span>
              <span>·</span>
              <span>Local Storage V1</span>
            </div>
          </div>

          {/* Navigation & Documentation */}
          <div>
            <h4 className="font-mono text-xs font-semibold text-zinc-200 uppercase tracking-wider mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-[11px] font-mono">
              <li>
                <Link href="/" className="hover:text-cyan-300 transition-colors">
                  Workstation Hub
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-cyan-300 transition-colors">
                  Engine Features
                </Link>
              </li>
              <li>
                <Link href="/manual" className="hover:text-cyan-300 transition-colors">
                  User Manual & CLI
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/JanardhanS56/Research-Agent"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-300 transition-colors inline-flex items-center gap-1"
                >
                  GitHub Repository ↗
                </a>
              </li>
            </ul>
          </div>

          {/* Compliance & Security */}
          <div>
            <h4 className="font-mono text-xs font-semibold text-zinc-200 uppercase tracking-wider mb-3">
              Trust & Legal
            </h4>
            <ul className="space-y-2 text-[11px] font-mono">
              <li>
                <Link href="/privacy" className="hover:text-cyan-300 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-cyan-300 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <span className="text-zinc-500">Zero Telemetry Trackers</span>
              </li>
              <li>
                <span className="text-zinc-500">Client-Side Persistence</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Status & Copyright */}
        <div className="pt-6 border-t border-[#1a1c24] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-zinc-500">
          <div>
            © {new Date().getFullYear()} Research Agent. Built for research & engineering exploration.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              API Protection: Active (5 req/min)
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
