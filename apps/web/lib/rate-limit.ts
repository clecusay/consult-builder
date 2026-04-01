/**
 * Simple in-memory rate limiter for API routes.
 *
 * Each module-scoped instance survives across warm Vercel invocations on the
 * same isolate, giving meaningful burst protection even in serverless.
 *
 * TODO: Swap MemoryRateLimitStore for @upstash/ratelimit with Upstash Redis
 * for production-grade distributed rate limiting across all Vercel instances.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent memory leaks (runs at most once per minute)
let lastCleanup = Date.now();
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

function increment(key: string, windowMs: number): RateLimitEntry {
  cleanup();
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    const newEntry = { count: 1, resetAt: now + windowMs };
    store.set(key, newEntry);
    return newEntry;
  }
  entry.count++;
  return entry;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Create a rate limiter with fixed-window semantics.
 *
 * @param limit   Max requests per window
 * @param windowMs  Window duration in milliseconds
 * @param keyPrefix  Prefix to namespace different limiters
 */
export function rateLimit(opts: {
  limit: number;
  windowMs: number;
  keyPrefix?: string;
}) {
  return function check(request: Request): RateLimitResult {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const key = `${opts.keyPrefix || 'rl'}:${ip}`;
    const entry = increment(key, opts.windowMs);
    return {
      success: entry.count <= opts.limit,
      remaining: Math.max(0, opts.limit - entry.count),
      resetAt: entry.resetAt,
    };
  };
}
