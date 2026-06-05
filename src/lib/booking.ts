import { calendarClient, CALENDAR_ID, CALENDAR_TZ } from './google'
import { createMeetSpace } from './meet'

export type CreateBookingInput = {
  startISO: string
  endISO: string
  name: string
  email: string
  phone?: string | null
  domain?: string | null
  bottleneck?: string | null
}

export type BookingResult = {
  eventId: string
  htmlLink?: string | null
  meetLink: string | null
  meetSpaceName: string | null
  calendarId: string
}

// Create the teardown event on the booking calendar, attach a Google Meet (with
// notes/transcript/moderation when the edition allows), invite the lead via Gmail
// (sendUpdates: 'all'), and return the event + Meet details.
export async function createBooking(input: CreateBookingInput): Promise<BookingResult> {
  const cal = calendarClient()
  const space = await createMeetSpace()

  const description = [
    'AI Qualification Teardown — booked from handistack.com',
    '',
    input.domain ? `Company: https://${input.domain}` : '',
    input.bottleneck ? `Stated bottleneck: ${input.bottleneck}` : '',
    input.phone ? `Phone: ${input.phone}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  // If the Meet API space was created, import its link as the event's conference.
  // Otherwise let Calendar create its own Meet link via createRequest.
  const conferenceData = space
    ? {
        conferenceSolution: { key: { type: 'hangoutsMeet' }, name: 'Google Meet' },
        conferenceId: space.meetingCode || space.name.replace('spaces/', ''),
        entryPoints: [{ entryPointType: 'video', uri: space.meetingUri, label: space.meetingUri }],
      }
    : {
        createRequest: {
          requestId: `handistack-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      }

  const res = await cal.events.insert({
    calendarId: CALENDAR_ID,
    conferenceDataVersion: 1,
    sendUpdates: 'all', // emails the guest the invite (Gmail)
    requestBody: {
      summary: `Handistack AI Teardown — ${input.name}`,
      description,
      start: { dateTime: input.startISO, timeZone: CALENDAR_TZ },
      end: { dateTime: input.endISO, timeZone: CALENDAR_TZ },
      attendees: [{ email: input.email, displayName: input.name }],
      guestsCanModify: false,
      reminders: { useDefault: true },
      conferenceData,
    },
  })

  const ev = res.data
  const meetLink =
    space?.meetingUri ||
    ev.hangoutLink ||
    ev.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri ||
    null

  return {
    eventId: ev.id as string,
    htmlLink: ev.htmlLink,
    meetLink,
    meetSpaceName: space?.name || null,
    calendarId: CALENDAR_ID,
  }
}

// Cancel a previously created teardown event. `sendUpdates: 'all'` makes Google
// email the guest the calendar cancellation too. A 404/410 (event already gone)
// is swallowed so callers can treat it as success and stay idempotent.
export async function cancelCalendarEvent(
  eventId: string,
  calendarId: string = CALENDAR_ID,
): Promise<void> {
  const cal = calendarClient()
  try {
    await cal.events.delete({ calendarId, eventId, sendUpdates: 'all' })
  } catch (err) {
    const code = (err as { code?: number }).code
    if (code === 404 || code === 410) return
    throw err
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Human-readable slot time in the booking's own timezone.
export function formatBookingTime(startISO: string, timezone?: string | null): string {
  const tz = timezone || CALENDAR_TZ
  try {
    const formatted = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: tz,
    }).format(new Date(startISO))
    return `${formatted} (${tz})`
  } catch {
    return startISO
  }
}

// Branded cancellation email sent when a lead (and its booking) is deleted.
export function cancellationEmailHtml(name: string, when: string): string {
  return [
    '<div style="font-family: Arial, sans-serif; line-height:1.5; color:#111">',
    `<p>Hi ${escapeHtml(name)},</p>`,
    `<p>Your Handistack AI Teardown scheduled for <strong>${escapeHtml(when)}</strong> has been cancelled.</p>`,
    `<p>If this was a mistake or you'd like to rebook, reply to this email or grab a new slot at `,
    `<a href="https://handistack.com">handistack.com</a>.</p>`,
    '<p>— Handistack</p>',
    '</div>',
  ].join('')
}
