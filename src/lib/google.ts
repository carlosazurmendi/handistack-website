import { readFileSync } from 'fs'
import { google } from 'googleapis'
import { JWT } from 'google-auth-library'

type ServiceAccountKey = {
  client_email: string
  private_key: string
  [k: string]: unknown
}

let keyCache: ServiceAccountKey | null = null

// Load the service-account JSON from a file path (local) or base64 env (Docker).
export function loadServiceAccount(): ServiceAccountKey {
  if (keyCache) return keyCache
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_B64
  const filePath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH
  let raw: string
  if (b64) {
    raw = Buffer.from(b64, 'base64').toString('utf8')
  } else if (filePath) {
    raw = readFileSync(filePath, 'utf8')
  } else {
    throw new Error('No Google credentials: set GOOGLE_SERVICE_ACCOUNT_B64 or GOOGLE_SERVICE_ACCOUNT_PATH')
  }
  keyCache = JSON.parse(raw) as ServiceAccountKey
  return keyCache
}

export const IMPERSONATE_SUBJECT =
  process.env.GOOGLE_IMPERSONATE_SUBJECT || 'cazurmendi@handistack.com'
export const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || IMPERSONATE_SUBJECT
export const CALENDAR_TZ = process.env.GOOGLE_TIMEZONE || 'America/New_York'

// Build a domain-wide-delegated JWT client impersonating the booking subject.
function authClient(scopes: string[], subject = IMPERSONATE_SUBJECT): JWT {
  const key = loadServiceAccount()
  return new JWT({
    email: key.client_email,
    key: key.private_key,
    scopes,
    subject,
  })
}

export function calendarClient() {
  const auth = authClient([
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ])
  return google.calendar({ version: 'v3', auth })
}

export function gmailClient() {
  const auth = authClient(['https://www.googleapis.com/auth/gmail.send'])
  return google.gmail({ version: 'v1', auth })
}

export function meetAuth() {
  return authClient(['https://www.googleapis.com/auth/meetings.space.created'])
}
