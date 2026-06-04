import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

// Polled by the client while n8n researches. Returns the current verdict; once
// "unqualified", also returns the editable thank-you message.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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
