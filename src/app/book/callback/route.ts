import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { safeEqual } from '@/lib/safeCompare'

export const dynamic = 'force-dynamic'

// The n8n qualification workflow POSTs its verdict here when research completes.
// Auth is a shared secret sent in the N8N_CALLBACK_HEADER header
// (e.g. `handistack-website-callback: <N8N_CALLBACK_SECRET>`).
//
// Expected body:
//   { leadId, status: "qualified" | "unqualified", summary?, score?, raw? }
const CALLBACK_HEADER = process.env.N8N_CALLBACK_HEADER || 'x-callback-secret'

export async function POST(req: Request) {
  const secret = req.headers.get(CALLBACK_HEADER)
  // Constant-time compare so an attacker can't recover the secret byte-by-byte
  // via response timing. Also fail closed if the server secret is unset.
  if (!process.env.N8N_CALLBACK_SECRET || !safeEqual(secret, process.env.N8N_CALLBACK_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const leadId = body.leadId != null ? String(body.leadId) : ''
  const verdict = String(body.status || '').toLowerCase()
  if (!leadId || (verdict !== 'qualified' && verdict !== 'unqualified')) {
    return NextResponse.json({ error: 'leadId and status (qualified|unqualified) required' }, { status: 422 })
  }

  const payload = await getPayloadClient()

  // Confirm the lead exists.
  try {
    await payload.findByID({ collection: 'leads', id: leadId, overrideAccess: true })
  } catch {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  await payload.update({
    collection: 'leads',
    id: leadId,
    overrideAccess: true,
    data: {
      status: verdict,
      researchSummary: body.summary ? String(body.summary) : undefined,
      score: typeof body.score === 'number' ? body.score : undefined,
      n8nRaw: (body.raw as object) ?? body,
    },
  })

  return NextResponse.json({ ok: true })
}
