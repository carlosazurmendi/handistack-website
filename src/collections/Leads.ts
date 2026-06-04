import type { CollectionConfig } from 'payload'

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
