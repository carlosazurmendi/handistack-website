# Handistack Site

Marketing site + qualification booking flow for Handistack.

**Stack:** Next.js 16 (App Router) · Payload CMS 3 · Supabase (Postgres) · Google
Calendar/Meet/Gmail (service account) · n8n (lead qualification).

---

## How the booking flow works

```
Visitor fills triage form (name, email, phone, domain, bottleneck, timeline)
        │  POST /book/lead
        ▼
Lead saved to Supabase (status: researching) ──► forwarded to n8n webhook
        │                                              │  (researches the company)
        │  client polls GET /book/lead/:id             ▼
        │                                       n8n POSTs verdict to /book/callback
        ▼                                       (x-callback-secret header)
   verdict?
   ├── qualified   → live Google Calendar availability → pick slot
   │                 POST /book/confirm → creates Calendar event + Google Meet
   │                 (notes/transcript/moderation) + Gmail invite → "Booked" screen
   └── unqualified → "Thanks for reaching out! We'll contact you soon." screen
```

Everything is server-gated: a visitor can only reach the calendar if their lead row
is `qualified`, and `/book/confirm` re-checks that before creating any event.

---

## Local development

```bash
pnpm install
cp .env.example .env        # then fill values (already done if .env exists)
pnpm payload generate:importmap
pnpm payload generate:types
pnpm seed                   # creates admin user + marketing copy + sample case study
pnpm dev                    # http://localhost:3000  (admin at /admin)
```

> `pnpm start` warns under `output: standalone`; for a local prod check run
> `node .next/standalone/server.js` instead. Use `pnpm dev` day-to-day.

Default seeded admin: `cazurmendi@handistack.com`. The seed no longer ships a
hardcoded password — set `SEED_ADMIN_PASSWORD`, or it generates a strong random one
and prints it once at creation. Change it on first login.

---

## Environment variables

See `.env.example` for the full annotated list. Groups:

