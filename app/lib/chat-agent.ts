import type { NvidiaMessage } from "./types";

export interface ResearchChatContext {
  query: string;
  report: string;
  id?: string;
}

/**
 * Builds a tailored system prompt for the Chat Agent.
 * When a research context is provided, anchors responses strictly to that research.
 * When absent, defaults to general technical assistant mode.
 */
export function buildChatSystemPrompt(context?: ResearchChatContext | null): string {
  if (context && context.query && context.report) {
    return `You are an expert Research Chat Agent powered by NVIDIA Nemotron (nvidia/nemotron-3.5-bolt-e4b).
You are conducting a specialized, context-aware interactive consultation grounded in the following verified research investigation:

════════════════════════════════════════════════════════════════
ANCHORED RESEARCH TOPIC:
${context.query.trim()}

RESEARCH REPORT & FINDINGS:
${context.report.trim()}
════════════════════════════════════════════════════════════════

OPERATIONAL DIRECTIVES:
1. Deeply Specific & Grounded: When answering questions, follow-ups, or critiques about this topic, ground your responses primarily in the facts, citations, data points, and technical arguments in the report above.
2. Synthesize & Extrapolate: If the user asks for deeper implications, trade-offs, practical next steps, or comparisons, extrapolate logically from the established research findings while clearly distinguishing verified findings from reasoned extrapolations.
3. Conversational Flexibility: Answer general or ancillary inquiries naturally, but maintain technical rigor and seamlessly connect concepts back to the anchored research context whenever relevant.
4. Objective Technical Tone: Maintain a concise, direct, and authoritative engineering tone. Format responses with clean Markdown (subheadings, bullet points, bold key terms, code blocks where appropriate).
5. Address Discrepancies: If a user asks about something contradicting the research report, politely highlight the exact conclusion from the report.`;
  }

  return `You are an expert AI Assistant powered by NVIDIA Nemotron (nvidia/nemotron-3.5-bolt-e4b).
Provide technically rigorous, direct, clear, and well-structured answers formatted in clean Markdown.`;
}

/**
 * Prepares the complete message payload for the NVIDIA API by prepending the system prompt
 * and filtering out any malformed entries.
 */
export function prepareChatMessages(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
  context?: ResearchChatContext | null
): NvidiaMessage[] {
  const systemPrompt = buildChatSystemPrompt(context);
  const cleanUserMessages = messages
    .filter((m) => m && typeof m.content === "string" && m.content.trim().length > 0 && m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content.trim(),
    }));

  return [
    { role: "system", content: systemPrompt },
    ...cleanUserMessages,
  ];
}
