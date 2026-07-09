import type { Access, FieldAccess } from 'payload'

// Centralized role-based access helpers so permission logic lives in one place and
// is applied consistently across collections instead of ad-hoc inline checks.
// Roles come from the `users.role` select field: 'admin' | 'editor'.

type MaybeUser = { id?: string | number; role?: string } | null | undefined

const roleOf = (user: MaybeUser): string | undefined => (user ?? undefined)?.role

// Any authenticated admin/editor. Used to allow both roles into the admin panel
// and to read/write content.
export const isAuthenticated: Access = ({ req }) => Boolean(req.user)

// Admins only — account management and other privileged operations.
export const isAdmin: Access = ({ req }) => roleOf(req.user as MaybeUser) === 'admin'

// Field-level variant (e.g. lock the `role` field to admins so nobody can
// escalate their own privileges).
export const isAdminFieldLevel: FieldAccess = ({ req }) => roleOf(req.user as MaybeUser) === 'admin'

// Admins can act on any user; a non-admin is scoped to their own document (a
// Payload where-constraint), so editors can read/update only themselves.
export const isAdminOrSelf: Access = ({ req }) => {
  const user = req.user as MaybeUser
  if (!user) return false
  if (user.role === 'admin') return true
  return { id: { equals: user.id } }
}
