"use client";

import { useEffect, useId, useRef, useState } from "react";

const RESEARCH_TASK_SEQUENCES = [
  {
    status: "Decomposing research query",
    lines: [
      "Parsing semantic intent and key parameters...",
      "Formulating multi-angle search query vectors...",
      "Identifying high-value entity references...",
      "Generating sub-question matrix...",
      "Dispatching parallel retrieval workers...",
    ],
  },
  {
    status: "Scanning live web sources",
    lines: [
      "Connecting to live search engines (DuckDuckGo / Brave)...",
      "Retrieving candidate web URLs and titles...",
      "Fetching and parsing live HTML DOM trees...",
      "Extracting clean text paragraphs and structured tables...",
      "Filtering low-relevance results and noisy metadata...",
      "Evaluating source authority and fresh data points...",
    ],
  },
  {
    status: "Synthesizing cited research brief",
    lines: [
      "Running chain-of-thought evidence reasoning...",
      "Cross-referencing claims across retrieved sources...",
      "Aligning factual citations with source URLs...",
      "Drafting executive summary and detailed findings...",
      "Structuring tables, takeaways, and footnotes...",
      "Compiling verified Markdown research document...",
    ],
  },
];

interface LoadingAnimationProps {
  progress: number;
}

const LoadingAnimation = ({ progress }: LoadingAnimationProps) => {
  const maskId = useId();
  const clampedProgress = Math.max(10, Math.min(100, progress));

  return (
    <div className="relative h-6 w-6 shrink-0">
      <svg
        aria-label={`Loading progress: ${Math.round(progress)}%`}
        className="h-full w-full"
        fill="none"
        viewBox="0 0 240 240"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Loading Progress Indicator</title>
        <defs>
          <mask id={maskId}>
            <rect fill="black" height="240" width="240" />
            <circle
              cx="120"
              cy="120"
              fill="white"
              r="120"
              strokeDasharray={`${(clampedProgress / 100) * 754}, 754`}
              transform="rotate(-90 120 120)"
            />
          </mask>
        </defs>

        <style>
          {`
            @keyframes rotate-cw {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes rotate-ccw {
              from { transform: rotate(360deg); }
              to { transform: rotate(0deg); }
            }
            .g-spin circle {
              transform-origin: 120px 120px;
            }
            .g-spin circle:nth-child(1) { animation: rotate-cw 8s linear infinite; }
            .g-spin circle:nth-child(2) { animation: rotate-ccw 8s linear infinite; }
            .g-spin circle:nth-child(3) { animation: rotate-cw 8s linear infinite; }
            .g-spin circle:nth-child(4) { animation: rotate-ccw 8s linear infinite; }
            .g-spin circle:nth-child(5) { animation: rotate-cw 8s linear infinite; }
            .g-spin circle:nth-child(6) { animation: rotate-ccw 8s linear infinite; }
            .g-spin circle:nth-child(2n) { animation-delay: 0.2s; }
            .g-spin circle:nth-child(3n) { animation-delay: 0.3s; }
          `}
        </style>

        <g
          className="g-spin"
          mask={`url(#${maskId})`}
          strokeDasharray="18% 40%"
          strokeWidth="16"
        >
          <circle cx="120" cy="120" opacity="0.95" r="150" stroke="#FF2E7E" />
          <circle cx="120" cy="120" opacity="0.95" r="130" stroke="#00E5FF" />
          <circle cx="120" cy="120" opacity="0.95" r="110" stroke="#4ADE80" />
          <circle cx="120" cy="120" opacity="0.95" r="90" stroke="#FFA726" />
          <circle cx="120" cy="120" opacity="0.95" r="70" stroke="#FFEB3B" />
          <circle cx="120" cy="120" opacity="0.95" r="50" stroke="#FF4081" />
        </g>
      </svg>
    </div>
  );
};

export interface AILoadingStateProps {
  customStatus?: string;
  customLines?: string[];
  customProgress?: number;
}

