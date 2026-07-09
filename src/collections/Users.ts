import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { validatePasswordStrength } from '@/lib/passwordPolicy'
import { isAdmin, isAdminOrSelf, isAdminFieldLevel } from '@/access/roles'

// Admin / editor accounts for the Payload admin portal (adminportal.handistack.com).
export const Users: CollectionConfig = {
  slug: 'users',
  // Account-scoped brute-force lockout: after 5 consecutive failures Payload locks
  // the account for 15 minutes, resetting on a successful login. This is keyed on
  // the account (not the IP), so it can't be evaded by rotating IPs, and Payload
  // normalizes the email so it can't be evaded by changing case. Complements the
  // per-IP throttle in middleware. Payload never reveals the remaining count.
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    // Reset tokens are crypto-random and single-use (Payload clears them after a
    // successful reset). Shorten the validity window from the 1h default to 30min
    // to reduce the exposure of a leaked reset link.
    forgotPassword: {
      expiration: 30 * 60 * 1000,
    },
    // Payload always sets HttpOnly on the auth cookie (JS can't read it). Add the
    // Secure flag in production so it's never sent over plain HTTP; left off in dev
    // so login still works over http://localhost. (SameSite is set in item 54.)
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      // Don't send the auth cookie on cross-site requests — blocks CSRF by default.
      // 'Lax' (not 'Strict') so a normal top-level navigation to the admin still
      // carries the session; admin API calls are same-site anyway.
      sameSite: 'Lax',
    },
    // Idle timeout: the session token is valid for 2h and is extended on activity
    // via refresh, so an unused admin session expires server-side after 2h. Payload
    // enforces this expiry on every request (it does not trust a client clock). A
    // hard absolute-max lifetime isn't natively configurable in Payload; 2h idle is
    // the practical bound for this low-volume admin.
    tokenExpiration: 2 * 60 * 60,
    // Don't return the raw JWT in login/refresh response bodies. The HttpOnly
    // Secure cookie is the sole carrier, so client JS can't read the token or
    // stash it in localStorage where an XSS could exfiltrate it.
    removeTokenFromResponses: true,
  },
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
    // Both roles can reach the admin panel (this slot must return a boolean)...
    admin: ({ req: { user } }) => Boolean(user),
    // ...but account management is admin-only. An editor can read/update only
    // their own record and cannot create or delete users. This closes the prior
    // gap where unspecified ops defaulted to any-authenticated-user.
    read: isAdminOrSelf,
    create: isAdmin,
    update: isAdminOrSelf,
    delete: isAdmin,
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
      // Only admins may set or change a role. Without this, an editor (who can
      // update their own user doc via isAdminOrSelf) could escalate themselves to
      // admin. Field-level access is enforced server-side on create and update.
      access: {
        create: isAdminFieldLevel,
        update: isAdminFieldLevel,
      },
    },
  ],
}
