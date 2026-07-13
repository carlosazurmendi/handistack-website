// Server-side password strength policy for admin/editor accounts.
// Enforced in the Users collection `beforeValidate` hook so it runs identically
// for the create-first-user flow, admin password changes, and password resets —
// never only in the browser. Payload has no built-in complexity policy, so this
// fills that gap.

const MIN_LENGTH = 12
const MAX_LENGTH = 256

// A representative block of the passwords that dominate credential-stuffing and
// breach lists. Not exhaustive — enough to reject the obvious weak choices. For a
// fuller check, wire this to a k-anonymity range query against a breach corpus.
const COMMON = new Set([
  'password', 'password1', 'password123', 'passw0rd', 'p@ssw0rd', 'passwordpassword',
  '123456', '1234567', '12345678', '123456789', '1234567890', '12345678910',
  'qwerty', 'qwerty123', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1q2w3e4r', 'q1w2e3r4',
  'abc123', '111111', '000000', '654321', 'iloveyou', 'admin', 'admin123', 'root',
  'letmein', 'welcome', 'welcome1', 'monkey', 'dragon', 'football', 'baseball',
  'master', 'sunshine', 'princess', 'login', 'changeme', 'changeme1', 'trustno1',
  'superman', 'starwars', 'whatever', 'qazwsx', 'zaq12wsx', 'test1234', 'secret',
  'handistack', 'handistack1', 'changeme!handistack1',
])

// Returns `true` if the password passes, otherwise a friendly reason string.
export function validatePasswordStrength(password: string): string | true {
  if (typeof password !== 'string' || password.length < MIN_LENGTH) {
    return `Password must be at least ${MIN_LENGTH} characters long.`
  }
  if (password.length > MAX_LENGTH) {
    return `Password must be at most ${MAX_LENGTH} characters long.`
  }
  const lower = password.toLowerCase()
  if (COMMON.has(lower)) {
    return 'That password is too common or has appeared in breaches — choose a less predictable one.'
  }
  if (/^(.)\1+$/.test(password)) {
    return 'Password must not be a single repeated character.'
  }
  // Require at least 3 of 4 character classes for a floor on entropy.
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((re) => re.test(password)).length
  if (classes < 3) {
    return 'Password must include at least three of: lowercase, uppercase, digits, symbols.'
  }
  return true
}
