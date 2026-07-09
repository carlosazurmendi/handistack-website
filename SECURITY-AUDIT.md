# Security audit log

Branch: `vibecoder/security`. Worked through a 100-point security hardening
checklist, one commit per item. Each entry records the finding and what changed
(or why it was not applicable to this stack).

**Stack context:** Next.js 16 (App Router) + Payload CMS 3.85 + Supabase
Postgres, deployed as a single standalone container behind Traefik/Cloudflare.
All user authentication is owned by **Payload** (the `users` collection with
`auth: true`): password hashing, sessions, JWT, login, logout, forgot/reset
password, and email verification are framework-provided. The only bespoke HTTP
surface is the public booking flow under `src/app/book/*` (lead capture →
n8n qualification callback → Google Calendar booking). There is no custom
password handling, no self-managed JWT verification, and no custom file-upload
code outside Payload's `media` collection.

---

## 1. Hash passwords with a modern algorithm — N/A (framework-handled, verified)

**Finding:** No custom password storage exists. Grepped the whole tree for
`password|hash|md5|sha1|crypto|bcrypt|argon|scrypt|pbkdf2` — the only hits are
Payload's own generated types/migrations (`reset_password_token`,
`reset_password_expiration`) and the seed script's bootstrap admin password.
Payload hashes all passwords with **salted PBKDF2** (per-user random salt,
HMAC-SHA256, 25k iterations, 512-bit derived key) and never stores plaintext or
reversible ciphertext. No MD5/SHA1/DES anywhere.

**Action:** None required — this is a vetted slow salted KDF. Payload also
re-derives/verifies server-side, so the "re-hash on next login" upgrade path is
inherent to the framework. Documented here rather than forcing an edit.

## 2. Enforce strong password requirements — APPLIED

**Finding:** Payload ships no password-complexity policy; any length was accepted.

**Action:** Added `src/lib/passwordPolicy.ts` (min 12 chars, max 256, rejects a
common/breached list, blocks single-repeat-char, requires ≥3 of 4 character
classes) and wired it into a `beforeValidate` hook on the `users` collection
(`src/collections/Users.ts`). It runs server-side for create, admin change, and
reset, returning a friendly `APIError` message. Client cannot bypass it.
