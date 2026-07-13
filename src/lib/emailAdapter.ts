import type { EmailAdapter, SendEmailOptions } from 'payload'
import { gmailClient, IMPERSONATE_SUBJECT } from './google'

// Payload email adapter backed by the Gmail API via the same domain-wide-delegated
// service account used for booking. Sends as the impersonated subject — no SMTP
// credentials required. Used for admin password-reset / verification mail.

const FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || IMPERSONATE_SUBJECT
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'Handistack'

// Strip CR/LF (and other control chars) so a value can't inject additional email
// headers or split the message. Applied to every header field below.
function headerSafe(v: string): string {
  return v.replace(/[\r\n\t\f\v\0]+/g, ' ').trim()
}

function toList(to: SendEmailOptions['to']): string {
  if (!to) return ''
  if (typeof to === 'string') return headerSafe(to)
  if (Array.isArray(to)) return to.map((t) => headerSafe(typeof t === 'string' ? t : t.address)).join(', ')
  return headerSafe(typeof to === 'string' ? to : (to as { address: string }).address)
}

// Build a minimal RFC 2822 message and base64url-encode it for Gmail's raw send.
function buildRaw(message: SendEmailOptions): string {
  const from = headerSafe(String(message.from || `${FROM_NAME} <${FROM_ADDRESS}>`))
  const to = toList(message.to)
  const subject = headerSafe(String(message.subject || ''))
  const isHtml = Boolean(message.html)
  const body = String(message.html || message.text || '')

  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    message.cc ? `Cc: ${toList(message.cc)}` : '',
    message.replyTo ? `Reply-To: ${toList(message.replyTo as SendEmailOptions['to'])}` : '',
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset="UTF-8"`,
    'Content-Transfer-Encoding: 7bit',
  ]
    .filter(Boolean)
    .join('\r\n')

  const raw = `${headers}\r\n\r\n${body}`
  return Buffer.from(raw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export const gmailEmailAdapter: EmailAdapter = ({ payload }) => ({
  name: 'gmail-service-account',
  defaultFromName: FROM_NAME,
  defaultFromAddress: FROM_ADDRESS,
  sendEmail: async (message) => {
    try {
      const gmail = gmailClient()
      const res = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: buildRaw(message) },
      })
      return res.data
    } catch (err) {
      payload.logger.error({ msg: 'Gmail sendEmail failed', err: (err as Error).message })
      throw err
    }
  },
})
