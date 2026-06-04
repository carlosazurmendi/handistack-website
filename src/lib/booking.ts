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
