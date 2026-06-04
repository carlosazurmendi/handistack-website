import { NextResponse } from 'next/server'
import { getAvailability } from '@/lib/availability'
import { CALENDAR_TZ } from '@/lib/google'

export const dynamic = 'force-dynamic'

// Live slot availability for the calendar UI (qualified leads only need this, but
// it leaks nothing sensitive). Reflects the booking calendar's busy times.
export async function GET() {
  try {
    const days = await getAvailability()
    return NextResponse.json({ timezone: CALENDAR_TZ, days })
  } catch (err) {
    console.error('[book/availability]', (err as Error).message)
    return NextResponse.json({ error: 'Availability unavailable' }, { status: 502 })
  }
}
