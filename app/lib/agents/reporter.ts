/**
 * Reporter Agent
 *
 * Compiles all per-query syntheses into a final Markdown research report,
 * streamed token-by-token to the client.
 */
import { chatStream } from "@/lib/nvidia";
import type { Synthesis } from "@/lib/types";

const SYSTEM_PROMPT = `You are an expert research writer.
You receive a collection of synthesis sections, each covering one sub-topic.
Compile them into a single, well-structured Markdown research report with:

1. **Title** (H1) — descriptive title for the report
2. **Executive Summary** (H2) — 3–5 sentence overview of key findings
3. **Findings** (H2) — one H3 sub-section per sub-topic, using the provided synthesis
4. **Key Takeaways** (H2) — 4–6 bullet points of the most important insights
5. **References** (H2) — numbered list of all cited URLs

Rules:
- Preserve inline citations like [1], [2].
- Write in third-person, formal academic style.
- Do not add information not present in the syntheses.
- Output only Markdown — no preamble, no code fences.`;

export async function report(
  userQuery: string,
  syntheses: Synthesis[],
  onChunk: (chunk: string) => void
): Promise<string> {
  // Build the input block for the reporter
  const allCitations = syntheses.flatMap((s) => s.citations);
  const deduped = allCitations.reduce<typeof allCitations>((acc, c) => {
    if (!acc.find((x) => x.url === c.url)) acc.push(c);
    return acc;
  }, []);

  const synthesisBlock = syntheses
    .map((s, i) => `## Sub-topic ${i + 1}: ${s.query}\n\n${s.synthesis}`)
    .join("\n\n---\n\n");

  const citationBlock = deduped
    .map((c) => `[${c.num}] ${c.title} — ${c.url}`)
    .join("\n");

  const userMessage =
    `Research Goal: "${userQuery}"\n\n` +
    `Syntheses:\n${synthesisBlock}\n\n` +
    `All Citations:\n${citationBlock}`;

  return chatStream(
    {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.4,
      max_tokens: 4096,
      enable_thinking: false,
    },
    onChunk
  );
}
