/**
 * In-memory sliding-window rate limiter.
 *
 * Suitable for single-process deployments (dev / single-instance prod).
 * For multi-instance production, replace the Map with a Redis ZADD/ZCARD
 * sliding window using the same `limit` / `windowMs` parameters.
 */

interface Window {
  hits: number[];
}

const store = new Map<string, Window>();

// Purge stale keys every 5 minutes to avoid memory growth.
setInterval(() => {
  const now = Date.now();
  for (const [key, win] of store) {
    if (win.hits.length === 0 || now - win.hits[win.hits.length - 1] > 60_000) {
      store.delete(key);
    }
  }
}, 5 * 60_000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  let win = store.get(key);
  if (!win) {
    win = { hits: [] };
    store.set(key, win);
  }

  // Drop hits outside the current window.
  win.hits = win.hits.filter((t) => t > cutoff);

  const allowed = win.hits.length < limit;
  if (allowed) win.hits.push(now);

  const oldest = win.hits[0] ?? now;
  return {
    allowed,
    remaining: Math.max(0, limit - win.hits.length),
    resetAt: oldest + windowMs,
  };
}

/** Extract the best available client IP from a Next.js request. */
export function getClientIp(req: Request): string {
  const headers = req instanceof Request ? req.headers : (req as { headers: Headers }).headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
