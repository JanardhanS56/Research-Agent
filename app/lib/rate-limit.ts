/**
 * In-memory sliding window rate limiter.
 * Protects expensive inference endpoints against abuse and denial of wallet.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const records = new Map<string, RateLimitRecord>();

// Clean up stale IP records every 5 minutes to prevent memory leaks
const PRUNE_INTERVAL = 5 * 60 * 1000;
let lastPrune = Date.now();

function pruneExpired(windowMs: number) {
  const now = Date.now();
  if (now - lastPrune < PRUNE_INTERVAL) return;
  lastPrune = now;

  const cutoff = now - windowMs;
  for (const [key, record] of records.entries()) {
    record.timestamps = record.timestamps.filter((ts) => ts > cutoff);
    if (record.timestamps.length === 0) {
      records.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSec: number;
}

/**
 * Checks and records an incoming request against a rate-limit window.
 *
 * @param ip Client IP address
 * @param bucket Category/route identifier (e.g. "research", "chat")
 * @param maxRequests Maximum allowable requests within windowMs
 * @param windowMs Time window in milliseconds (default: 60,000 = 1 minute)
 */
export function checkRateLimit(
  ip: string,
  bucket: string,
  maxRequests: number,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();
  pruneExpired(windowMs);

  const key = `${bucket}:${ip || "127.0.0.1"}`;
  let record = records.get(key);

  if (!record) {
    record = { timestamps: [] };
    records.set(key, record);
  }

  // Filter out timestamps outside the active window
  const windowStart = now - windowMs;
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= maxRequests) {
    const oldestTimestamp = record.timestamps[0];
    const resetMs = Math.max(0, oldestTimestamp + windowMs - now);
    return {
      allowed: false,
      remaining: 0,
      resetSec: Math.ceil(resetMs / 1000),
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: maxRequests - record.timestamps.length,
    resetSec: Math.ceil(windowMs / 1000),
  };
}

/**
 * Extracts a client IP address from Next.js request headers.
 */
export function getClientIp(headers: Headers): string {
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }
  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) {
    return xRealIp.trim();
  }
  return "127.0.0.1";
}

/**
 * Validates the Origin header against the Host header to protect against
 * cross-origin abuse on streaming POST routes.
 */
export function validateOrigin(headers: Headers): boolean {
  const origin = headers.get("origin");
  if (!origin) return true;
  try {
    const originUrl = new URL(origin);
    const host = headers.get("host") || "";
    // If host header is present, origin host must match
    if (host && originUrl.host.toLowerCase() !== host.toLowerCase()) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Clears all rate limits (primarily for unit testing) */
export function resetRateLimits() {
  records.clear();
}
