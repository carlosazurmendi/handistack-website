// Dependency-free fixed-window rate limiter, safe to import from both Edge
// middleware and Node route handlers. State is an in-process Map, which is
// correct for this app's single-container deployment. For a multi-instance
// deployment, back this with a shared store (e.g. Redis) — the call sites don't
// change, only this module does.

type Bucket = { count: number; resetAt: number }

const store = new Map<string, Bucket>()
let lastSweep = 0

export type RateLimitResult = {
  ok: boolean
  limit: number
  remaining: number
  retryAfter: number // seconds until the window resets (0 when ok)
}

// Drop expired buckets occasionally so the Map can't grow without bound under a
// flood of unique keys.
function sweep(now: number) {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [key, b] of store) {
    if (b.resetAt <= now) store.delete(key)
  }
}

export function rateLimit(key: string, opts: { max: number; windowMs: number }): RateLimitResult {
  const now = Date.now()
  sweep(now)
  let b = store.get(key)
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + opts.windowMs }
    store.set(key, b)
  }
  b.count += 1
  const ok = b.count <= opts.max
  return {
    ok,
    limit: opts.max,
    remaining: Math.max(0, opts.max - b.count),
    retryAfter: ok ? 0 : Math.ceil((b.resetAt - now) / 1000),
  }
}

// Resolve the real client IP behind Cloudflare + Traefik. Prefer Cloudflare's
// `cf-connecting-ip` (which Cloudflare sets and clients can't forge through it),
// then the leftmost X-Forwarded-For hop, then X-Real-IP.
export function clientIp(headers: Headers): string {
  const cf = headers.get('cf-connecting-ip')
  if (cf) return cf.trim()
  const xff = headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const xr = headers.get('x-real-ip')
  if (xr) return xr.trim()
  return 'unknown'
}
