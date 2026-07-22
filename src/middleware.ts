import { NextResponse, type NextRequest } from 'next/server'
import { rateLimit, clientIp } from '@/lib/rateLimit'

// Serve the Payload admin on its own subdomain. The reverse proxy points both
// trades.handistack.com and adminportal.handistack.com at this app; here we rewrite the
// admin host's root to /admin so the marketing site never shows there.
const ADMIN_HOST = process.env.ADMIN_HOST || 'adminportal.handistack.com'

// Auth endpoints that must be throttled per-IP to blunt password guessing and
// credential stuffing. Account-level lockout (Payload maxLoginAttempts) is the
// complementary per-account defense; this is the per-IP layer. Reset/verify
// email triggers are included so they can't be used to spam a victim's inbox.
const AUTH_RATE_LIMITED = [
  '/api/users/login',
  '/api/users/reset-password',
  '/api/users/refresh-token',
  '/api/users/first-register',
]

// Endpoints that send an outbound email/SMS. Throttled harder — both to stop an
// attacker spamming a victim's inbox and to cap provider cost. Keyed per-IP;
// Payload doesn't expose the recipient here for per-address keying.
const EMAIL_TRIGGER = ['/api/users/forgot-password', '/api/users/verify']

export function middleware(req: NextRequest) {
  const host = (req.headers.get('host') || '').split(':')[0].toLowerCase()
  const { pathname } = req.nextUrl

  // Per-IP throttle on authentication + email-triggering endpoints (POST only).
  if (req.method === 'POST') {
    const isEmail = EMAIL_TRIGGER.some((p) => pathname === p || pathname.startsWith(p + '/'))
    const isAuth = AUTH_RATE_LIMITED.some((p) => pathname === p || pathname.startsWith(p + '/'))
    if (isEmail || isAuth) {
      const ip = clientIp(req.headers)
      // Email triggers: 3 per 5 min (stop inbox spam / cost). Auth: 10/min
      // (generous for a human mistyping, impractical for automated guessing).
      const opts = isEmail ? { max: 3, windowMs: 5 * 60_000 } : { max: 10, windowMs: 60_000 }
      const rl = rateLimit(`rl:${ip}:${pathname}`, opts)
      if (!rl.ok) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait and try again.' },
          { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
        )
      }
    }
  }

  if (host === ADMIN_HOST) {
    // Already targeting admin/api/payload internals — leave alone.
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
      return NextResponse.next()
    }
    const url = req.nextUrl.clone()
    url.pathname = `/admin${pathname === '/' ? '' : pathname}`
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  // Skip static assets and the custom booking API.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|handistack-mark.png|handistack-logo-full.png|book).*)'],
}
