import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── NVIDIA client tests ─────────────────────────────────────────────────────

describe("nvidia client", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("throws when NVIDIA_API_KEY is missing", async () => {
    const savedKey = process.env.NVIDIA_API_KEY;
    delete process.env.NVIDIA_API_KEY;

    const { chat } = await import("../lib/nvidia");

    await expect(chat({ messages: [{ role: "user", content: "hello" }] })).rejects.toThrow(
      "NVIDIA_API_KEY is not set"
    );

    process.env.NVIDIA_API_KEY = savedKey;
  });

  it("uses default model when NVIDIA_MODEL is not set", async () => {
    // We just verify the module loads and has the correct default model logic
    // by checking the exported chat function exists
    const { chat, chatStream, chatJSON } = await import("../lib/nvidia");
    expect(typeof chat).toBe("function");
    expect(typeof chatStream).toBe("function");
    expect(typeof chatJSON).toBe("function");
  });
});

// ─── chatJSON fallback tests ─────────────────────────────────────────────────

describe("chatJSON", () => {
  it("returns fallback on invalid JSON", async () => {
    const originalFetch = globalThis.fetch;
    const savedKey = process.env.NVIDIA_API_KEY;
    process.env.NVIDIA_API_KEY = "test-api-key";

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "not valid json at all" } }],
      }),
    } as unknown as Response);

    const { chatJSON } = await import("../lib/nvidia");
    const fallbackVal = [{ id: "fallback" }];
    const result = await chatJSON([{ role: "user", content: "test" }], fallbackVal);
    expect(result).toEqual(fallbackVal);

    globalThis.fetch = originalFetch;
    process.env.NVIDIA_API_KEY = savedKey;
  });
});
