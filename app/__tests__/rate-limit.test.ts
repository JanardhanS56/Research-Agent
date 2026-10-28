import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimits, getClientIp } from "../lib/rate-limit";

describe("Rate Limiting Service", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("permits requests within allowable threshold", () => {
    const res1 = checkRateLimit("192.0.2.1", "test", 3, 60_000);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = checkRateLimit("192.0.2.1", "test", 3, 60_000);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = checkRateLimit("192.0.2.1", "test", 3, 60_000);
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it("blocks requests once maximum limit is reached", () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit("192.0.2.2", "test", 3, 60_000);
    }

    const blocked = checkRateLimit("192.0.2.2", "test", 3, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetSec).toBeGreaterThan(0);
  });

  it("tracks rate limits separately across different IP addresses", () => {
    checkRateLimit("192.0.2.10", "test", 1, 60_000);
    const blockedA = checkRateLimit("192.0.2.10", "test", 1, 60_000);
    expect(blockedA.allowed).toBe(false);

    const allowedB = checkRateLimit("192.0.2.20", "test", 1, 60_000);
    expect(allowedB.allowed).toBe(true);
  });

  it("extracts client IP from headers accurately", () => {
    const headers1 = new Headers({ "x-forwarded-for": "203.0.113.195, 70.41.3.18" });
    expect(getClientIp(headers1)).toBe("203.0.113.195");

    const headers2 = new Headers({ "x-real-ip": "198.51.100.42" });
    expect(getClientIp(headers2)).toBe("198.51.100.42");

    const headers3 = new Headers();
    expect(getClientIp(headers3)).toBe("127.0.0.1");
  });
});
