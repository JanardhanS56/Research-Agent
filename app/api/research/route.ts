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

import { checkRateLimit, getClientIp, validateOrigin } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Helper to encode an AgentEvent as an SSE data line */
function sse(event: AgentEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(req: NextRequest) {
  // Validate Origin header on POST requests to reject unauthorized cross-origin execution
  if (!validateOrigin(req.headers)) {
    return new Response(JSON.stringify({ error: "Cross-origin request rejected" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Rate limiting check: 5 research runs per minute per IP
  const clientIp = getClientIp(req.headers);
  const rateLimit = checkRateLimit(clientIp, "research", 5, 60_000);

  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error: `Rate limit reached. Too many requests from this IP. Please wait ${rateLimit.resetSec} seconds.`,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(rateLimit.resetSec),
        },
      }
    );
  }

  // Safe JSON body parsing
  let body: { query?: string };
  try {
    body = (await req.json()) as { query?: string };
  } catch {
    return new Response(JSON.stringify({ error: "Malformed JSON payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const query = body?.query?.trim();

  if (!query) {
    return new Response(JSON.stringify({ error: "Missing query field" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (query.length > 1000) {
    return new Response(
      JSON.stringify({ error: "Query exceeds maximum limit of 1000 characters" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
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
        console.error("[Research Pipeline Error]", err);
        send({
          kind: "error",
          payload: {
            message: "An error occurred during synthesis. Please verify your query or retry in a moment.",
          },
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
