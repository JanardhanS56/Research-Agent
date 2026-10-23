/**
 * Planner Agent
 *
 * Decomposes a user research query into 3–5 specific, searchable sub-questions.
 * Uses the NVIDIA model in JSON mode (non-streaming, with thinking).
 */
import { chatJSON } from "@/lib/nvidia";
import type { SubQuery } from "@/lib/types";

const SYSTEM_PROMPT = `You are a research planning expert.
Given a user's research goal, decompose it into 3 to 5 highly specific,
independently answerable sub-questions optimised as web search queries.

Output ONLY a JSON array (no markdown fences, no extra text):
[
  {
    "id": "q1",
    "query": "specific web search query string",
    "rationale": "why this sub-question matters for the overall goal"
  },
  ...
]`;

export async function plan(userQuery: string): Promise<SubQuery[]> {
  const result = await chatJSON<SubQuery[]>(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Research goal: "${userQuery}"` },
    ],
    []
  );

  // Ensure valid shape and assign stable ids
  return result
    .filter((item) => item && typeof item.query === "string")
    .map((item, i) => ({
      id: item.id ?? `q${i + 1}`,
      query: item.query.trim(),
      rationale: item.rationale ?? "",
    }))
    .slice(0, 5);
}
