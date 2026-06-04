import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'

// Idempotent seed: first admin user + marketing copy defaults + sample case studies.
// Run with: pnpm seed   (set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD to override)
async function run() {
  const payload = await getPayload({ config })

  const email = process.env.SEED_ADMIN_EMAIL || 'cazurmendi@handistack.com'
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe!Handistack1'

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

  await payload.updateGlobal({
    slug: 'marketing',
    overrideAccess: true,
    data: {
      heroEyebrow: 'Specialized Software Infrastructure & AI Engineering',
      heroHeadline: 'Stop Babysitting Your Business.',
      heroHeadlineAccent: 'Automate Your Workflows.',
      heroSub:
        'Stop legacy technical debt before it starts. Handistack designs local-first, high-performance software frameworks that let your operations easily transition into automated, agentic systems down the road.',
      heroCtaLabel: 'Schedule System Audit',
      heroTrust: 'Built for operators ready to scale without the rebuild',
      navCtaLabel: 'Schedule System Audit',
      ctaTitle: 'Find your biggest bottleneck in 30 minutes.',
      ctaBody: "Free teardown call. We'll show you exactly where AI pays for itself in your shop — no pitch deck.",
      ctaButton: 'Book a teardown',
      unqualifiedMessage: "Thanks for reaching out! We'll contact you regarding your request soon.",
    },
  })
  console.log('✓ Seeded marketing copy global')

  const cs = await payload.find({ collection: 'case-studies', limit: 1, overrideAccess: true })
  if (cs.totalDocs === 0) {
    const samples = [
      {
        number: '01', order: 1, tag: 'Retail · Inventory ops', slug: 'retail-inventory-pipeline',
        title: 'Automating custom data pipelines for a retail inventory operation',
        problem: 'Stock levels were reconciled by hand across a POS system and three supplier feeds.',
        architecture: 'A local-first SQLite ingestion layer polls each supplier API; n8n workflows normalize feeds asynchronously.',
        outcome: 'Reconciliation dropped from a multi-hour ritual to a continuous background process.',
        stack: [{ value: 'SQLite' }, { value: 'n8n' }, { value: 'REST endpoints' }],
        metricBig: 'Hours → minutes', metricSub: 'reconciliation cycle',
      },
    ]
    for (const s of samples) {
      await payload.create({ collection: 'case-studies', overrideAccess: true, data: s })
    }
    console.log('✓ Seeded sample case study')
  }

  console.log('Seed complete.')
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
