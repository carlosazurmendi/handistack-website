import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { verifyPollToken } from '@/lib/pollToken'
import { rateLimit, clientIp } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

// Polled by the client while n8n researches. Returns the current verdict; once
// "unqualified", also returns the editable thank-you message. Requires the
// capability token issued at lead creation so lead ids can't be enumerated by
// outsiders; an invalid/missing token returns 404 (indistinguishable from a
// non-existent lead) to avoid leaking which ids exist.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Polled every ~3s by the client; cap generously per IP to blunt abuse.
  const rl = rateLimit(`book:poll:${clientIp(req.headers)}`, { max: 120, windowMs: 60_000 })
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }
  const token = new URL(req.url).searchParams.get('token')
  if (!verifyPollToken(id, token)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const payload = await getPayloadClient()

  let lead
  try {
    lead = await payload.findByID({ collection: 'leads', id, overrideAccess: true })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let unqualifiedMessage: string | undefined
  if (lead.status === 'unqualified') {
    const marketing = await payload.findGlobal({ slug: 'marketing', overrideAccess: true }).catch(() => null)
    unqualifiedMessage =
      (marketing?.unqualifiedMessage as string) ||
      "Thanks for reaching out! We'll contact you regarding your request soon."
  }

  return NextResponse.json({ status: lead.status, unqualifiedMessage })
}
