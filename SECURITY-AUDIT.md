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

## 17. Block JWT algorithm confusion attacks — N/A (verified)

**Finding:** Payload signs and verifies with a fixed HMAC algorithm using
`PAYLOAD_SECRET`; it does not read the algorithm from the incoming token and has
no asymmetric/symmetric key that could be confused. No `alg: none` acceptance.

**Action:** None — the signing algorithm is fixed by the framework, not chosen by
the token.

## 18. Strengthen and rotate signing secrets — APPLIED (guard) / noted (rotation)

**Finding:** `PAYLOAD_SECRET` was read from env (good — not hardcoded) but with a
silent `|| ''` fallback, so a misconfigured prod deploy could run with an empty
signing secret.

**Action:** Added a production runtime guard in `payload.config.ts` that throws if
`PAYLOAD_SECRET` is missing or < 32 chars (skipped during `next build` so
secret-less CI still builds). Payload supports a single active secret; true
zero-downtime rotation would need a multi-key verifier, noted as a follow-up. All
other signing secrets (n8n) are already env-sourced.

## 19. Store auth tokens safely client-side — APPLIED

**Finding:** The admin token already lives in an HttpOnly cookie (not
localStorage), but Payload also echoed the raw JWT in login/refresh JSON bodies,
where client JS could read and persist it.

**Action:** Set `auth.removeTokenFromResponses = true` so the token is delivered
only via the HttpOnly + Secure cookie. The admin UI uses the cookie, so this
doesn't affect functionality. No tokens are placed in URLs or logs anywhere.

## 20. Issue short-lived access tokens — APPLIED (via item 14) / framework

**Finding:** Access token lifetime is `tokenExpiration` (set to 2h in item 14).
Payload pairs it with a `/api/users/refresh-token` endpoint to obtain fresh tokens
without re-login, over the same HttpOnly-cookie channel.

**Action:** 2h access token + framework refresh flow. Both are transported via the
Secure HttpOnly cookie, not a bearer token in JS. Shorter windows are possible but
2h is a sensible balance for this single-admin panel.

## 21. Rotate refresh tokens on use — N/A (framework) / noted

**Finding:** Refresh is handled by Payload's `/api/users/refresh-token` against
the server-side session store. Payload issues a fresh token and updates session
state on refresh. Explicit refresh-token-family reuse detection is not a
first-class Payload feature.

**Action:** None applied — rotation/verification is framework-managed and tokens
are session-bound (revocable, item 22). Full reuse-detection would require a
custom auth strategy; noted as a possible enhancement, not a present vuln given
the HttpOnly-cookie transport and single-admin scope.

## 22. Build a token revocation mechanism — N/A (verified)

**Finding:** Payload 3 uses server-side sessions, so tokens are already revocable
before expiry: each request checks the session store, logout removes the session,
"log out everywhere" (`?allSessions=true`) clears all of an account's sessions,
and password change/reset re-issues session state. An admin can also revoke by
deleting sessions on the user document.

**Action:** None — a server-checked session store providing immediate revocation
already exists. This is exactly the mechanism the prompt asks to build.

## 23. Enforce authorization on the server — APPLIED (verified)

