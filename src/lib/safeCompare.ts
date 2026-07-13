import { createHash, timingSafeEqual } from 'crypto'

// Constant-time comparison of two secrets (tokens, signatures, shared secrets).
// A plain `===`/`!==` short-circuits on the first differing byte, leaking how
// much of the secret is correct through response timing. Hashing both sides to a
// fixed 32-byte digest first means the comparison is constant-time regardless of
// input length and never reveals the length of the expected secret.
export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}
