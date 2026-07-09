import { withPayload } from '@payloadcms/next/withPayload'
import { fileURLToPath } from 'url'
import path from 'path'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const isDev = process.env.NODE_ENV !== 'production'
// The admin panel lives on its own subdomain and frames the marketing homepage in
// Live Preview, so the frontend must permit framing by that origin.
const ADMIN_HOST = process.env.ADMIN_HOST || 'adminportal.handistack.com'

// Content Security Policy for the public marketing pages. Scoped to the frontend
// HTML routes (not /admin, whose framework markup needs looser rules). In dev we
// relax script-src for HMR (eval) and connect-src for the websocket.
const frontendCsp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  // Allow the admin subdomain (Live Preview iframe) to frame the site; nobody else.
  `frame-ancestors 'self' https://${ADMIN_HOST}`,
  "img-src 'self' data: blob: https://*.supabase.co https://*.storage.supabase.co",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  `connect-src 'self' https://*.supabase.co${isDev ? ' ws: wss:' : ''}`,
  "form-action 'self'",
]
  .join('; ')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output so the Docker image stays small (pulled via Dockhand on the GCP VPS).
  output: 'standalone',
  // Don't advertise the framework in an X-Powered-By header (reduces the info an
  // attacker gets for free). The upstream proxy strips/normalizes the Server header.
  poweredByHeader: false,
  // Pin the workspace root (a stray lockfile in the home dir otherwise confuses Next).
  turbopack: { root: dirname },
  outputFileTracingRoot: dirname,
  reactStrictMode: true,
  images: {
    // Allow serving media from the public Supabase Storage bucket.
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.storage.supabase.co' },
    ],
  },
  async headers() {
    // The Payload admin streams React Server Component chunks. A proxy (Cloudflare)
    // that rewrites/optimizes HTML can drop a streamed chunk and blank the admin.
    // `no-transform` tells the proxy to pass these responses through untouched.
    return [
      // Baseline security headers on every response (harden framework defaults).
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          // Force HTTPS for 2 years incl. subdomains. Browsers ignore this over
          // plain HTTP, so it's safe to always send. `preload` is included — the
          // apex and admin subdomain are both HTTPS-only behind Cloudflare.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-transform' },
          // Prevent the admin panel from being framed by other sites (clickjacking).
          // frame-ancestors for the public site is set via CSP in the headers below.
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, no-transform' }],
      },
      {
        // Booking endpoints return lead-specific data — never cache in browsers or
        // intermediary proxies.
        source: '/book/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, no-transform' }],
      },
      // CSP on the public marketing HTML routes. Enumerated (not a catch-all) so
      // the Payload admin's own markup requirements are never constrained.
      ...['/', '/privacy', '/terms'].map((source) => ({
        source,
        headers: [{ key: 'Content-Security-Policy', value: frontendCsp }],
      })),
    ]
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
