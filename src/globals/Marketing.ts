import type { GlobalConfig } from 'payload'

// All editable marketing copy for the single-page site. Structural sections
// (architecture pillars, system blueprint) stay in code for v1; everything here
// is editable from the admin portal and overrides the in-code defaults.
export const Marketing: GlobalConfig = {
  slug: 'marketing',
  label: 'Marketing Copy',
  admin: { group: 'Content' },
  access: { read: () => true },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Hero',
          fields: [
            { name: 'heroEyebrow', type: 'text' },
            { name: 'heroHeadline', type: 'text', admin: { description: 'Plain part of the headline.' } },
            {
              name: 'heroHeadlineAccent',
              type: 'text',
              admin: { description: 'Trailing words rendered in the neon gradient.' },
            },
            { name: 'heroSub', type: 'textarea' },
            { name: 'heroCtaLabel', type: 'text' },
            { name: 'heroTrust', type: 'text' },
          ],
        },
        {
          label: 'Nav / CTA',
          fields: [
            { name: 'navCtaLabel', type: 'text' },
            { name: 'ctaTitle', type: 'text' },
            { name: 'ctaBody', type: 'textarea' },
            { name: 'ctaButton', type: 'text' },
          ],
        },
        {
          label: 'Results',
          fields: [
            { name: 'resultsEyebrow', type: 'text' },
            { name: 'resultsTitle', type: 'text' },
            { name: 'resultsBody', type: 'textarea' },
            {
              name: 'metrics',
              type: 'array',
              maxRows: 6,
              fields: [
                { name: 'value', type: 'number', required: true },
                { name: 'suffix', type: 'text', admin: { description: 'e.g. " hrs", "%".' } },
                { name: 'label', type: 'text', required: true },
              ],
            },
          ],
        },
        {
          label: 'FAQ',
          fields: [
            { name: 'faqEyebrow', type: 'text' },
            { name: 'faqTitle', type: 'text' },
            { name: 'faqBody', type: 'textarea' },
            {
              name: 'faqs',
              type: 'array',
              fields: [
                { name: 'q', type: 'text', required: true },
                { name: 'a', type: 'textarea', required: true },
              ],
            },
          ],
        },
        {
          label: 'Booking',
          fields: [
            { name: 'bookingEyebrow', type: 'text' },
            { name: 'bookingTitle', type: 'text' },
            { name: 'bookingBody', type: 'textarea' },
            {
              name: 'unqualifiedMessage',
              type: 'textarea',
              defaultValue:
                "Thanks for reaching out! We'll contact you regarding your request soon.",
              admin: { description: 'Shown when the qualification agent returns "unqualified".' },
            },
          ],
        },
        {
          label: 'Footer',
          fields: [
            { name: 'footerTagline', type: 'textarea' },
            { name: 'contactEmail', type: 'email' },
          ],
        },
      ],
    },
  ],
}
