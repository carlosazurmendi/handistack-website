import { NextResponse, type NextRequest } from 'next/server'

// Serve the Payload admin on its own subdomain. The reverse proxy points both
// handistack.com and adminportal.handistack.com at this app; here we rewrite the
// admin host's root to /admin so the marketing site never shows there.
const ADMIN_HOST = process.env.ADMIN_HOST || 'adminportal.handistack.com'

export function middleware(req: NextRequest) {
  const host = (req.headers.get('host') || '').split(':')[0].toLowerCase()
  const { pathname } = req.nextUrl

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
