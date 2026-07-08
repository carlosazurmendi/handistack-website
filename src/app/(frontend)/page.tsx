import Site from '@/components/site/Site'
import LivePreviewSite from '@/components/site/LivePreviewSite'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

const SITE_URL =
  process.env.APP_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

// Server component: pull editable marketing copy + case studies from Payload,
// then hand them to the client Site. Falls back to in-code defaults if the CMS
// isn't reachable yet (e.g. first boot before the DB is seeded).
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
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

  // Inside the Payload admin Live Preview iframe (?preview=true), render the
  // client wrapper that live-updates from the editor. Public visitors get the
  // plain server-rendered Site with no live-preview JS.
  const isPreview = (await searchParams)?.preview === 'true'
  if (isPreview) {
    return <LivePreviewSite content={content} caseStudies={caseStudies as never} serverURL={SITE_URL} />
  }

  return <Site content={content} caseStudies={caseStudies as never} />
}
