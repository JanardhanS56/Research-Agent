/**
 * POST /api/research
 * Body: { query: string }
 *
 * Streams AgentEvents as Server-Sent Events.
 * Each event line is: data: <JSON>\n\n
 */
import { NextRequest } from "next/server";
import { plan } from "@/lib/agents/planner";
import { synthesize } from "@/lib/agents/synthesizer";
import { report } from "@/lib/agents/reporter";
import { search } from "@/lib/search";
import type {
  AgentEvent,
  SearchBundle,
  Synthesis,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Helper to encode an AgentEvent as an SSE data line */
function sse(event: AgentEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { query?: string };
  const query = body.query?.trim();

  if (!query) {
    return new Response("Missing query", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: AgentEvent) {
        controller.enqueue(encoder.encode(sse(event)));
      }

      try {
        // ── Step 1: Plan ────────────────────────────────────────────────────
        const subQueries = await plan(query);
        send({ kind: "plan", payload: { subQueries } });

        const syntheses: Synthesis[] = [];

        // ── Step 2 & 3: Search + Synthesise per sub-query ───────────────────
        for (const sq of subQueries) {
          send({ kind: "search_start", payload: { queryId: sq.id, query: sq.query } });

          const results = await search(sq.query, 3);
          const bundle: SearchBundle = {
            queryId: sq.id,
            query: sq.query,
            results,
          };
          send({ kind: "search_done", payload: { bundle } });

          const synthesis = await synthesize(bundle, (chunk) => {
            send({ kind: "synthesis_chunk", payload: { queryId: sq.id, chunk } });
          });
          syntheses.push(synthesis);
          send({ kind: "synthesis_done", payload: { synthesis } });
        }

        // ── Step 4: Report ──────────────────────────────────────────────────
        await report(query, syntheses, (chunk) => {
          send({ kind: "report_chunk", payload: { chunk } });
        });

        const totalCitations = syntheses.flatMap((s) => s.citations).length;
        send({ kind: "done", payload: { totalCitations } });
      } catch (err) {
        send({
          kind: "error",
          payload: { message: err instanceof Error ? err.message : String(err) },
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
