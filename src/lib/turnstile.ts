// Cloudflare Turnstile server-side verification. This is OPT-IN: it only runs
// when TURNSTILE_SECRET_KEY is configured, so the live form keeps working until a
// client-side widget (using the matching site key) is wired up. Turnstile is a
// privacy-respecting, accessible challenge that doesn't track users.

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export function turnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY)
}

export async function verifyTurnstile(token: string, remoteIp?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true // not configured → treat as pass (honeypot still applies)
  if (!token) return false
  try {
    const form = new URLSearchParams({ secret, response: token })
    if (remoteIp && remoteIp !== 'unknown') form.set('remoteip', remoteIp)
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch {
    // Fail closed on verification errors when the challenge is enabled.
    return false
  }
}
