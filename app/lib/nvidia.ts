/**
 * NVIDIA NIM API client.
 * Wraps the chat/completions endpoint.
 * Supports both streaming (SSE) and non-streaming modes.
 */
import type { NvidiaMessage, NvidiaRequestOptions } from "@/lib/types";

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

function getApiKey(): string {
  const key = process.env.NVIDIA_API_KEY;
  if (!key) throw new Error("NVIDIA_API_KEY is not set in environment variables.");
  return key;
}

function getModel(): string {
  return process.env.NVIDIA_MODEL ?? "nvidia/nemotron-3.5-bolt-e4b";
}

/**
 * Non-streaming chat completion. Returns the full assistant message content.
 */
export async function chat(options: NvidiaRequestOptions): Promise<string> {
  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getModel(),
      messages: options.messages,
      temperature: options.temperature ?? 0.6,
      top_p: options.top_p ?? 0.95,
      max_tokens: options.max_tokens ?? 2048,
      stream: false,
      chat_template_kwargs: {
        enable_thinking: options.enable_thinking ?? true,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`NVIDIA API error ${response.status}: ${err}`);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
  };

  return data.choices[0]?.message?.content ?? "";
}

/**
 * Streaming chat completion.
 * Calls the callback with each text delta as it arrives.
 * Returns the full assembled text when done.
 */
export async function chatStream(
  options: NvidiaRequestOptions,
  onChunk: (chunk: string) => void
): Promise<string> {
  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      model: getModel(),
      messages: options.messages,
      temperature: options.temperature ?? 0.6,
      top_p: options.top_p ?? 0.95,
      max_tokens: options.max_tokens ?? 4096,
      stream: true,
      chat_template_kwargs: {
        enable_thinking: options.enable_thinking ?? true,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`NVIDIA API stream error ${response.status}: ${err}`);
  }

  if (!response.body) throw new Error("No response body from NVIDIA API.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    // Keep the last (potentially incomplete) line in buffer
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;
      const data = trimmed.slice(6);
      if (data === "[DONE]") break;

      try {
        const parsed = JSON.parse(data) as {
          choices: Array<{ delta: { content?: string } }>;
        };
        const chunk = parsed.choices[0]?.delta?.content ?? "";
        if (chunk) {
          full += chunk;
          onChunk(chunk);
        }
      } catch {
        // Malformed SSE line — skip
      }
    }
  }

  return full;
}

/** Convenience wrapper for JSON-mode outputs from the model */
export async function chatJSON<T>(
  messages: NvidiaMessage[],
  fallback: T
): Promise<T> {
  const raw = await chat({ messages, temperature: 0.3, enable_thinking: false });
  // Strip markdown code fences if the model wraps output
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Attempt to find JSON object or array in the output
    const match = cleaned.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (match) {
      try {
        return JSON.parse(match[1]) as T;
      } catch { /* fall through */ }
    }
    return fallback;
  }
}
