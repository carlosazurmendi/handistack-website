import { calendarClient, CALENDAR_ID, CALENDAR_TZ } from './google'

const SLOT_MIN = parseInt(process.env.BOOKING_SLOT_MINUTES || '30', 10)
const LEAD_DAYS = parseInt(process.env.BOOKING_LEAD_DAYS || '0', 10)
const HORIZON_DAYS = parseInt(process.env.BOOKING_HORIZON_DAYS || '30', 10)
const WINDOWS = (process.env.BOOKING_WINDOWS || '09:00-11:00,13:00-15:00')
  .split(',')
  .map((w) => w.trim())
  .filter(Boolean)
  .map((w) => {
    const [a, b] = w.split('-')
    const [ah, am] = a.split(':').map(Number)
    const [bh, bm] = b.split(':').map(Number)
    return { startMin: ah * 60 + am, endMin: bh * 60 + bm }
  })

export type Slot = { start: string; end: string; label: string }
export type DayAvailability = { date: string; slots: Slot[] }

// Offset (ms) of `tz` at the given UTC instant.
function tzOffset(tz: string, at: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const p = Object.fromEntries(dtf.formatToParts(at).map((x) => [x.type, x.value]))
  const asUTC = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
    Number(p.second),
  )
  return asUTC - at.getTime()
}

// Convert a wall-clock time in `tz` to the matching UTC Date.
function zonedToUtc(y: number, m: number, d: number, hh: number, mm: number, tz: string): Date {
  const guess = Date.UTC(y, m, d, hh, mm)
  const off = tzOffset(tz, new Date(guess))
  return new Date(guess - off)
}

function ymd(d: Date, tz: string): { y: number; m: number; d: number } {
  const dtf = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
  const p = Object.fromEntries(dtf.formatToParts(d).map((x) => [x.type, x.value]))
  return { y: Number(p.year), m: Number(p.month) - 1, d: Number(p.day) }
}

function labelFor(start: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: CALENDAR_TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(start)
    .toLowerCase()
}

function overlaps(s: Date, e: Date, busy: { start: number; end: number }[]): boolean {
  const a = s.getTime()
  const b = e.getTime()
  return busy.some((iv) => a < iv.end && b > iv.start)
}

/**
 * Real-time availability for the next HORIZON_DAYS: every 30-min slot inside the
 * configured EST windows (9–11am, 1–3pm), minus anything the booking calendar is
 * already busy with (this is what the public Google booking page reflects) and
 * minus past times / weekends.
 */
export async function getAvailability(): Promise<DayAvailability[]> {
  const cal = calendarClient()
  const now = new Date()
  const timeMin = new Date(now.getTime())
  const timeMax = new Date(now.getTime() + (HORIZON_DAYS + 1) * 86400000)

  let busy: { start: number; end: number }[] = []
  try {
    const fb = await cal.freebusy.query({
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        timeZone: CALENDAR_TZ,
        items: [{ id: CALENDAR_ID }],
      },
    })
    const cals = fb.data.calendars || {}
    const entry = cals[CALENDAR_ID] || Object.values(cals)[0]
    busy = (entry?.busy || []).map((b) => ({
      start: new Date(b.start as string).getTime(),
      end: new Date(b.end as string).getTime(),
    }))
  } catch (err) {
    console.error('[availability] freebusy failed:', (err as Error).message)
    // Fall through with empty busy => show all window slots (fail open for UX).
  }

  const out: DayAvailability[] = []
  const earliest = now.getTime() + LEAD_DAYS * 86400000

  for (let i = 0; i <= HORIZON_DAYS; i++) {
    const dayInstant = new Date(now.getTime() + i * 86400000)
    const { y, m, d } = ymd(dayInstant, CALENDAR_TZ)
    // Weekday check in the calendar timezone.
    const dow = new Date(zonedToUtc(y, m, d, 12, 0, CALENDAR_TZ)).getUTCDay()
    // getUTCDay on a noon-EST instant maps to the EST weekday reliably enough.
    const localDow = new Intl.DateTimeFormat('en-US', { timeZone: CALENDAR_TZ, weekday: 'short' }).format(
      zonedToUtc(y, m, d, 12, 0, CALENDAR_TZ),
    )
    if (localDow === 'Sat' || localDow === 'Sun') {
      void dow
      out.push({ date: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, slots: [] })
      continue
    }

    const slots: Slot[] = []
    for (const w of WINDOWS) {
      for (let mins = w.startMin; mins + SLOT_MIN <= w.endMin; mins += SLOT_MIN) {
        const start = zonedToUtc(y, m, d, Math.floor(mins / 60), mins % 60, CALENDAR_TZ)
        const end = new Date(start.getTime() + SLOT_MIN * 60000)
        if (start.getTime() < earliest) continue
        if (overlaps(start, end, busy)) continue
        slots.push({ start: start.toISOString(), end: end.toISOString(), label: labelFor(start) })
      }
    }
    out.push({ date: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, slots })
  }
  return out
}

// Re-check a single slot is still free right before committing the booking.
export async function isSlotFree(startISO: string, endISO: string): Promise<boolean> {
  const cal = calendarClient()
  try {
    const fb = await cal.freebusy.query({
      requestBody: {
        timeMin: startISO,
        timeMax: endISO,
        timeZone: CALENDAR_TZ,
        items: [{ id: CALENDAR_ID }],
      },
    })
    const cals = fb.data.calendars || {}
    const entry = cals[CALENDAR_ID] || Object.values(cals)[0]
    return (entry?.busy || []).length === 0
  } catch (err) {
    console.error('[availability] isSlotFree failed:', (err as Error).message)
    return true // fail open; the calendar insert is still authoritative
  }
}
