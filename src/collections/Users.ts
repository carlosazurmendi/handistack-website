import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { validatePasswordStrength } from '@/lib/passwordPolicy'

// Admin / editor accounts for the Payload admin portal (adminportal.handistack.com).
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  hooks: {
    // Enforce the password strength policy server-side whenever a password is set
    // (create, admin change, or reset). Runs before validation so a weak password
    // is rejected with a friendly message and never stored.
    beforeValidate: [
      ({ data }) => {
        const pw = (data as { password?: unknown } | undefined)?.password
        if (typeof pw === 'string' && pw.length > 0) {
          const result = validatePasswordStrength(pw)
          if (result !== true) throw new APIError(result, 400)
        }
        return data
      },
    ],
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'role'],
    group: 'Admin',
  },
  access: {
    // Only authenticated admins reach the admin panel; tighten per-role later.
    admin: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    { name: 'name', type: 'text' },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'editor',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      required: true,
    },
  ],
}
