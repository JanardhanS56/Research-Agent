/**
 * Synthesizer Agent
 *
 * For each sub-query's search bundle, synthesises the retrieved web content
 * into a concise, cited paragraph using the NVIDIA model (streaming).
 */
import { chatStream } from "@/lib/nvidia";
import type { SearchBundle, Synthesis, Citation } from "@/lib/types";

const SYSTEM_PROMPT = `You are a rigorous research analyst.
You receive a sub-question and a set of web search results (title, URL, snippet, content).
Your task:
1. Synthesise the information into 2–4 clear paragraphs answering the sub-question.
2. Cite sources inline using [1], [2], etc., matching the order of the sources provided.
3. Flag any conflicting or uncertain claims with "(uncertain)".
4. Be factual, concise, and do not invent information.`;

export async function synthesize(
  bundle: SearchBundle,
  onChunk: (chunk: string) => void
): Promise<Synthesis> {
  const sourcesBlock = bundle.results
    .map(
      (r, i) =>
        `[${i + 1}] Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.snippet}\nContent: ${r.content || "(no content retrieved)"}`
    )
    .join("\n\n---\n\n");

  const userMessage = `Sub-question: ${bundle.query}\n\nSources:\n${sourcesBlock}`;

  const full = await chatStream(
    {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.5,
      max_tokens: 2048,
      enable_thinking: true,
    },
    onChunk
  );

  const citations: Citation[] = bundle.results.map((r, i) => ({
    num: i + 1,
    title: r.title,
    url: r.url,
  }));

  return {
    queryId: bundle.queryId,
    query: bundle.query,
    synthesis: full,
    citations,
  };
}
