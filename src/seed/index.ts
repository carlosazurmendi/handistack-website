import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'
import { marketingContent, caseStudiesContent } from './content'

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
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe!Handistack1'
  const overwrite = process.env.SEED_OVERWRITE === 'true'

  // ---- Admin user ----
  const existing = await payload.find({ collection: 'users', limit: 1, overrideAccess: true })
  if (existing.totalDocs === 0) {
    await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: { email, password, name: 'Handistack Admin', role: 'admin' },
    })
    console.log(`✓ Created admin user ${email} (password: ${password} — change it after first login)`)
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

  // ---- Case studies ----
  // Default: only seed when the collection is empty (never clobber curated docs).
  // SEED_CASES_UPSERT=true (or SEED_OVERWRITE): upsert the canonical 3 by slug —
  // updates the old stub / creates any missing, leaves other docs untouched.
  const upsertCases = overwrite || process.env.SEED_CASES_UPSERT === 'true'
  const cs = await payload.find({ collection: 'case-studies', limit: 0, overrideAccess: true })
  if (upsertCases) {
    for (const s of caseStudiesContent) {
      const found = await payload.find({
        collection: 'case-studies',
        where: { slug: { equals: s.slug } },
        limit: 1,
        overrideAccess: true,
      })
      if (found.docs[0]) {
        await payload.update({ collection: 'case-studies', id: found.docs[0].id, overrideAccess: true, data: s })
      } else {
        await payload.create({ collection: 'case-studies', overrideAccess: true, data: s })
      }
    }
    console.log(`✓ Upserted ${caseStudiesContent.length} case studies by slug`)
  } else if (cs.totalDocs === 0) {
    for (const s of caseStudiesContent) {
      await payload.create({ collection: 'case-studies', overrideAccess: true, data: s })
    }
    console.log(`✓ Seeded ${caseStudiesContent.length} case studies`)
  } else {
    console.log('• Case studies already exist, skipping (SEED_CASES_UPSERT=true to refresh)')
  }

  console.log('Seed complete.')
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
