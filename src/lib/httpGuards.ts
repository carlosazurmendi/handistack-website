// Small request guards for the custom route handlers (Next App Router doesn't
// apply the old bodyParser size limit to route handlers, and doesn't enforce the
// request Content-Type for us).

// Reject requests whose declared body is larger than `maxBytes`. This is a cheap
// first line against memory-exhaustion; the reverse proxy (Traefik/Cloudflare)
// enforces a hard ceiling upstream as well.
export function tooLarge(req: Request, maxBytes: number): boolean {
  const len = req.headers.get('content-length')
  if (!len) return false // unknown length → let the JSON parser/limits handle it
  const n = Number(len)
  return Number.isFinite(n) && n > maxBytes
}

// Require a JSON Content-Type on endpoints that only accept JSON. Rejecting other
// types also closes the "simple request" CSRF loophole where a form POST is sent
// as text/plain.
export function wantsJson(req: Request): boolean {
  const ct = req.headers.get('content-type') || ''
  return ct.toLowerCase().includes('application/json')
}
