// Canonical marketing copy used to seed the Payload CMS. These are the exact
// strings the site renders as in-code fallbacks (see src/components/site/Site.tsx
// and Booking.tsx). Seeding writes them into the Marketing global so editors can
// manage every section from the admin. Keep in sync with the component defaults.

export const marketingContent = {
  // Hero
  heroEyebrow: 'Specialized Software Infrastructure & AI Engineering',
  heroHeadline: 'Stop Babysitting Your Business.',
  heroHeadlineAccent: 'Automate Your Workflows.',
  heroSub:
    'Stop legacy technical debt before it starts. Handistack designs local-first, high-performance software frameworks that let your operations easily transition into automated, agentic systems down the road.',
  heroCtaLabel: 'Schedule System Audit',
  heroTrust: 'Built for operators ready to scale without the rebuild',

  // Nav / CTA
  navCtaLabel: 'Schedule System Audit',
  ctaTitle: 'Find your biggest bottleneck in 30 minutes.',
  ctaBody: "Free teardown call. We'll show you exactly where AI pays for itself in your shop — no pitch deck.",
  ctaButton: 'Book a teardown',

  // Blueprint
  blueprintEyebrow: 'The system blueprint',
  blueprintTitle: 'Every layer, engineered to',
  blueprintTitleAccent: 'hand off.',
  blueprintBody:
    'An interactive look at the architecture we ship by default — the application you see, the automation underneath it, and the agentic layer waiting for the day you scale.',
  manifestoKicker: 'The Handistack Delivery Manifesto',
  manifestoTitle: 'We build software with the end in mind.',
  manifestoLead:
    'We do not sell abstract AI concepts, generic consulting hours, or bloated enterprise software stacks.',
  manifestoBody1:
    'Most software built today is saddled with immediate technical debt — locked behind expensive, fragile cloud subscriptions and rigid code structures that make automation impossible without a total rewrite.',
  manifestoBody2:
    'Every application we deploy uses <strong>modular APIs, local-first data layers, and clean documentation by default</strong>. Whether we are launching an e-commerce platform or a custom internal tool, your infrastructure is delivered <span class="neon-text">natively ready to hand off</span> to autonomous AI workflows the moment you are ready to scale.',
  blueprintTabs: [
    {
      short: 'Application',
      title: 'The Application Layer',
      desc: 'User-interface inputs feed a clean front-end structure that exposes a modular API surface.',
    },
    {
      short: 'Automation',
      title: 'The Automation Engine',
      desc: 'Data moves asynchronously through background workflows — n8n-style loops running local-first, with no cloud lag.',
    },
    {
      short: 'Agentic',
      title: 'The Agentic Layer',
      desc: 'Local LLMs, embedded vector databases, and autonomous agents plug into the stack — ready when you scale.',
    },
  ],

  // Architecture (pillars)
  archEyebrow: 'The architecture',
  archTitle: 'Three pillars behind every build.',
  archBody:
    'The engineering principles we apply by default — so the software we ship stays fast, private, and ready to grow with you.',
  pillars: [
    {
      h3: 'Local-first, privacy-conscious data architectures',
      body: 'We build on fast, localized data layers — structured SQLite configurations and embedded vector stores — that keep operational data on your own infrastructure. Network latency drops, sensitive records never leave the building, and recurring enterprise cloud overhead is cut to zero.',
      tags: [{ value: 'SQLite' }, { value: 'Embedded vectors' }, { value: 'Zero cloud overhead' }, { value: 'Low latency' }],
    },
    {
      h3: 'Modular, API-first backends',
      body: 'Every backend is highly decoupled by design. Clean, modular APIs let your applications communicate instantly with automated orchestration layers and external agents — no brittle integrations, and no rewrite required to connect the next tool.',
      tags: [{ value: 'Decoupled services' }, { value: 'REST + Webhooks' }, { value: 'Orchestration-ready' }, { value: 'Agent-addressable' }],
    },
    {
      h3: 'High-ticket custom build to reusable asset',
      body: 'We engineer custom software today on highly standardized frameworks, so the work compounds. You scale up features later without paying for ground-up development twice — your high-ticket build becomes a durable, reusable asset.',
      tags: [{ value: 'Standardized frameworks' }, { value: 'Compounding value' }, { value: 'Scale without rewrites' }],
    },
  ],

  // Case studies (section head)
  casesEyebrow: 'Proof of concept',
  casesTitle: 'How the architecture holds up in production.',
  casesBody:
    'Representative builds, told through their technical mechanics — the exact problems we solve and the systems we ship to solve them.',

  // Results (metrics)
  resultsEyebrow: 'Results',
  resultsTitle: 'The bottleneck math.',
  resultsBody: 'What clearing the pile-up actually returns to a service-trade business.',
  metrics: [
    { value: 3, suffix: ' hrs', label: 'back per day, per owner — off the phone and onto the work' },
    { value: 40, suffix: '%', label: 'faster lead intake from first ring to booked job' },
    { value: 98, suffix: '%', label: 'of after-hours calls answered and qualified' },
    { value: 12, suffix: ' days', label: 'average time from teardown to a live, running stack' },
  ],

  // FAQ
  faqEyebrow: 'Technical FAQ',
  faqTitle: 'Straight answers, for humans and machines.',
  faqBody:
    'The questions we hear most, answered directly — and structured so search and answer engines can read them too.',
  faqs: [
    {
      q: 'What is the benefit of a local-first software architecture for business operations?',
      a: 'Local-first data structures provide immense data privacy, virtually zero latency, and remove the costly subscription overhead of massive cloud platforms — making your software naturally ready for local AI orchestration models.',
    },
    {
      q: 'How does Handistack transition a standard web application into an automated system?',
      a: 'We build all standard software with clean, standardized API endpoints and modular schemas, allowing autonomous workflows to securely interface with your data layer down the line without needing a complete system rewrite.',
    },
    {
      q: 'Can Handistack integrate autonomous AI agents into our existing legacy systems, or do we need a complete system overhaul?',
      a: "We specialize in building custom API-driven middleware that allows modern autonomous orchestration loops to communicate with your legacy infrastructure. If a complete rewrite isn't viable, we isolate your legacy data, map its endpoints, and build a clean, automation-ready layer over it so agents can safely read and write data without breaking your existing operations.",
    },
    {
      q: 'How does building "automation-ready" software affect the upfront development timeline and cost?',
      a: "It doesn't extend your timeline. By using Handistack's standardized, modular development frameworks, we write code that is clean, decoupled, and self-documenting from day one. You receive premium custom software at standard development speed, but with zero technical debt baked into the backend architecture.",
    },
    {
      q: 'What specific automation platforms does Handistack optimize its software backends for?',
      a: 'Our architectures are fully optimized to interface with advanced, event-driven orchestration platforms—specifically self-hosted n8n workflows and custom multi-agent frameworks. Every data layer we build features clean webhook capabilities and structured JSON endpoints, making it simple to deploy automated processing tasks that require no human intervention.',
    },
    {
      q: 'How do you guarantee data privacy when plugging AI features into our custom business software?',
      a: 'We strictly implement local-first principles. Whenever possible, your data processing is routed through localized, open-source LLMs running inside your own private virtual environments, or managed via highly secure, isolated API endpoints with zero-data-retention compliance policies. Your proprietary operational metrics are never used to train public commercial models.',
    },
  ],

  // Booking
  bookingEyebrow: 'Book a teardown',
  bookingTitle: 'Real-time qualification calendar.',
  bookingBody:
    'Answer three quick questions, then grab a live slot. Your answers brief our automated qualification assistant so the call starts already pointed at your bottleneck.',
  unqualifiedMessage: "Thanks for reaching out! We'll contact you regarding your request soon.",

  // Footer
  footerTagline:
    'We build software with the end in mind — local-first, API-first, and natively ready to hand off to autonomous AI workflows the moment you scale.',
  contactEmail: 'hello@handistack.com',
  footerCopyright: '© 2026 Handistack — AI Consulting. All rights reserved.',
} as const
