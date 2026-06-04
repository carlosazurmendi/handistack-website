import Site from '@/components/site/Site'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

// Server component: pull editable marketing copy + case studies from Payload,
// then hand them to the client Site. Falls back to in-code defaults if the CMS
// isn't reachable yet (e.g. first boot before the DB is seeded).
export default async function HomePage() {
  // Loose types: the client Site treats CMS content as optional overrides.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let content: any = null
  let caseStudies: any[] = []

  try {
    const payload = await getPayloadClient()
    content = await payload.findGlobal({ slug: 'marketing', depth: 1 }).catch(() => null)
    const cs = await payload
      .find({ collection: 'case-studies', where: { published: { equals: true } }, sort: 'order', limit: 20, depth: 0 })
      .catch(() => null)
    caseStudies = cs?.docs || []
  } catch {
    // CMS not ready — render with defaults baked into the components.
  }

  return <Site content={content} caseStudies={caseStudies as never} />
}
