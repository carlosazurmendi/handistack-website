import type { Metadata } from 'next'
import Script from 'next/script'
import React from 'react'

import './styles/colors_and_type.css'
import './styles/kit.css'

const SITE_URL =
  process.env.APP_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'https://handistack.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Handistack — AI Consulting for Service-Trade Businesses | Florida',
  description:
    'Handistack is a Florida-based AI consulting firm that builds and installs AI systems to clear operational bottlenecks for service-trade businesses — HVAC, plumbing, electrical and more.',
  icons: { icon: '/handistack-mark.png' },
  openGraph: {
    title: 'Handistack — AI Consulting',
    description: 'Your trade business, minus the bottlenecks.',
    images: ['/handistack-logo-full.png'],
    type: 'website',
  },
}

// AEO: structured data identifying Handistack as a Florida professional service.
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'Handistack',
  description:
    'AI consulting and implementation for service-trade businesses. We find operational bottlenecks — intake, scheduling, quoting, follow-up — and build the AI systems that clear them.',
  url: 'https://handistack.com',
  logo: 'https://handistack.com/handistack-mark.png',
  image: 'https://handistack.com/handistack-logo-full.png',
  slogan: 'Your trade business, minus the bottlenecks.',
  areaServed: 'US',
  knowsAbout: ['AI implementation', 'Business process automation', 'Service-trade operations', 'HVAC', 'Plumbing', 'Electrical'],
  address: { '@type': 'PostalAddress', addressRegion: 'FL', addressCountry: 'US' },
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          // Escape `<` so the serialized JSON can never terminate the <script>
          // element early (defense-in-depth — the data is static today).
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
        {/* Lucide must exist before hydration so icons render immediately. */}
        <Script src="https://unpkg.com/lucide@latest" strategy="beforeInteractive" />
      </head>
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  )
}