export default function AILoadingState({
  customStatus,
  customLines,
  customProgress,
}: AILoadingStateProps = {}) {
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [visibleLines, setVisibleLines] = useState<
    Array<{ text: string; number: number }>
  >([]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const codeContainerRef = useRef<HTMLDivElement>(null);
  const lineHeight = 28;

  const currentSequence = customLines && customLines.length > 0
    ? {
        status: customStatus || "Researching",
        lines: customLines,
      }
    : RESEARCH_TASK_SEQUENCES[sequenceIndex];

  const totalLines = currentSequence.lines.length;

  useEffect(() => {
    const initialLines = [];
    for (let i = 0; i < Math.min(5, totalLines); i++) {
      initialLines.push({
        text: currentSequence.lines[i],
        number: i + 1,
      });
    }
    setVisibleLines(initialLines);
    setScrollPosition(0);
  }, [sequenceIndex, currentSequence.lines, totalLines]);

  // Handle line advancement with smooth cadence
  useEffect(() => {
    const advanceTimer = setInterval(() => {
      const firstVisibleLineIndex = Math.floor(scrollPosition / lineHeight);
      const nextLineIndex = (firstVisibleLineIndex + 3) % totalLines;

      if (nextLineIndex < firstVisibleLineIndex && nextLineIndex !== 0) {
        if (!customLines) {
          setSequenceIndex((prevIndex) => (prevIndex + 1) % RESEARCH_TASK_SEQUENCES.length);
        }
        return;
      }

      if (nextLineIndex >= visibleLines.length && nextLineIndex < totalLines) {
        setVisibleLines((prevLines) => [
          ...prevLines,
          {
            text: currentSequence.lines[nextLineIndex],
            number: nextLineIndex + 1,
          },
        ]);
      }

      setScrollPosition((prevPosition) => prevPosition + lineHeight);
    }, 1800);

    return () => clearInterval(advanceTimer);
  }, [
    scrollPosition,
    visibleLines,
    totalLines,
    sequenceIndex,
    currentSequence.lines,
    lineHeight,
    customLines,
  ]);

  useEffect(() => {
    if (codeContainerRef.current) {
      codeContainerRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition]);

  const activeProgress = customProgress !== undefined
    ? customProgress
    : ((sequenceIndex + 1) / RESEARCH_TASK_SEQUENCES.length) * 100;

  const activeStatus = customStatus || currentSequence.status;

  return (
    <div className="flex min-h-[320px] w-full items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-xl border border-[#232732] bg-[#12141a]/90 p-5 shadow-2xl backdrop-blur-md transition-all">
        {/* Header with spinner and animated status */}
        <div className="flex items-center justify-between border-b border-[#20232c] pb-3.5 mb-3.5">
          <div className="flex items-center space-x-3">
            <LoadingAnimation progress={activeProgress} />
            <div>
              <div className="text-sm font-semibold tracking-wide text-zinc-100 flex items-center gap-2">
                <span>{activeStatus}</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              </div>
              <p className="text-[11px] font-mono text-zinc-400">
                Autonomous Retrieval & Chain-of-Thought
              </p>
            </div>
          </div>
          <div className="font-mono text-xs text-zinc-400 px-2 py-0.5 rounded border border-[#262934] bg-[#171a22]">
            {Math.round(activeProgress)}%
          </div>
        </div>

        {/* Console Execution Stream */}
        <div className="relative">
          <div
            className="relative h-[112px] w-full overflow-hidden rounded-lg font-mono text-xs bg-[#0b0c10]/80 border border-[#1b1e26]"
            ref={codeContainerRef}
            style={{ scrollBehavior: "smooth" }}
          >
            <div className="py-1">
              {visibleLines.map((line) => (
                <div
                  className="flex h-[28px] items-center px-3 hover:bg-white/[0.02] transition-colors"
                  key={`${line.number}-${line.text}`}
                >
                  <div className="w-6 select-none pr-3 text-right text-zinc-500 font-mono text-[11px]">
                    {line.number}
                  </div>
                  <div className="flex-1 truncate text-zinc-300 font-mono text-[11.5px]">
                    <span className="text-cyan-400/80 mr-1.5">›</span>
                    {line.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top/Bottom Gradient Fade for Smooth Scroll Effect */}
          <div
            className="pointer-events-none absolute inset-0 rounded-lg"
            style={{
              background:
                "linear-gradient(to bottom, rgba(11, 12, 16, 0.85) 0%, transparent 22%, transparent 78%, rgba(11, 12, 16, 0.85) 100%)",
            }}
          />
        </div>

        {/* Footer Subtext */}
        <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-zinc-400 px-1">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Active LLM stream
          </span>
          <span>Nemotron-3.5-Bolt · DuckDuckGo</span>
        </div>
      </div>
    </div>
  );
}
