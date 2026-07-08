'use client'
import { useLivePreview } from '@payloadcms/live-preview-react'
import Site from './Site'

/* eslint-disable @typescript-eslint/no-explicit-any */

// Client wrapper used only when the homepage is loaded inside the Payload admin
// Live Preview iframe (?preview=true). It subscribes to the admin's postMessage
// stream and re-renders <Site> with the live Marketing-global data on every
// keystroke. Case studies stay static (separate documents).
export default function LivePreviewSite({
  content,
  caseStudies,
  serverURL,
}: {
  content: any
  caseStudies: any[]
  serverURL: string
}) {
  const { data } = useLivePreview<any>({
    initialData: content || {},
    serverURL,
    depth: 1,
  })
  return <Site content={data} caseStudies={caseStudies as never} />
}
