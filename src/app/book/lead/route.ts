import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { forwardLeadToN8n } from '@/lib/n8n'
import { verifyTurnstile } from '@/lib/turnstile'
import { clientIp } from '@/lib/rateLimit'
import { signPollToken } from '@/lib/pollToken'

export const dynamic = 'force-dynamic'

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Step 1 of the booking flow: capture triage info, persist the lead, and kick off
// the n8n qualification research. Returns the leadId the client polls.
export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const name = String(body.name || '').trim()
  const email = String(body.email || '').trim()
  const phone = body.phone ? String(body.phone).trim() : undefined
  const domain = String(body.domain || '').trim().replace(/^https?:\/\//, '')
  const bottleneck = String(body.bottleneck || '').trim()
  const timeline = body.timeline ? String(body.timeline).trim() : undefined
  const consent = body.consent === true

  // Bound every field length BEFORE running any regex or further validation, so
  // oversized input can't be used for resource-exhaustion / regex abuse. (The
  // email regex is linear-time, but this is defense-in-depth.)
  if (
    name.length > 200 ||
    email.length > 320 ||
    (phone !== undefined && phone.length > 50) ||
    domain.length > 255 ||
    bottleneck.length > 5000 ||
    (timeline !== undefined && timeline.length > 100)
  ) {
    return NextResponse.json({ error: 'One or more fields are too long' }, { status: 422 })
  }

  // Honeypot: this field is hidden from real users, so any value means a bot.
  // Respond with a generic 400 rather than revealing why.
  if (String(body.company_website || '').trim() !== '') {
    return NextResponse.json({ error: 'Invalid submission' }, { status: 400 })
  }

  if (name.length < 2 || !emailRe.test(email) || domain.length < 3 || bottleneck.length < 5) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 422 })
  }
  if (!consent) {
    return NextResponse.json({ error: 'Consent to be contacted is required' }, { status: 422 })
  }

  // Optional Cloudflare Turnstile challenge (only enforced when configured).
  if (!(await verifyTurnstile(String(body.turnstileToken || ''), clientIp(req.headers)))) {
    return NextResponse.json({ error: 'Bot verification failed' }, { status: 403 })
  }

  let payload
  let lead
  try {
    payload = await getPayloadClient()
    lead = await payload.create({
      collection: 'leads',
      overrideAccess: true,
      data: { name, email, phone, domain, bottleneck, timeline, status: 'researching', source: 'marketing-site', consent: true, consentAt: new Date().toISOString() },
    })
  } catch (err) {
    // Almost always a database connectivity problem (e.g. wrong DATABASE_URI, or the
    // Supabase IPv6-only direct host being unreachable from the server).
    console.error('[book/lead] DB write failed:', (err as Error).message)
    return NextResponse.json({ error: 'Could not save your request. Please try again shortly.' }, { status: 500 })
  }

  const forwarded = await forwardLeadToN8n({
    leadId: String(lead.id),
    name,
    email,
    phone,
    domain,
    bottleneck,
    timeline,
  })

  if (!forwarded) {
    await payload.update({
      collection: 'leads',
      id: lead.id,
      overrideAccess: true,
      data: { status: 'error' },
    })
    return NextResponse.json(
      { leadId: lead.id, status: 'error', error: 'Could not reach qualification service' },
      { status: 502 },
    )
  }

  // Issue a capability token the client must present to poll this lead's status,
  // so lead ids (sequential integers) can't be enumerated by outsiders.
  return NextResponse.json({
    leadId: lead.id,
    status: 'researching',
    pollToken: signPollToken(String(lead.id)),
  })
}
