import { describe, it, expect } from "vitest";
import { validateOrigin } from "../lib/rate-limit";

describe("Origin & CSRF Header Validation", () => {
  it("permits requests with matching host and origin", () => {
    const headers = new Headers({
      host: "localhost:3000",
      origin: "http://localhost:3000",
    });
    expect(validateOrigin(headers)).toBe(true);
  });

  it("permits requests when origin header is omitted (same-origin/server-to-server)", () => {
    const headers = new Headers({
      host: "research.internal",
    });
    expect(validateOrigin(headers)).toBe(true);
  });

  it("rejects cross-origin requests from foreign hostnames", () => {
    const headers = new Headers({
      host: "research.example.com",
      origin: "https://unauthorized-domain.com",
    });
    expect(validateOrigin(headers)).toBe(false);
  });

  it("rejects malformed origin headers", () => {
    const headers = new Headers({
      host: "localhost:3000",
      origin: "not-a-valid-url",
    });
    expect(validateOrigin(headers)).toBe(false);
  });
});
