import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { createBooking } from '@/lib/booking'
import { isSlotFree } from '@/lib/availability'
import { CALENDAR_TZ } from '@/lib/google'
import { sameOriginOk } from '@/lib/originCheck'

export const dynamic = 'force-dynamic'

// Final step: a qualified lead picks a slot. We re-verify the lead is qualified
// and the slot is still free, create the Calendar event + Meet, and record it.
export async function POST(req: Request) {
  if (!sameOriginOk(req)) {
    return NextResponse.json({ error: 'Cross-origin request rejected' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const leadId = body.leadId != null ? String(body.leadId) : ''
  const startISO = String(body.startISO || '')
  const endISO = String(body.endISO || '')
  const label = body.label ? String(body.label).slice(0, 120) : ''
  if (!leadId || !startISO || !endISO) {
    return NextResponse.json({ error: 'leadId, startISO, endISO required' }, { status: 422 })
  }

  // Validate the datetimes are real ISO instants, correctly ordered, not in the
  // past, and a sane duration — before they reach the Google Calendar API.
  const start = new Date(startISO)
  const end = new Date(endISO)
  const durMs = end.getTime() - start.getTime()
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    durMs <= 0 ||
    durMs > 4 * 60 * 60 * 1000 || // > 4h is not a real teardown slot
    start.getTime() < Date.now() - 60_000 // not in the past (1min skew)
  ) {
    return NextResponse.json({ error: 'Invalid or out-of-range time slot' }, { status: 422 })
  }

  const payload = await getPayloadClient()

  let lead
  try {
    lead = await payload.findByID({ collection: 'leads', id: leadId, overrideAccess: true })
  } catch {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  // Gate: only qualified (or already-booked, idempotent retry) leads can book.
  if (lead.status !== 'qualified' && lead.status !== 'booked') {
    return NextResponse.json({ error: 'Lead is not qualified for booking' }, { status: 403 })
  }

  if (!(await isSlotFree(startISO, endISO))) {
    return NextResponse.json({ error: 'That slot was just taken — pick another.' }, { status: 409 })
  }

  let result
  try {
    result = await createBooking({
      startISO,
      endISO,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      domain: lead.domain,
      bottleneck: lead.bottleneck,
    })
  } catch (err) {
    console.error('[book/confirm] createBooking failed:', (err as Error).message)
    return NextResponse.json({ error: 'Could not create the calendar event' }, { status: 502 })
  }

  await payload.create({
    collection: 'bookings',
    overrideAccess: true,
    data: {
      lead: Number(leadId),
      startTime: startISO,
      endTime: endISO,
      slotLabel: label,
      timezone: CALENDAR_TZ,
      googleEventId: result.eventId,
      meetLink: result.meetLink,
      meetSpaceName: result.meetSpaceName,
      calendarId: result.calendarId,
      status: 'confirmed',
    },
  })

  await payload.update({
    collection: 'leads',
    id: leadId,
    overrideAccess: true,
    data: { status: 'booked' },
  })

  return NextResponse.json({
    ok: true,
    meetLink: result.meetLink,
    htmlLink: result.htmlLink,
    startISO,
    label,
  })
}
