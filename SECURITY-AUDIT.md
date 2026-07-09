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

## 7. Regenerate sessions to block fixation — N/A (verified)

**Finding:** Sessions are owned by Payload 3 with `useSessions` enabled. A brand-
new session record + JWT are minted server-side at successful login; Payload never
reads a session identifier supplied by the client, so a pre-planted session cannot
be ridden into an authenticated one. No anonymous pre-login session is reused.

**Action:** None — framework already regenerates session state at login.

## 8. Add multi-factor authentication support — SKIPPED (needs supervised rollout)

**Finding:** No MFA today. Adding TOTP to Payload's admin login means a custom
auth strategy that intercepts the login operation, plus secret storage, QR
provisioning, and hashed recovery codes.

**Action:** Intentionally NOT applied in this unattended pass. A partial MFA that
stores a secret but doesn't enforce it at login adds no security, and the enforce-
at-login piece is exactly the part that, if wrong, locks the admin out of their
own panel. Per the "never ship a fix that can't be applied safely" rule this is
left for a supervised change. Recommended path: a per-user `totpSecret` (hashed)
+ hashed recovery codes + a custom Payload auth strategy that verifies the code
after password, rolled out opt-in with a tested fallback. Rate-limit the verify
step (reuse `src/lib/rateLimit.ts`).

## 9. Compare credentials in constant time — APPLIED

**Finding:** `/book/callback` authenticated the n8n verdict with
`secret !== process.env.N8N_CALLBACK_SECRET` — a short-circuiting compare that
leaks the secret through timing. (Payload's own password/token comparisons are
already constant-time.)

**Action:** Added `src/lib/safeCompare.ts` (`safeEqual` — SHA-256 both sides then
`crypto.timingSafeEqual`, so timing is independent of value and length) and used
it in the callback route. Also fails closed when the server secret is unset.
This is the only hand-rolled secret comparison in the codebase.

## 10. Harden the remember-me feature — N/A (verified)

**Finding:** No "remember me" / persistent-login feature exists. Admin auth uses
Payload's session cookie with a fixed expiration; there is no long-lived
persistent token to harden. No public app login at all beyond the Payload admin.

**Action:** None — the vulnerable feature isn't present. (Cookie flags and session
lifetime are handled in items 13/14.)

## 11. Add bot protection to forms — APPLIED

**Finding:** The public booking form (`/book/lead`) had no bot/abuse protection;
it could be scripted directly. No login/contact form is public besides Payload
admin.

**Action:** Two layers, both bypass-resistant because they run server-side:
(1) a honeypot field `company_website` hidden from users and assistive tech
(`aria-hidden`, off-screen, `tabIndex=-1`) added to `Booking.tsx` and rejected in
the route with a generic 400; (2) `src/lib/turnstile.ts` — Cloudflare Turnstile
verification that is enforced only when `TURNSTILE_SECRET_KEY` is set (fails
closed when enabled, no-op otherwise) so the live form isn't broken before a site
key is wired in. Legitimate/AT users are unaffected. Per-IP submission caps come
in item 84.

## 12. Throttle password reset and verification emails — APPLIED

**Finding:** `/api/users/forgot-password` (and `/verify`) send outbound mail via
Gmail and had no throttle, so they could be used to spam a victim or run up cost.

**Action:** Split the middleware limiter into a dedicated stricter bucket for
email-triggering endpoints: 3 requests / 5 min per IP (vs 10/min for auth),
returning 429 + Retry-After and a neutral message that doesn't reveal whether the
address is registered. Payload doesn't expose the recipient at this layer, so
keying is per-IP; per-address keying would require a forgot-password hook.

## 13. Set secure session cookie flags — APPLIED

**Finding:** Payload's auth cookie is HttpOnly by default, but Secure/SameSite
weren't explicitly configured.

**Action:** Added `auth.cookies.secure = (NODE_ENV === 'production')` to the
`users` collection — Secure in prod (HTTPS only), off in local dev so
http://localhost login still works. HttpOnly is always on (framework). Domain is
left host-only (most restrictive). SameSite is set in item 54.

## 14. Add idle and absolute session timeouts — APPLIED (idle) / noted (absolute)

**Finding:** `tokenExpiration` was implicit (2h default). No explicit policy.

**Action:** Set `auth.tokenExpiration = 2h` on `users` as the idle timeout —
Payload enforces expiry server-side on each request and extends it on activity, so
an idle admin session dies after 2h. A separate hard absolute-max isn't natively
configurable in Payload; documented as the residual gap (2h idle is an acceptable
bound for this single-admin, low-traffic panel).

## 15. Fully invalidate sessions on logout — N/A (verified)

**Finding:** Payload 3 uses server-side sessions. Logout (`/api/users/logout`)
removes the session record server-side, so the token is dead immediately — not
just cleared from the browser. Payload also supports logging out all devices
(`?allSessions=true`), which clears the whole sessions array for the account.

**Action:** None — framework already destroys the session server-side on logout
and offers all-device logout. A captured token is unusable after logout.

## 16. Validate every JWT claim properly — N/A (verified)

**Finding:** No application code decodes or verifies JWTs — Payload issues and
verifies its own auth JWT on every request (signature via `PAYLOAD_SECRET`, plus
expiration and session binding). There is no endpoint that trusts an unverified
token.

**Action:** None — verification is entirely framework-owned and enforced per
request.