- **App / Payload** — `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `ADMIN_HOST`.
- **Supabase** — `DATABASE_URI` (Payload's Postgres), `SUPABASE_URL`,
  `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`.
- **Google** — `GOOGLE_SERVICE_ACCOUNT_PATH` *or* `GOOGLE_SERVICE_ACCOUNT_B64`,
  `GOOGLE_IMPERSONATE_SUBJECT`, `GOOGLE_CALENDAR_ID`, `GOOGLE_TIMEZONE`.
- **Booking** — `BOOKING_WINDOWS` (`09:00-11:00,13:00-15:00`), `BOOKING_SLOT_MINUTES`,
  `BOOKING_LEAD_DAYS`, `BOOKING_HORIZON_DAYS`.
- **n8n** — `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_TOKEN`, `N8N_CALLBACK_SECRET`.

---

## Google service account — one-time authorization

The app uses a **service account with domain-wide delegation** impersonating the
booking user. In the Google Workspace **Admin console** → *Security → Access and
data control → API controls → Domain-wide delegation*, add:

- **Client ID:** `104259932774777610784`
- **Scopes:**
  ```
  https://www.googleapis.com/auth/calendar,https://www.googleapis.com/auth/calendar.events,https://www.googleapis.com/auth/gmail.send,https://www.googleapis.com/auth/meetings.space.created
  ```

Enable these APIs in the Cloud project `handistack`: **Calendar API**, **Gmail API**,
**Google Meet API**.

`GOOGLE_IMPERSONATE_SUBJECT` must own (or have *"Make changes to events"* on)
`GOOGLE_CALENDAR_ID`. Simplest: set both to the same user (`cazurmendi@handistack.com`).

**Meet features:** auto note-taking (smart notes), transcript, and host moderation
("waiting room") are set on the Meet space (`src/lib/meet.ts`). Smart-notes and
transcription require a Workspace edition / Gemini license that supports them; if the
edition lacks it Google ignores those keys instead of failing, and the booking still
gets a working Meet link.

---

## n8n contract

**Inbound** — `/book/lead` POSTs to `N8N_WEBHOOK_URL` with header
`x-n8n-token: <N8N_WEBHOOK_TOKEN>` and body:

```json
{
  "leadId": "123",
  "name": "...", "email": "...", "phone": "...",
  "domain": "yourcompany.com", "bottleneck": "...", "timeline": "...",
  "callbackUrl": "https://trades.handistack.com/book/callback",
  "callbackSecret": "<N8N_CALLBACK_SECRET>"
}
```

**Outbound (your final n8n HTTP node)** — POST the verdict to the `callbackUrl` with
header `x-callback-secret: <callbackSecret>` and body:

```json
{
  "leadId": "123",
  "status": "qualified",          // or "unqualified"
  "summary": "Optional research notes shown in the admin",
  "score": 82,                     // optional 0–100
  "raw": { }                       // optional full research payload (stored for audit)
}
```

The frontend polls every 3s (up to ~2.5 min, then shows the soft "we'll reach out"
screen). Faster is better — aim to return a verdict within ~30–60s.

---

## Deployment (GCP VPS + Docker + Traefik, via Dockhand)

The image builds to a Next.js **standalone** server listening on **:80** inside the
container. `docker-compose.yml` is Traefik-labelled and joins the external `proxy`
network — no host ports are published; Traefik routes to the container.

- **GitHub Actions** (`.github/workflows/docker-publish.yml`) builds and pushes
  `ghcr.io/carlosazurmendi/handistack-website:latest` on every push to `main`.
- **Dockhand** on the VPS pulls that image (compose also has a `build:` context if you
  prefer building on the box) and runs it.

**Routing (Traefik):**
- `trades.handistack.com` → marketing site
- `adminportal.handistack.com` → same container; middleware rewrites the host to
  `/admin`, so the Payload admin shows there and the marketing site never does.

**Env on the VPS** — create `.env` next to the compose (Dockhand can write it). Key
production values:

```
APP_URL=https://trades.handistack.com            # runtime base (NOT build-inlined)
NEXT_PUBLIC_SERVER_URL=https://trades.handistack.com
ADMIN_HOST=adminportal.handistack.com
GOOGLE_SERVICE_ACCOUNT_B64=<base64 of the service-account JSON>   # no file to mount
PAYLOAD_DB_PUSH=true                       # first deploy; switch to migrations later
```

Plus all the Supabase / Google / n8n values from `.env.example`. Generate the B64 key:

```bash
base64 -w0 secrets/google-service-account.json
```

n8n must be able to reach `https://trades.handistack.com/book/callback`. Because `APP_URL` is
read at runtime, the callback URL handed to n8n is correct regardless of how the image
was built.

> **Secrets never live in the repo.** `.env` and `secrets/` are gitignored. Set every
> value on the VPS (or via Dockhand's env management).

---

## Content model (Payload)

- **Pipeline:** `leads`, `bookings` (the booking flow's data).
- **Content:** `marketing` global (editable hero/CTA/results/FAQ/booking/footer copy),
  `case-studies`, `testimonials`, `posts` + `categories` (blog — modelled and ready,
  no public route wired yet), `media`.
- **Admin:** `users`.

Structural copy (architecture pillars, system blueprint) is in code for v1; the rest
is editable from the admin portal.

---

## Production hardening checklist

- [ ] **Rotate all secrets** that were shared during setup (service-account key,
      Supabase keys + DB password, n8n token, callback secret, `PAYLOAD_SECRET`).
- [ ] Move from schema `push` to migrations: set `PAYLOAD_DB_PUSH=false`, run
      `pnpm payload migrate:create` and `pnpm payload migrate`.
- [x] **Email adapter** — done. Payload mail (password reset/verify) sends via the
      Gmail API through the same service account (`src/lib/emailAdapter.ts`), as
      `EMAIL_FROM_ADDRESS`. Needs the `gmail.send` scope authorized (already in the DWD list).
- [x] **Supabase Storage** — wired (`@payloadcms/storage-s3`), auto-enables when the
      `SUPABASE_S3_*` env vars are set; otherwise media stays on the local volume.
      To turn on: in Supabase create a **public** bucket `media`, generate **S3 access
      keys** (Storage → Settings), and fill `SUPABASE_S3_ACCESS_KEY_ID` /
      `SUPABASE_S3_SECRET_ACCESS_KEY` / `SUPABASE_S3_REGION` (match project region).
- [ ] Lock Supabase RLS / network rules; the app connects via the direct Postgres URI.
```
