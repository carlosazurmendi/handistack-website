import type { CollectionConfig } from 'payload'

// Proof-of-concept case studies rendered in the "Proof of concept" section,
// and scalable into a dedicated archive later.
export const CaseStudies: CollectionConfig = {
  slug: 'case-studies',
  labels: { singular: 'Case Study', plural: 'Case Studies' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'tag', 'featured', 'order'],
    group: 'Content',
  },
  access: {
    read: ({ req: { user } }) => (user ? true : { published: { equals: true } }),
  },
  defaultSort: 'order',
  fields: [
    { name: 'number', type: 'text', admin: { description: 'Display index, e.g. "01".' } },
    { name: 'tag', type: 'text', admin: { description: 'e.g. "Retail · Inventory ops".' } },
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', unique: true, index: true },
    { name: 'problem', type: 'textarea', required: true, label: 'The operational problem' },
    { name: 'architecture', type: 'textarea', required: true, label: 'The Handistack architecture' },
    { name: 'outcome', type: 'textarea', required: true, label: 'The system outcome' },
    {
      name: 'stack',
      type: 'array',
      labels: { singular: 'Tech', plural: 'Stack' },
      fields: [{ name: 'value', type: 'text', required: true }],
    },
    { name: 'metricBig', type: 'text', admin: { description: 'e.g. "Hours → minutes".' } },
    { name: 'metricSub', type: 'text', admin: { description: 'e.g. "reconciliation cycle".' } },
    { name: 'featured', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    { name: 'published', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}
