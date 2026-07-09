import { NextResponse, type NextRequest } from 'next/server'
import { rateLimit, clientIp } from '@/lib/rateLimit'

// Serve the Payload admin on its own subdomain. The reverse proxy points both
// handistack.com and adminportal.handistack.com at this app; here we rewrite the
// admin host's root to /admin so the marketing site never shows there.
const ADMIN_HOST = process.env.ADMIN_HOST || 'adminportal.handistack.com'

// Auth endpoints that must be throttled per-IP to blunt password guessing and
// credential stuffing. Account-level lockout (Payload maxLoginAttempts) is the
// complementary per-account defense; this is the per-IP layer. Reset/verify
// email triggers are included so they can't be used to spam a victim's inbox.
const AUTH_RATE_LIMITED = [
  '/api/users/login',
  '/api/users/forgot-password',
  '/api/users/reset-password',
  '/api/users/refresh-token',
  '/api/users/first-register',
]

export function middleware(req: NextRequest) {
  const host = (req.headers.get('host') || '').split(':')[0].toLowerCase()
  const { pathname } = req.nextUrl

  // Per-IP throttle on authentication endpoints (POST only — reads are harmless).
  if (req.method === 'POST' && AUTH_RATE_LIMITED.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    const ip = clientIp(req.headers)
    // 10 attempts/minute per IP is generous for a human mistyping a password but
    // makes automated guessing impractical.
    const rl = rateLimit(`auth:${ip}:${pathname}`, { max: 10, windowMs: 60_000 })
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many attempts. Please wait and try again.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
      )
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
