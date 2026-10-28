import { NextRequest } from "next/server";
import { chatStream } from "@/lib/nvidia";
import { prepareChatMessages, type ResearchChatContext } from "@/lib/chat-agent";

import { checkRateLimit, getClientIp, validateOrigin } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface ChatApiRequestBody {
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  context?: ResearchChatContext | null;
}

export async function POST(req: NextRequest) {
  // Validate Origin header on POST requests to reject unauthorized cross-origin execution
  if (!validateOrigin(req.headers)) {
    return new Response(JSON.stringify({ error: "Cross-origin request rejected" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Rate limiting check: 30 chat messages per minute per IP
  const clientIp = getClientIp(req.headers);
  const rateLimit = checkRateLimit(clientIp, "chat", 30, 60_000);

  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error: `Rate limit reached. Too many chat messages. Please wait ${rateLimit.resetSec} seconds.`,
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

  let body: ChatApiRequestBody;
  try {
    body = (await req.json()) as ChatApiRequestBody;
  } catch {
    return new Response(JSON.stringify({ error: "Malformed JSON payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, context } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "Missing or invalid messages array" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (messages.length > 50) {
    return new Response(
      JSON.stringify({ error: "Message history exceeds maximum limit of 50 messages" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  for (const m of messages) {
    if (typeof m.content === "string" && m.content.length > 8000) {
      return new Response(
        JSON.stringify({ error: "Individual message content exceeds maximum limit of 8000 characters" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // Sanitize context length if present to prevent memory bloat
  const sanitizedContext = context
    ? {
        query: context.query?.slice(0, 1000) ?? "",
        report: context.report?.slice(0, 50_000) ?? "",
        id: context.id,
      }
    : null;

  try {
    const finalMessages = prepareChatMessages(messages, sanitizedContext);

    // Ensure there is at least one non-system user message
    const hasUserMessage = finalMessages.some((m) => m.role === "user");
    if (!hasUserMessage) {
      return new Response(JSON.stringify({ error: "At least one user message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          await chatStream(
            {
              messages: finalMessages,
              temperature: 0.6,
              max_tokens: 3000,
              enable_thinking: true,
            },
            (chunk: string) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
            }
          );

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (streamErr) {
          console.error("[Chat Stream Error]", streamErr);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Inference stream was interrupted. Please retry." })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[Chat API Handler Error]", err);
    return new Response(JSON.stringify({ error: "Unable to process chat request." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
