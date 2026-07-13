import type { CollectionConfig } from 'payload'

// A confirmed teardown slot. Created by POST /book/confirm once a qualified lead
// picks a time; holds the Google Calendar event + Meet link.
export const Bookings: CollectionConfig = {
  slug: 'bookings',
  admin: {
    useAsTitle: 'startTime',
    defaultColumns: ['lead', 'startTime', 'status', 'meetLink'],
    group: 'Pipeline',
    pagination: { defaultLimit: 25, limits: [10, 25, 50, 100] },
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    { name: 'lead', type: 'relationship', relationTo: 'leads', required: true },
    { name: 'startTime', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'endTime', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'slotLabel', type: 'text' },
    { name: 'timezone', type: 'text', defaultValue: 'America/New_York' },
    { name: 'googleEventId', type: 'text', index: true },
    { name: 'meetLink', type: 'text' },
    { name: 'meetSpaceName', type: 'text', admin: { description: 'Google Meet API space resource name.' } },
    { name: 'calendarId', type: 'text' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'reserved',
      options: [
        { label: 'Reserved', value: 'reserved' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
  ],
}
