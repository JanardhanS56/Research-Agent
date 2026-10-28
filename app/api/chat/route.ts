import { NextRequest } from "next/server";
import { chatStream } from "@/lib/nvidia";
import { prepareChatMessages, type ResearchChatContext } from "@/lib/chat-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface ChatApiRequestBody {
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  context?: ResearchChatContext | null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatApiRequestBody;
    const { messages, context } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Missing or invalid messages array" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const finalMessages = prepareChatMessages(messages, context);

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
          const errMsg = streamErr instanceof Error ? streamErr.message : "Error streaming response";
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`));
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
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
