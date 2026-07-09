// Structured, injection-safe security-event logging. Each event is one JSON line
// with a timestamp, an event name, and a few context fields. Every string value is
// scrubbed of control characters and length-capped, so attacker-controlled input
// (an IP header, an email) can't forge fake log lines or break the log format
// (log injection / forgery). Secrets and full PII are deliberately never passed in.

// Replace ASCII control chars (codepoint < 0x20, plus DEL 0x7f) with a space, so a
// value can't inject newlines/tabs to forge log lines. Printable chars are kept.
// Uses a char-code scan (no regex) to stay unambiguous.
function stripControlChars(s: string): string {
  let out = ''
  for (const ch of s) {
    const code = ch.charCodeAt(0)
    out += code < 0x20 || code === 0x7f ? ' ' : ch
  }
  return out
}

function scrub(v: unknown): unknown {
  if (typeof v === 'string') return stripControlChars(v).slice(0, 256)
  if (typeof v === 'number' || typeof v === 'boolean') return v
  return undefined // don't serialize nested/untrusted objects into the log line
}

export function logSecurityEvent(event: string, fields: Record<string, unknown> = {}): void {
  const safe: Record<string, unknown> = { evt: scrub(event), ts: new Date().toISOString() }
  for (const [k, val] of Object.entries(fields)) {
    const s = scrub(val)
    if (s !== undefined) safe[k] = s
  }
  // Single JSON line so downstream log viewers parse each event as one record.
  console.log('[security] ' + JSON.stringify(safe))
}
