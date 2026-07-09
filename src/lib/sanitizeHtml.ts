// Minimal, allowlist-by-reconstruction sanitizer for the handful of CMS fields
// that intentionally render inline HTML (e.g. the marketing manifesto, which uses
// <strong> and <span class="neon-text">). It is authored by admins/editors, but
// treating it as fully trusted would let a rogue or compromised editor account
// inject a <script>/onerror payload that runs in every visitor's browser (stored
// XSS). This defends against that without adding a dependency.
//
// Technique: escape EVERYTHING first, then un-escape only an exact allowlist of
// safe tags. Anything not matching an allowed token stays escaped as text, so no
// scripts, event handlers, arbitrary attributes, or javascript: URLs survive.
// For richer/less-trusted HTML, replace this with a vetted sanitizer (DOMPurify).

function escapeAll(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Exact tag tokens we re-allow, mapped from their escaped form back to real HTML.
const ALLOWED: Array<[RegExp, string]> = [
  [/&lt;strong&gt;/g, '<strong>'],
  [/&lt;\/strong&gt;/g, '</strong>'],
  [/&lt;b&gt;/g, '<b>'],
  [/&lt;\/b&gt;/g, '</b>'],
  [/&lt;em&gt;/g, '<em>'],
  [/&lt;\/em&gt;/g, '</em>'],
  [/&lt;i&gt;/g, '<i>'],
  [/&lt;\/i&gt;/g, '</i>'],
  [/&lt;br\s*\/?&gt;/g, '<br />'],
  [/&lt;p&gt;/g, '<p>'],
  [/&lt;\/p&gt;/g, '</p>'],
  // <span class="neon-text"> and <span class="neon-text neon-animated"> only.
  [/&lt;span class=&quot;(neon-text(?: neon-animated)?)&quot;&gt;/g, '<span class="$1">'],
  [/&lt;\/span&gt;/g, '</span>'],
]

export function sanitizeInlineHtml(input: string | null | undefined): string {
  if (typeof input !== 'string' || input === '') return ''
  let out = escapeAll(input)
  for (const [pattern, replacement] of ALLOWED) {
    out = out.replace(pattern, replacement as string)
  }
  return out
}
