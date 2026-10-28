"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "research_agent_cookie_consent_v1";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (!consent) {
        // Small delay so it animates in smoothly
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // LocalStorage access restricted in private mode
    }
  }, []);

  function handleAccept() {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      // Ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside
      aria-label="Cookie and storage notice"
      className="fixed bottom-4 inset-x-4 md:inset-x-auto md:right-4 z-40 max-w-md p-4 rounded-xl border border-[#262936] bg-[#12141c]/95 shadow-2xl backdrop-blur-md animate-fade-in text-xs font-sans"
    >
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div className="flex-1">
          <h4 className="font-semibold text-zinc-200">Local Storage & Privacy Notice</h4>
          <p className="mt-1 text-zinc-400 leading-relaxed text-[11px]">
            This application uses browser <code className="text-zinc-300 font-mono">localStorage</code> solely to persist your saved investigations and backlog topics locally. We use zero tracking or advertising cookies.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleAccept}
              className="px-3 py-1.5 rounded-lg border border-cyan-600 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-200 font-mono text-[11px] font-medium transition-colors"
            >
              Acknowledge
            </button>
            <Link
              href="/privacy"
              className="px-2.5 py-1.5 text-[11px] font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Privacy Policy →
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
