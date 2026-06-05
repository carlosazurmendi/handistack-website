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
          label: 'Blueprint',
          fields: [
            { name: 'blueprintEyebrow', type: 'text' },
            { name: 'blueprintTitle', type: 'text', admin: { description: 'Plain part of the heading.' } },
            { name: 'blueprintTitleAccent', type: 'text', admin: { description: 'Trailing words in the neon gradient.' } },
            { name: 'blueprintBody', type: 'textarea' },
            { name: 'manifestoKicker', type: 'text' },
            { name: 'manifestoTitle', type: 'text' },
            { name: 'manifestoLead', type: 'textarea' },
            { name: 'manifestoBody1', type: 'textarea' },
            { name: 'manifestoBody2', type: 'textarea', admin: { description: 'Supports inline HTML (<strong>, <span class="neon-text">).' } },
            {
              name: 'blueprintTabs',
              type: 'array',
              maxRows: 3,
              admin: { description: 'Text for the three blueprint tabs (Application / Automation / Agentic). Diagram layout stays in code.' },
              fields: [
                { name: 'short', type: 'text', admin: { description: 'Tab label.' } },
                { name: 'title', type: 'text' },
                { name: 'desc', type: 'textarea' },
              ],
            },
          ],
        },
        {
          label: 'Architecture',
          fields: [
            { name: 'archEyebrow', type: 'text' },
            { name: 'archTitle', type: 'text' },
            { name: 'archBody', type: 'textarea' },
            {
              name: 'pillars',
              type: 'array',
              maxRows: 3,
              admin: { description: 'The three architecture pillars. Icons stay in code.' },
              fields: [
                { name: 'h3', type: 'text', required: true },
                { name: 'body', type: 'textarea', required: true },
                {
                  name: 'tags',
                  type: 'array',
                  fields: [{ name: 'value', type: 'text', required: true }],
                },
              ],
            },
          ],
        },
        {
          label: 'Case Studies',
          fields: [
            { name: 'casesEyebrow', type: 'text' },
            { name: 'casesTitle', type: 'text' },
            { name: 'casesBody', type: 'textarea' },
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
            { name: 'footerCopyright', type: 'text', admin: { description: 'Bottom-bar copyright line.' } },
          ],
        },
      ],
    },
  ],
}