**Finding:** All data access is mediated server-side by Payload access-control
functions, not the UI. Writes on every collection require a logged-in user
(Payload's default access is `Boolean(user)` for any unspecified operation);
`leads` and `bookings` are fully locked to authenticated users; public reads are
deliberately narrowed to published content (`case-studies`, `posts`,
`testimonials` gate on `published`) or intentionally-public marketing copy. The
custom `/book/*` routes run server-side and enforce their own gates (e.g.
`/book/confirm` re-checks the lead is `qualified` before booking).

**Action:** None needed for the general model — it is server-enforced. The one
object-level gap (`/book/lead/[id]`) is fixed in item 24.

## 24. Fix insecure direct object references — APPLIED

**Finding:** `GET /book/lead/[id]` returned a lead's status for any id with no
authorization. Lead ids are sequential Postgres integers, so an outsider could
enumerate them to learn how many leads exist and each one's qualification status.

**Action:** Added `src/lib/pollToken.ts` — a stateless HMAC capability token
(keyed by `PAYLOAD_SECRET`, no schema change/migration needed). `/book/lead`
returns a `pollToken` on creation; `/book/lead/[id]` now requires a matching token
(constant-time verified) and returns 404 for a missing/invalid one, so ids can't
be probed. `Booking.tsx` captures the token and sends it on every poll. Other
id-addressed routes (`/book/confirm`) already re-check the lead's status
server-side.

## 25. Implement role-based access control — APPLIED

**Finding:** A `role` field (admin/editor) existed but wasn't enforced. The `users`
collection only set the `admin` access, so create/read/update/delete fell back to
Payload's default (`Boolean(user)`) — meaning any editor could create or delete
accounts.

**Action:** Added `src/access/roles.ts` with centralized, reusable helpers
(`isAuthenticated`, `isAdmin`, `isAdminOrSelf`, `isAdminFieldLevel`) and applied
them to `users`: both roles reach the panel, but create/delete are admin-only and
read/update are admin-or-self. Content collections keep editor+admin write access
(their default `Boolean(user)`), which is the intended editor role. The role-field
escalation lock is item 28.

## 26. Apply a default-deny access policy — APPLIED (verified)

**Finding:** Payload's default access for any operation without an explicit rule is
`Boolean(user)` (deny for anonymous). Reviewed every collection/global: all writes
are default-denied to the public; public reads are opt-in and narrow
(`case-studies`/`posts`/`testimonials` gate on `published`; `media`/`categories`/
`marketing` are intentionally public content). No collection is accidentally open
for writes, and there is no unauthenticated write path.

**Action:** None beyond item 25's explicit `users` rules — the baseline posture is
already deny-by-default. New collections inherit the same default.

## 27. Lock down all admin routes — APPLIED (verified) / see item 86

**Finding:** The Payload admin panel is gated by the `admin` access function
(requires a logged-in user) and every collection API enforces its own access. No
forgotten debug/setup endpoints exist in app code. Two notes: (a) the admin panel
is reachable at both `adminportal.handistack.com` and `handistack.com/admin`, but
both still require authentication, so this is a routing preference, not an
exposure; (b) the GraphQL Playground route is disabled for production in item 86.

**Action:** Verified admin auth gating. Privileged account actions are locked to
admins (item 25) and privilege fields to admins (item 28). Playground lockdown in
item 86.

## 28. Close privilege escalation paths — APPLIED

**Finding:** With item 25's `isAdminOrSelf`, an editor can update their own user
document. Without a field-level guard on `role`, they could set their own role to
`admin` — a self-escalation path (also a mass-assignment risk if `role` were sent
in an update body).

**Action:** Added field-level `access.create`/`access.update = isAdminFieldLevel`
to the `role` field on `users`, so only admins can assign or change roles. Editors
can still edit their own name/email but the role is server-side read-only to them.
No endpoint accepts a client-supplied role for another user.

## 29. Isolate data between tenants — N/A (single-tenant)

**Finding:** This is a single-tenant marketing site for one business with one
admin team. There is no per-customer/organization data partitioning — leads,
bookings, and content all belong to the one operator.

**Action:** None — no cross-tenant boundary exists to enforce.

## 30. Add function-level permission checks — APPLIED (verified)

**Finding:** Payload evaluates access per operation (create/read/update/delete)
per collection, not once per feature. `users` create/delete are admin-only,
update/read are admin-or-self (item 25), and the `role` field has its own
create/update guard (item 28). Content collections grant editor+admin write.

**Action:** Verified each sensitive operation has its own server-side check;
viewing does not imply editing and membership does not imply administration.

## 31. Block mass assignment of fields — APPLIED (verified)

**Finding:** The public `/book/lead` route builds the lead record from an explicit
allowlist of fields (name/email/phone/domain/bottleneck/timeline) and hardcodes
`status`, `source`, and `consent*` — user input can't set arbitrary columns. The
n8n callback only writes verdict fields and is secret-authenticated. Privileged
fields (`role`) are field-access-locked (item 28), which is Payload's
mass-assignment defense.

**Action:** Verified no user-controlled bulk object binding sets sensitive fields
on create or update.

## 32. Re-verify access on each request — APPLIED (verified)

**Finding:** Payload runs access-control functions on every request against the
current user/session; decisions are not cached from login. Role/permission changes
take effect on the next request, and revoking a session (item 22) blocks access
immediately. `tokenExpiration` bounds how long any stale token can live.

**Action:** None — access is evaluated fresh per request by the framework.
