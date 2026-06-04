import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { forwardLeadToN8n } from '@/lib/n8n'

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

  if (name.length < 2 || !emailRe.test(email) || domain.length < 3 || bottleneck.length < 5) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 422 })
  }

  const payload = await getPayloadClient()

  const lead = await payload.create({
    collection: 'leads',
    overrideAccess: true,
    data: { name, email, phone, domain, bottleneck, timeline, status: 'researching', source: 'marketing-site' },
  })

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

  return NextResponse.json({ leadId: lead.id, status: 'researching' })
}
