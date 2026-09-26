import type { MiddlewareHandler } from 'hono';

type Bucket = { count: number; resetAt: number };

// This is a best-effort per-isolate guard. Configure Cloudflare WAF/Rate Limiting
// as the authoritative global control for production traffic.
const buckets = new Map<string, Bucket>();

function clientKey(c: Parameters<MiddlewareHandler>[0]): string {
  return c.req.header('CF-Connecting-IP') || 'unknown-client';
}

export function rateLimit(limit: number, windowMs: number): MiddlewareHandler {
  return async (c, next) => {
    const now = Date.now();
    const key = clientKey(c);
    const current = buckets.get(key);

    if (!current || now >= current.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      current.count += 1;
      if (current.count > limit) {
        c.header('Retry-After', String(Math.max(1, Math.ceil((current.resetAt - now) / 1000))));
        return c.json({ error: 'Too many requests. Please try again later.' }, 429);
      }
    }

    // Bound memory if a Worker isolate receives many distinct client addresses.
    if (buckets.size > 10000) {
      for (const [bucketKey, bucket] of buckets) {
        if (bucket.resetAt <= now || buckets.size > 9000) buckets.delete(bucketKey);
        if (buckets.size <= 9000) break;
      }
    }

    await next();
  };
}
