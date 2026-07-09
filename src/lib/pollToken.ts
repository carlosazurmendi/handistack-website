import { createHmac } from 'crypto'
import { safeEqual } from './safeCompare'

// Stateless capability token that authorizes polling a specific lead's status
// without an account and without a DB column. It's an HMAC of the lead id keyed by
// PAYLOAD_SECRET, so only the server can mint one and it can't be forged for an
// arbitrary id. This closes the IDOR on GET /book/lead/[id] (sequential integer
// ids were otherwise enumerable) without a schema migration.

function secret(): string {
  return process.env.PAYLOAD_SECRET || ''
}

export function signPollToken(leadId: string): string {
  return createHmac('sha256', secret()).update(`lead:${leadId}`).digest('base64url')
}

export function verifyPollToken(leadId: string, token: string | null | undefined): boolean {
  if (!token || !secret()) return false
  return safeEqual(signPollToken(leadId), token)
}
