// Forward a captured lead to the n8n qualification workflow. n8n researches the
// company asynchronously, then POSTs its verdict back to /book/callback.

const WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || ''
const WEBHOOK_TOKEN = process.env.N8N_WEBHOOK_TOKEN || ''
const CALLBACK_SECRET = process.env.N8N_CALLBACK_SECRET || ''
// n8n "Header Auth" uses a header NAME you define in the credential. It must match
// exactly, so make it configurable instead of guessing. Value = the token.
const WEBHOOK_HEADER = process.env.N8N_WEBHOOK_HEADER || 'x-n8n-token'

export type LeadForN8n = {
  leadId: string
  name: string
  email: string
  phone?: string | null
  domain: string
  bottleneck: string
  timeline?: string | null
}

export async function forwardLeadToN8n(lead: LeadForN8n): Promise<boolean> {
  if (!WEBHOOK_URL) {
    console.error('[n8n] N8N_WEBHOOK_URL not set; cannot forward lead')
    return false
  }
  // Runtime base URL (APP_URL) so n8n's callback target is correct even when the
  // image was built without the public env baked in.
  const base = process.env.APP_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const payload = {
    ...lead,
    // Where n8n must POST the verdict, and the secret it must echo back.
    callbackUrl: `${base}/book/callback`,
    callbackSecret: CALLBACK_SECRET,
  }
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Token n8n's webhook node verifies on inbound (header name is configurable
        // to match your n8n Header Auth credential).
        [WEBHOOK_HEADER]: WEBHOOK_TOKEN,
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      console.error('[n8n] webhook returned', res.status, await res.text().catch(() => ''))
      return false
    }
    return true
  } catch (err) {
    console.error('[n8n] forward failed:', (err as Error).message)
    return false
  }
}
