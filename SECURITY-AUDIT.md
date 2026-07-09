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

## 3. Rate limit login attempts — APPLIED

**Finding:** Payload 3 dropped the express-era global `rateLimit` config, so
there was no per-IP throttle on `/api/users/login` or the other auth endpoints.

**Action:** Added `src/lib/rateLimit.ts` (dependency-free fixed-window limiter,
Edge- and Node-safe, with a `cf-connecting-ip`-aware client-IP resolver) and
applied it in `src/middleware.ts` to POSTs against login, forgot-password,
reset-password, refresh-token, and first-register: 10 attempts/min per IP,
returning `429` + `Retry-After`. Complements the per-account lockout in item 4.
Single-container in-memory store; swap for Redis if scaled out.

## 4. Lock accounts after repeated failures — APPLIED

**Finding:** `users` used `auth: true` with Payload defaults; no explicit lockout.

**Action:** Set `auth.maxLoginAttempts: 5` and `auth.lockTime: 15min` on the
`users` collection. Payload tracks failures per-account (immune to IP rotation),
normalizes the email (immune to case tricks), resets on success, and does not
disclose the remaining attempt count.

## 5. Stop username and email enumeration — N/A (verified)

**Finding:** No public account signup and no "email exists" endpoint. Payload's
login returns a single generic "email or password is incorrect" regardless of
which was wrong, and forgot-password returns a generic success whether or not the
address exists. The custom `/book/lead` POST always creates a fresh lead and
never signals whether an email was seen before. No enumeration surface found.

**Action:** None — existing responses are already constant and non-revealing.
(Object-level ID enumeration on `/book/lead/[id]` is addressed under item 24.)

## 6. Secure the password reset flow — APPLIED (framework + tightened)

**Finding:** Reset is owned by Payload: cryptographically-random token, single-use
(cleared on success), expiry enforced server-side. Default window was 1 hour.

**Action:** Set `auth.forgotPassword.expiration` to 30 minutes on `users` to
shrink the leaked-link window. Payload 3 uses server-side sessions, so a
completed reset re-issues session state. Token generation/verification remain
framework-managed (not hand-rolled), which is the desired posture.
