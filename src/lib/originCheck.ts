// Origin verification for state-changing public endpoints. The booking POSTs are
// unauthenticated (no session to ride), but checking Origin still stops another
// website from scripting them from a victim's browser. We allow: a missing Origin
// (native clients / server-to-server / same-origin navigations that omit it) and
// an Origin that matches our own app or admin host. A cross-site browser Origin is
// rejected.

function allowedOrigins(): string[] {
  const list = [
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_SERVER_URL,
    process.env.ADMIN_HOST ? `https://${process.env.ADMIN_HOST}` : undefined,
  ].filter(Boolean) as string[]
  // Always allow localhost in development.
  if (process.env.NODE_ENV !== 'production') {
    list.push('http://localhost:3000', 'http://127.0.0.1:3000')
  }
  return list
}

export function sameOriginOk(req: Request): boolean {
  const origin = req.headers.get('origin')
  // No Origin header → not a cross-site browser request; allow (can't be forged
  // into a cross-site attack, and blocking would break non-browser clients).
  if (!origin) return true
  const allowed = allowedOrigins()
  try {
    const o = new URL(origin).origin
    return allowed.some((a) => {
      try {
        return new URL(a).origin === o
      } catch {
        return false
      }
    })
  } catch {
    return false
  }
}
