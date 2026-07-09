import 'dotenv/config'
import { randomBytes } from 'crypto'
import { getPayload } from 'payload'
import config from '../payload.config'
import { marketingContent } from './content'
import { validatePasswordStrength } from '../lib/passwordPolicy'

// Generate a strong random admin password when SEED_ADMIN_PASSWORD isn't provided,
// so no weak credential is ever hardcoded in the source. Printed once so the
// operator can log in and immediately change it.
function generateStrongPassword(): string {
  for (;;) {
    const pw = randomBytes(24).toString('base64').slice(0, 24)
    if (validatePasswordStrength(pw) === true) return pw
  }
}

// Idempotent seed: first admin user + full marketing copy + sample case studies.
// Run with: pnpm seed
//   SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD  — override the seeded admin
//   SEED_OVERWRITE=true                      — overwrite existing global fields
//                                              (default: only fill empty fields,
//                                               so manual admin edits are kept)
function isEmpty(v: unknown): boolean {
  if (v === undefined || v === null) return true
  if (typeof v === 'string') return v.trim() === ''
  if (Array.isArray(v)) return v.length === 0
  return false
}

async function run() {
  const payload = await getPayload({ config })

  const email = process.env.SEED_ADMIN_EMAIL || 'cazurmendi@handistack.com'
  // Never ship a hardcoded password. Use the env value, or mint a strong random
  // one (which also satisfies the password policy in src/lib/passwordPolicy.ts).
  const envPassword = process.env.SEED_ADMIN_PASSWORD
  const password = envPassword || generateStrongPassword()
  const overwrite = process.env.SEED_OVERWRITE === 'true'

  // ---- Admin user ----
  const existing = await payload.find({ collection: 'users', limit: 1, overrideAccess: true })
  if (existing.totalDocs === 0) {
    await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: { email, password, name: 'Handistack Admin', role: 'admin' },
    })
    if (envPassword) {
      console.log(`✓ Created admin user ${email} (using SEED_ADMIN_PASSWORD — change it after first login)`)
    } else {
      console.log(`✓ Created admin user ${email}`)
      console.log(`  Generated password (shown once — save it, then change after first login):\n    ${password}`)
    }
  } else {
    console.log('• Users already exist, skipping admin creation')
  }

  // ---- Marketing global ----
  const current = (await payload.findGlobal({ slug: 'marketing', overrideAccess: true })) as unknown as Record<string, unknown>
  const patch: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(marketingContent)) {
    if (overwrite || isEmpty(current?.[key])) patch[key] = value
  }
  if (Object.keys(patch).length) {
    await payload.updateGlobal({ slug: 'marketing', overrideAccess: true, data: patch })
    console.log(`✓ Seeded marketing copy — ${Object.keys(patch).length} field(s): ${Object.keys(patch).join(', ')}`)
  } else {
    console.log('• Marketing copy already fully populated, nothing to fill')
  }

  // Case studies are real, curated business content — managed in the admin, not
  // seeded. (Intentionally left out to avoid injecting generic samples.)

  console.log('Seed complete.')
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
