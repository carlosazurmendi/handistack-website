import type { CollectionConfig } from 'payload'
import { cancelCalendarEvent, cancellationEmailHtml, formatBookingTime } from '@/lib/booking'

// A captured triage submission. Created by POST /book/lead, then mutated by the
// n8n verdict callback (POST /book/callback) and finally by the booking step.
export const Leads: CollectionConfig = {
  slug: 'leads',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'domain', 'status', 'createdAt'],
    group: 'Pipeline',
  },
  access: {
    // Mutations happen server-side via the Local API with overrideAccess; lock the
    // collection down to logged-in admins for everything else.
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    // A booking's `lead` is required (NOT NULL), so its FK can't be SET NULL when
    // the lead is deleted — Postgres aborts the whole delete transaction. Before
    // the lead goes, cancel each booking's Google Calendar event, email the lead
    // a cancellation, then delete the booking rows (same req => same transaction)
    // so deleting a lead, including admin bulk-delete, cascades cleanly.
    beforeDelete: [
      async ({ req, id }) => {
        const { payload } = req

        const lead = await payload
          .findByID({ collection: 'leads', id, req, depth: 0 })
          .catch(() => null)

        const bookings = await payload.find({
          collection: 'bookings',
          where: { lead: { equals: id } },
          req,
          overrideAccess: true,
          depth: 0,
          pagination: false,
        })

        for (const booking of bookings.docs) {
          // External (Google / Gmail) failures must never block the lead delete.
          if (booking.googleEventId) {
            try {
              await cancelCalendarEvent(booking.googleEventId, booking.calendarId || undefined)
            } catch (err) {
              payload.logger.error({
                msg: 'Lead delete: calendar cancel failed',
                bookingId: booking.id,
                eventId: booking.googleEventId,
                err: (err as Error).message,
              })
            }
          }

          if (lead?.email) {
            try {
              const when = formatBookingTime(booking.startTime, booking.timezone)
              await payload.sendEmail({
                to: lead.email,
                subject: 'Your Handistack teardown has been cancelled',
                html: cancellationEmailHtml(lead.name || 'there', when),
              })
            } catch (err) {
              payload.logger.error({
                msg: 'Lead delete: cancellation email failed',
                bookingId: booking.id,
                err: (err as Error).message,
              })
            }
          }
        }

        // Remove the booking rows so the NOT NULL FK can't abort the lead delete.
        await payload.delete({
          collection: 'bookings',
          where: { lead: { equals: id } },
          req,
          overrideAccess: true,
        })
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true, index: true },
    { name: 'phone', type: 'text' },
    {
      name: 'domain',
      type: 'text',
      required: true,
      admin: { description: 'Company website domain the lead submitted.' },
    },
    { name: 'bottleneck', type: 'textarea', required: true },
    { name: 'timeline', type: 'text' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      index: true,
      options: [
        { label: 'New', value: 'new' },
        { label: 'Researching', value: 'researching' },
        { label: 'Qualified', value: 'qualified' },
        { label: 'Unqualified', value: 'unqualified' },
        { label: 'Booked', value: 'booked' },
        { label: 'Error', value: 'error' },
      ],
    },
    {
      name: 'researchSummary',
      type: 'textarea',
      admin: { description: 'Returned by the n8n qualification agent.' },
    },
    {
      name: 'score',
      type: 'number',
      admin: { description: 'Optional fit score from n8n (0–100).' },
    },
    {
      name: 'n8nRaw',
      type: 'json',
      admin: { description: 'Raw verdict payload from n8n, for audit/debug.' },
    },
    {
      name: 'source',
      type: 'text',
      defaultValue: 'marketing-site',
      admin: { readOnly: true },
    },
  ],
}
