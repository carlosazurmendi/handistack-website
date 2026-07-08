'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Icon, useReveal } from './ui'
import { Booking } from './Booking'

const MARK = '/handistack-mark.png'

/* eslint-disable @typescript-eslint/no-explicit-any */
type Content = any
type CaseStudy = {
  number?: string
  tag?: string
  title: string
  problem: string
  architecture: string
  outcome: string
  stack?: { value: string }[]
  metricBig?: string
  metricSub?: string
}

/* ============================================================ NAV */
function Nav({ onBook, content }: { onBook: () => void; content: Content }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])
  const links: [string, string][] = [
    ['System', '#blueprint'],
    ['Architecture', '#architecture'],
    ['Case studies', '#cases'],
    ['Results', '#results'],
    ['FAQ', '#faq'],
  ]
  const ctaLabel = content?.navCtaLabel || 'Schedule System Audit'
  const close = () => setMenuOpen(false)
  return (
    <nav className={'nav' + (scrolled ? ' scrolled' : '')}>
      <div className="wrap nav-in">
        <a className="nav-logo" href="#top" aria-label="Handistack home" onClick={close}>
          <img src={MARK} alt="Handistack" />
          <span>Handistack</span>
        </a>
        <div className="nav-links">
          {links.map(([label, href]) => (
            <a key={label} className="nav-link" href={href}>{label}</a>
          ))}
        </div>
        <button className="btn btn-ink nav-cta" onClick={onBook}>
          {ctaLabel} <Icon name="arrow-right" />
        </button>
        <button className="nav-burger" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
          <Icon name={menuOpen ? 'x' : 'menu'} />
        </button>
      </div>
      <div className={'nav-mobile' + (menuOpen ? ' open' : '')}>
        <div className="nav-mobile-links">
          {links.map(([label, href]) => (
            <a key={label} className="nav-mobile-link" href={href} onClick={close}>
              {label}
              <Icon name="arrow-up-right" />
            </a>
          ))}
        </div>
        <button className="btn btn-ink nav-mobile-cta" onClick={() => { close(); onBook() }}>
          {ctaLabel} <Icon name="arrow-right" />
        </button>
      </div>
      {menuOpen && <div className="nav-scrim" onClick={close} />}
    </nav>
  )
}

/* ============================================================ HERO */
const VBOX = 460
const CENTER = { x: 230, y: 214 }
const NODES = [
  { x: 86, y: 96, icon: 'database', label: 'Local-first' },
  { x: 388, y: 116, icon: 'gauge', label: 'High-performance' },
  { x: 410, y: 300, icon: 'bot', label: 'Agentic-ready' },
  { x: 232, y: 392, icon: 'workflow', label: 'Automated ops' },
  { x: 64, y: 320, icon: 'shield-check', label: 'Zero tech debt' },
]

function Stack3D() {
  const ref = useRef<HTMLDivElement>(null)
  const [t, setT] = useState({ rx: 10, ry: -14, sx: 56, sy: 34 })
  useEffect(() => {
    const MAX = 30
    const clamp = (v: number, n: number) => Math.max(-n, Math.min(n, v))
    const onMove = (e: MouseEvent) => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2
      const nx = clamp((e.clientX - cx) / (window.innerWidth * 0.5), 1)
      const ny = clamp((e.clientY - cy) / (window.innerHeight * 0.5), 1)
      setT({ ry: clamp(nx * MAX, MAX), rx: clamp(-ny * MAX, MAX), sx: 50 - nx * 40, sy: 40 - ny * 34 })
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])
  const [hot, setHot] = useState<number | null>(null)
  const layers = [
    { x: -26, y: 20, z: -72, scale: 0.82, op: 0.5 },
    { x: -13, y: 10, z: -22, scale: 0.91, op: 0.78 },
    { x: 0, y: 0, z: 34, scale: 1, op: 1 },
  ]
  const pct = (v: number) => (v / VBOX) * 100 + '%'
  return (
    <div className="stage hero-scene">
      <div className="hero-dots" />
      <svg className="node-lines" viewBox={`0 0 ${VBOX} ${VBOX}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="neonLine" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={VBOX} y2={VBOX}>
            <stop offset="0%" stopColor="#0066FF" />
            <stop offset="35%" stopColor="#7B3FF2" />
            <stop offset="58%" stopColor="#E03AF0" />
            <stop offset="80%" stopColor="#FF8A1E" />
            <stop offset="100%" stopColor="#FFC400" />
          </linearGradient>
        </defs>
        {NODES.map((n, i) => {
          const d = `M${CENTER.x} ${CENTER.y} L${n.x} ${n.y}`
          return (
            <g key={i}>
              <path className="line-base" d={d} />
              <path className={'flow' + (hot === i ? ' on' : '')} d={d} />
            </g>
          )
        })}
      </svg>
      {NODES.map((n, i) => (
        <button key={i} className={'node' + (hot === i ? ' lit' : '')} style={{ left: pct(n.x), top: pct(n.y) }}
          onMouseEnter={() => setHot(i)} onMouseLeave={() => setHot(null)} onFocus={() => setHot(i)} onBlur={() => setHot(null)} aria-label={n.label}>
          <span className="nd"><Icon name={n.icon} /></span>
          {n.label}
        </button>
      ))}
      <div ref={ref} className="stack3d" style={{ transform: `rotateX(${t.rx}deg) rotateY(${t.ry}deg)` }}>
        {layers.map((l, i) => (
          <div key={i} className="layer" style={{ transform: `translate3d(${l.x}px, ${l.y}px, ${l.z}px) scale(${l.scale})`, opacity: l.op }} />
        ))}
        <div className="stack-shine" style={{ transform: 'translateZ(38px)', ['--sx' as any]: t.sx + '%', ['--sy' as any]: t.sy + '%' }} />
        <div className="mark" style={{ transform: 'translateZ(72px)' }}>
          <img src={MARK} alt="" />
        </div>
      </div>
    </div>
  )
}

function Hero({ onBook, content }: { onBook: () => void; content: Content }) {
  const eyebrow = content?.heroEyebrow || 'Specialized Software Infrastructure & AI Engineering'
  const headline = content?.heroHeadline || 'Stop Babysitting Your Business.'
  const accent = content?.heroHeadlineAccent || 'Automate Your Workflows.'
  const sub = content?.heroSub ||
    'Stop legacy technical debt before it starts. Handistack designs local-first, high-performance software frameworks that let your operations easily transition into automated, agentic systems down the road.'
  const ctaLabel = content?.heroCtaLabel || 'Schedule System Audit'
  const trust = content?.heroTrust || 'Built for operators ready to scale without the rebuild'
  return (
    <header className="hero" id="top">
      <div className="hero-wash" />
      <div className="wrap hero-grid">
        <div className="reveal in">
          <div className="eyebrow">{eyebrow}</div>
          <h1>
            {headline}{' '}
            <span className="neon-text neon-animated">{accent}</span>
          </h1>
          <p className="sub">{sub}</p>
          <div className="hero-cta">
            <button className="btn btn-neon btn-lg" onClick={onBook}>
              {ctaLabel} <Icon name="arrow-right" />
            </button>
          </div>
          <div className="hero-trust">
            <Icon name="circle-check-big" /> {trust}
          </div>
        </div>
        <Stack3D />
      </div>
    </header>
  )
}

/* ============================================================ SYSTEM BLUEPRINT */
const BP_VW = 720, BP_VH = 460
const BP_TABS = [
  {
    key: 'application', n: '01', short: 'Application', title: 'The Application Layer',
    desc: 'User-interface inputs feed a clean front-end structure that exposes a modular API surface.',
    nodes: [
      { x: 122, y: 110, icon: 'monitor', label: 'Web UI', kind: 'input' },
      { x: 122, y: 230, icon: 'smartphone', label: 'Mobile', kind: 'input' },
      { x: 122, y: 350, icon: 'clipboard-list', label: 'Intake forms', kind: 'input' },
      { x: 340, y: 230, icon: 'layout-dashboard', label: 'Front-end layer', kind: 'primary' },
      { x: 566, y: 150, icon: 'webhook', label: 'API gateway', kind: 'default' },
      { x: 566, y: 312, icon: 'plug', label: 'Modular endpoints', kind: 'default' },
    ],
    links: [
      { a: 0, b: 3, live: true }, { a: 1, b: 3, live: true }, { a: 2, b: 3, live: true },
      { a: 3, b: 4, live: true }, { a: 3, b: 5, live: true },
    ],
    flow: [[0, 1, 2], [3], [4, 5]],
  },
  {
    key: 'automation', n: '02', short: 'Automation', title: 'The Automation Engine',
    desc: 'Data moves asynchronously through background workflows — n8n-style loops running local-first, with no cloud lag.',
    nodes: [
      { x: 110, y: 230, icon: 'zap', label: 'Trigger', kind: 'input' },
      { x: 268, y: 230, icon: 'layers', label: 'Queue', kind: 'default' },
      { x: 432, y: 184, icon: 'workflow', label: 'Workflow · n8n', kind: 'primary' },
      { x: 432, y: 352, icon: 'repeat', label: 'Async loop', kind: 'default' },
      { x: 612, y: 184, icon: 'check-check', label: 'Result', kind: 'default' },
    ],
    links: [
      { a: 0, b: 1, live: true }, { a: 1, b: 2, live: true }, { a: 2, b: 4, live: true },
      { a: 2, b: 3, live: true }, { a: 3, b: 2, live: true },
    ],
    flow: [[0], [1], [2], [3], [4]],
  },
  {
    key: 'agentic', n: '03', short: 'Agentic', title: 'The Agentic Layer',
    desc: 'Local LLMs, embedded vector databases, and autonomous agents plug into the stack — ready when you scale.',
    nodes: [
      { x: 360, y: 224, icon: 'bot', label: 'Autonomous agent', kind: 'primary' },
      { x: 152, y: 116, icon: 'brain-circuit', label: 'Local LLM', kind: 'default' },
      { x: 152, y: 338, icon: 'database', label: 'Vector DB', kind: 'default' },
      { x: 576, y: 116, icon: 'wrench', label: 'Tools & actions', kind: 'default' },
      { x: 576, y: 338, icon: 'history', label: 'Memory', kind: 'default' },
      { x: 360, y: 402, icon: 'blocks', label: 'Plugs into the stack', kind: 'input' },
    ],
    links: [
      { a: 1, b: 0, live: true }, { a: 2, b: 0, live: true }, { a: 3, b: 0, live: true },
      { a: 4, b: 0, live: true }, { a: 0, b: 5, live: true },
    ],
    flow: [[1, 2, 3, 4], [0], [5]],
  },
]

function BpNodeGraph({ tab }: { tab: typeof BP_TABS[number] }) {
  const [hot, setHot] = useState<number | null>(null)
  const px = (v: number) => (v / BP_VW) * 100 + '%'
  const py = (v: number) => (v / BP_VH) * 100 + '%'
  return (
    <div className="bp-canvas">
      <div className="bp-dots" />
      <svg className="bp-lines" viewBox={`0 0 ${BP_VW} ${BP_VH}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="bpNeon" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={BP_VW} y2={BP_VH}>
            <stop offset="0%" stopColor="#0066FF" />
            <stop offset="32%" stopColor="#7B3FF2" />
            <stop offset="56%" stopColor="#E03AF0" />
            <stop offset="80%" stopColor="#FF8A1E" />
            <stop offset="100%" stopColor="#FFC400" />
          </linearGradient>
        </defs>
        {tab.links.map((lk, i) => {
          const A = tab.nodes[lk.a], B = tab.nodes[lk.b]
          const d = `M${A.x} ${A.y} L${B.x} ${B.y}`
          const on = hot !== null && (lk.a === hot || lk.b === hot)
          return (
            <g key={i}>
              <path className="bp-line" d={d} />
              <path className={'bp-flow' + (lk.live ? ' live' : '') + (on ? ' on' : '')} d={d} />
            </g>
          )
        })}
      </svg>
      {tab.nodes.map((nd, i) => (
        <div key={i} className={'bp-npos ' + nd.kind} style={{ left: px(nd.x), top: py(nd.y) }}
          onMouseEnter={() => setHot(i)} onMouseLeave={() => setHot(null)} onClick={() => setHot((h) => (h === i ? null : i))}>
          <div className={'bp-node ' + nd.kind + (hot === i ? ' lit' : '')} style={{ animationDelay: i * 60 + 'ms' }}>
            <span className="nd"><Icon name={nd.icon} /></span>
            {nd.label}
          </div>
        </div>
      ))}
    </div>
  )
}

function BpFlow({ tab }: { tab: typeof BP_TABS[number] }) {
  const [hot, setHot] = useState<number | null>(null)
  return (
    <div className="bpf" role="list">
      {tab.flow.map((row, ri) => (
        <React.Fragment key={ri}>
          {ri > 0 && <div className="bpf-conn" aria-hidden="true" />}
          <div className={'bpf-row' + (row.length > 1 ? ' multi' : '')}>
            {row.length > 1 && <span className="bpf-grouptag">Parallel</span>}
            {row.map((ni) => {
              const nd = tab.nodes[ni]
              return (
                <button key={ni} role="listitem" className={'bpf-card ' + nd.kind + (hot === ni ? ' lit' : '')} onClick={() => setHot((h) => (h === ni ? null : ni))}>
                  <span className="nd"><Icon name={nd.icon} /></span>
                  <span className="bpf-label">{nd.label}</span>
                  <Icon name="arrow-right" className="bpf-go" />
                </button>
              )
            })}
          </div>
        </React.Fragment>
      ))}
    </div>
  )
}

function SystemBlueprint({ content }: { content: Content }) {
  const [active, setActive] = useState(0)
  // Diagram geometry/icons stay in code; editable prose overlays it by index.
  const tabs = BP_TABS.map((t, i) => ({
    ...t,
    short: content?.blueprintTabs?.[i]?.short || t.short,
    title: content?.blueprintTabs?.[i]?.title || t.title,
    desc: content?.blueprintTabs?.[i]?.desc || t.desc,
  }))
  const tab = tabs[active]
  const manifestoBody2 = content?.manifestoBody2
  return (
    <section className="section" id="blueprint">
      <div className="wrap">
        <div className="section-head reveal" style={{ maxWidth: 760 }}>
          <div className="eyebrow">{content?.blueprintEyebrow || 'The system blueprint'}</div>
          <h2>{content?.blueprintTitle || 'Every layer, engineered to'} <span className="neon-text neon-animated">{content?.blueprintTitleAccent || 'hand off.'}</span></h2>
          <p>{content?.blueprintBody || 'An interactive look at the architecture we ship by default — the application you see, the automation underneath it, and the agentic layer waiting for the day you scale.'}</p>
        </div>
        <div className="bp-grid reveal">
          <div className="bp-manifesto">
            <div className="bp-kicker">{content?.manifestoKicker || 'The Handistack Delivery Manifesto'}</div>
            <h3>{content?.manifestoTitle || 'We build software with the end in mind.'}</h3>
            <p className="bp-lead">{content?.manifestoLead || 'We do not sell abstract AI concepts, generic consulting hours, or bloated enterprise software stacks.'}</p>
            <p className="bp-body">{content?.manifestoBody1 || 'Most software built today is saddled with immediate technical debt — locked behind expensive, fragile cloud subscriptions and rigid code structures that make automation impossible without a total rewrite.'}</p>
            {manifestoBody2 ? (
              <p className="bp-body" dangerouslySetInnerHTML={{ __html: manifestoBody2 }} />
            ) : (
              <p className="bp-body">Every application we deploy uses <strong>modular APIs, local-first data layers, and clean documentation by default</strong>. Whether we are launching an e-commerce platform or a custom internal tool, your infrastructure is delivered <span className="neon-text">natively ready to hand off</span> to autonomous AI workflows the moment you are ready to scale.</p>
            )}
          </div>
          <div className="bp-panel">
            <div className="bp-panel-head">
              <div className="bp-tabs" role="tablist">
                {tabs.map((t, i) => (
                  <button key={t.key} role="tab" aria-selected={active === i} className={'bp-tab' + (active === i ? ' on' : '')} onClick={() => setActive(i)}>
                    <span className="tn">{t.n}</span>{t.short}
                  </button>
                ))}
              </div>
              <span className="bp-livetag"><span className="bp-dot" /> Live data flow</span>
            </div>
            <div className="bp-scroll">
              <BpNodeGraph tab={tab} key={tab.key} />
            </div>
            <BpFlow tab={tab} key={'flow-' + tab.key} />
            <div className="bp-cap">
              <span className="bp-num">{tab.n}</span>
              <div>
                <div className="bp-ct">{tab.title}</div>
                <div className="bp-cd">{tab.desc}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ============================================================ PILLARS */
const PILLARS = [
  { n: '01', icon: 'database', h3: 'Local-first, privacy-conscious data architectures', body: 'We build on fast, localized data layers — structured SQLite configurations and embedded vector stores — that keep operational data on your own infrastructure. Network latency drops, sensitive records never leave the building, and recurring enterprise cloud overhead is cut to zero.', tags: ['SQLite', 'Embedded vectors', 'Zero cloud overhead', 'Low latency'] },
  { n: '02', icon: 'share-2', h3: 'Modular, API-first backends', body: 'Every backend is highly decoupled by design. Clean, modular APIs let your applications communicate instantly with automated orchestration layers and external agents — no brittle integrations, and no rewrite required to connect the next tool.', tags: ['Decoupled services', 'REST + Webhooks', 'Orchestration-ready', 'Agent-addressable'] },
  { n: '03', icon: 'infinity', h3: 'High-ticket custom build to reusable asset', body: 'We engineer custom software today on highly standardized frameworks, so the work compounds. You scale up features later without paying for ground-up development twice — your high-ticket build becomes a durable, reusable asset.', tags: ['Standardized frameworks', 'Compounding value', 'Scale without rewrites'] },
]

function Pillars({ content }: { content: Content }) {
  // Icons/numbers stay in code; editable copy overlays each pillar by index.
  const pillars = PILLARS.map((p, i) => {
    const c = content?.pillars?.[i]
    return {
      ...p,
      h3: c?.h3 || p.h3,
      body: c?.body || p.body,
      tags: c?.tags?.length ? c.tags.map((t: any) => t.value) : p.tags,
    }
  })
  return (
    <section className="section alt" id="architecture">
      <div className="wrap">
        <div className="section-head reveal" style={{ maxWidth: 720 }}>
          <div className="eyebrow">{content?.archEyebrow || 'The architecture'}</div>
          <h2>{content?.archTitle || 'Three pillars behind every build.'}</h2>
          <p>{content?.archBody || 'The engineering principles we apply by default — so the software we ship stays fast, private, and ready to grow with you.'}</p>
        </div>
        <div className="pil-grid">
          {pillars.map((p, i) => (
            <article className="pil-card reveal" key={p.n} style={{ transitionDelay: i * 90 + 'ms' }}>
              <div className="pil-top">
                <span className="pil-num">{p.n}</span>
                <span className="pil-ic"><Icon name={p.icon} /></span>
              </div>
              <h3>{p.h3}</h3>
              <p>{p.body}</p>
              <div className="pil-tags">
                {p.tags.map((t: string) => <span className="pil-tag" key={t}>{t}</span>)}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============================================================ CASE STUDIES */
const CASES: CaseStudy[] = [
  { number: '01', tag: 'Retail · Inventory ops', title: 'Automating custom data pipelines for a retail inventory operation', problem: 'Stock levels were reconciled by hand across a POS system and three supplier feeds. Staff exported spreadsheets nightly, keyed deltas in by morning, and still hit shelf stockouts whenever a supplier changed a SKU mid-week.', architecture: 'A local-first SQLite ingestion layer polls each supplier API on its own schedule. n8n workflows normalize the feeds asynchronously and write reconciled deltas through modular REST endpoints — event-driven, with no nightly batch and no cloud database to rent.', outcome: 'Reconciliation dropped from a multi-hour morning ritual to a continuous background process. Inventory is accurate in near real time, the supplier-SKU drift problem is caught on ingest, and recurring cloud spend is zero.', stack: [{ value: 'SQLite' }, { value: 'n8n' }, { value: 'REST endpoints' }, { value: 'Event-driven' }], metricBig: 'Hours → minutes', metricSub: 'reconciliation cycle' },
  { number: '02', tag: 'Legal · Document retrieval', title: 'Embedded semantic document search for a regional legal practice', problem: 'Thousands of case PDFs lived in nested folders with no real search. Paralegals hunted by filename and memory, and confidentiality rules ruled out shipping client documents to a third-party cloud index.', architecture: "An embedded vector store runs on the firm's own hardware, with a local LLM generating semantic queries against it. An API-first retrieval service exposes search to the existing case tools — every byte of privileged data stays on premises.", outcome: 'Sub-second semantic retrieval across the full archive, by meaning rather than filename. No documents leave the building, the privacy posture satisfies counsel, and the index scales as new matters are added.', stack: [{ value: 'Embedded vectors' }, { value: 'Local LLM' }, { value: 'On-prem' }, { value: 'API-first' }], metricBig: '0 documents', metricSub: 'leave the premises' },
  { number: '03', tag: 'Field service · Orchestration', title: 'Orchestrating quote-to-dispatch for a field service company', problem: 'CRM, scheduling, and invoicing were three disconnected tools. Every job was entered three times, dispatch waited on manual handoffs, and adding any new tool meant another island of double entry.', architecture: 'A modular, API-first backend sits between the existing tools and orchestrates the flow asynchronously: a quote approval fires scheduling, which fires dispatch and invoicing. Endpoints are agent-addressable, so future automation plugs in without a rewrite.', outcome: 'Quote-to-dispatch collapsed to a single triggered flow with no double entry. The company added two new tools later by wiring endpoints — not rebuilding — turning a custom build into a reusable, scalable asset.', stack: [{ value: 'Decoupled services' }, { value: 'Async orchestration' }, { value: 'Agent-addressable' }], metricBig: '3 entries → 1', metricSub: 'quote-to-dispatch' },
]

function CaseStudies({ cases, content }: { cases: CaseStudy[]; content: Content }) {
  const list = cases && cases.length ? cases : CASES
  return (
    <section className="section" id="cases">
      <div className="wrap">
        <div className="section-head reveal" style={{ maxWidth: 720 }}>
          <div className="eyebrow">{content?.casesEyebrow || 'Proof of concept'}</div>
          <h2>{content?.casesTitle || 'How the architecture holds up in production.'}</h2>
          <p>{content?.casesBody || 'Representative builds, told through their technical mechanics — the exact problems we solve and the systems we ship to solve them.'}</p>
        </div>
        <div className="cs-list">
          {list.map((c, idx) => (
            <article className="cs-block reveal" key={c.number || idx}>
              <header className="cs-head">
                <span className="cs-num">{c.number || String(idx + 1).padStart(2, '0')}</span>
                <div className="cs-headtext">
                  <div className="cs-tag">{c.tag}</div>
                  <h3>{c.title}</h3>
                </div>
                <div className="cs-metric">
                  <span className="cs-metric-big">{c.metricBig}</span>
                  <span className="cs-metric-sub">{c.metricSub}</span>
                </div>
              </header>
              <div className="cs-body">
                <div className="cs-col">
                  <div className="cs-label"><span className="cs-step">P</span> The operational problem</div>
                  <p>{c.problem}</p>
                </div>
                <div className="cs-col">
                  <div className="cs-label"><span className="cs-step">A</span> The Handistack architecture</div>
                  <p>{c.architecture}</p>
                  <div className="cs-stack">
                    {(c.stack || []).map((s) => <span className="cs-chip" key={s.value}>{s.value}</span>)}
                  </div>
                </div>
                <div className="cs-col cs-col-out">
                  <div className="cs-label"><span className="cs-step">O</span> The system outcome</div>
                  <p>{c.outcome}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============================================================ METRICS */
function CountUp({ to, suffix = '', dur = 1400 }: { to: number; suffix?: string; dur?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [val, setVal] = useState(0)
  const [done, setDone] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !done) {
          setDone(true)
          const start = performance.now()
          const tick = (now: number) => {
            const p = Math.min((now - start) / dur, 1)
            const eased = 1 - Math.pow(1 - p, 3)
            setVal(Math.round(eased * to))
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      })
    }, { threshold: 0.4 })
    if (ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [to, dur, done])
  return <span ref={ref}>{val}{suffix}</span>
}

function Metrics({ content }: { content: Content }) {
  const stats: [number, string, string][] =
    content?.metrics?.length
      ? content.metrics.map((m: any) => [m.value, m.suffix || '', m.label])
      : [
          [3, ' hrs', 'back per day, per owner — off the phone and onto the work'],
          [40, '%', 'faster lead intake from first ring to booked job'],
          [98, '%', 'of after-hours calls answered and qualified'],
          [12, ' days', 'average time from teardown to a live, running stack'],
        ]
  return (
    <section className="section ink" id="results">
      <div className="wrap">
        <div className="section-head reveal">
          <div className="eyebrow" style={{ color: 'var(--neon-gold)' }}>{content?.resultsEyebrow || 'Results'}</div>
          <h2>{content?.resultsTitle || 'The bottleneck math.'}</h2>
          <p>{content?.resultsBody || 'What clearing the pile-up actually returns to a service-trade business.'}</p>
        </div>
        <div className="metrics">
          {stats.map(([n, suf, lab], i) => (
            <div className="metric reveal" key={i} style={{ transitionDelay: i * 80 + 'ms' }}>
              <div className="num g"><CountUp to={n} suffix={suf} /></div>
              <div className="lab">{lab}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============================================================ FAQ */
const FAQS_DEFAULT = [
  { q: 'What is the benefit of a local-first software architecture for business operations?', a: 'Local-first data structures provide immense data privacy, virtually zero latency, and remove the costly subscription overhead of massive cloud platforms — making your software naturally ready for local AI orchestration models.' },
  { q: 'How does Handistack transition a standard web application into an automated system?', a: 'We build all standard software with clean, standardized API endpoints and modular schemas, allowing autonomous workflows to securely interface with your data layer down the line without needing a complete system rewrite.' },
  { q: 'Can Handistack integrate autonomous AI agents into our existing legacy systems, or do we need a complete system overhaul?', a: 'We specialize in building custom API-driven middleware that allows modern autonomous orchestration loops to communicate with your legacy infrastructure. If a complete rewrite isn\'t viable, we isolate your legacy data, map its endpoints, and build a clean, automation-ready layer over it so agents can safely read and write data without breaking your existing operations.' },
  { q: 'How does building "automation-ready" software affect the upfront development timeline and cost?', a: "It doesn't extend your timeline. By using Handistack's standardized, modular development frameworks, we write code that is clean, decoupled, and self-documenting from day one. You receive premium custom software at standard development speed, but with zero technical debt baked into the backend architecture." },
  { q: 'What specific automation platforms does Handistack optimize its software backends for?', a: 'Our architectures are fully optimized to interface with advanced, event-driven orchestration platforms—specifically self-hosted n8n workflows and custom multi-agent frameworks. Every data layer we build features clean webhook capabilities and structured JSON endpoints, making it simple to deploy automated processing tasks that require no human intervention.' },
  { q: 'How do you guarantee data privacy when plugging AI features into our custom business software?', a: 'We strictly implement local-first principles. Whenever possible, your data processing is routed through localized, open-source LLMs running inside your own private virtual environments, or managed via highly secure, isolated API endpoints with zero-data-retention compliance policies. Your proprietary operational metrics are never used to train public commercial models.' },
]

function FAQ({ content }: { content: Content }) {
  const faqs = content?.faqs?.length ? content.faqs : FAQS_DEFAULT
  const [open, setOpen] = useState<number | null>(0)
  // FAQ items toggle their own className on click, which makes React rewrite the
  // attribute and strip the `.in` class the global scroll-observer added
  // imperatively — the item would fade back out. Own the reveal in React state so
  // `in` is part of the className React controls and survives every re-render.
  const [revealed, setRevealed] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRevealed(true)
          io.disconnect()
        }
      },
      { threshold: 0.12 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    const id = 'handistack-faq-jsonld'
    if (document.getElementById(id)) return
    const data = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f: any) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    }
    const s = document.createElement('script')
    s.type = 'application/ld+json'
    s.id = id
    s.textContent = JSON.stringify(data)
    document.head.appendChild(s)
  }, [faqs])
  return (
    <section className="section" id="faq">
      <div className="wrap">
        <div className="section-head reveal" style={{ maxWidth: 720 }}>
          <div className="eyebrow">{content?.faqEyebrow || 'Technical FAQ'}</div>
          <h2>{content?.faqTitle || 'Straight answers, for humans and machines.'}</h2>
          <p>{content?.faqBody || 'The questions we hear most, answered directly — and structured so search and answer engines can read them too.'}</p>
        </div>
        <div className="faq-list" ref={listRef} itemScope itemType="https://schema.org/FAQPage">
          {faqs.map((f: any, i: number) => {
            const isOpen = open === i
            return (
              <article className={'faq-item reveal' + (revealed ? ' in' : '') + (isOpen ? ' open' : '')} key={i} style={{ transitionDelay: i * 80 + 'ms' }} itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                <button type="button" className="faq-q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                  <span className="faq-mark faq-mark-q">Q</span>
                  <h3 itemProp="name">{f.q}</h3>
                  <span className="faq-chev"><Icon name="chevron-down" /></span>
                </button>
                <div className="faq-a-wrap" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                  <div className="faq-a-inner">
                    <div className="faq-a">
                      <span className="faq-mark faq-mark-a">A</span>
                      <p itemProp="text">{f.a}</p>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ============================================================ CTA */
function CTA({ onBook, content }: { onBook: () => void; content: Content }) {
  return (
    <section className="section">
      <div className="wrap">
        <div className="ctaband reveal">
          <h2>{content?.ctaTitle || 'Find your biggest bottleneck in 30 minutes.'}</h2>
          <p>{content?.ctaBody || "Free teardown call. We'll show you exactly where AI pays for itself in your shop — no pitch deck."}</p>
          <button className="btn btn-neon btn-lg" onClick={onBook}>
            {content?.ctaButton || 'Book a teardown'} <Icon name="arrow-right" />
          </button>
        </div>
      </div>
    </section>
  )
}

/* ============================================================ FOOTER */
function Footer({ content }: { content: Content }) {
  const email = content?.contactEmail || 'hello@handistack.com'
  const tagline = content?.footerTagline || 'We build software with the end in mind — local-first, API-first, and natively ready to hand off to autonomous AI workflows the moment you scale.'
  const cols: [string, [string, string][]][] = [
    ['Explore', [['System blueprint', '#blueprint'], ['Architecture', '#architecture'], ['Case studies', '#cases'], ['Results', '#results'], ['Technical FAQ', '#faq']]],
    ['Capabilities', [['Local-first data layers', '#architecture'], ['Modular API-first backends', '#architecture'], ['Automation engineering', '#blueprint'], ['Agentic-ready builds', '#blueprint']]],
    ['Get started', [['Book a teardown', '#book'], ['Proof of concept', '#cases'], [email, `mailto:${email}`]]],
  ]
  const socials: [string, string, string][] = [['LinkedIn', 'at-sign', '#'], ['GitHub', 'terminal', '#'], ['Email', 'mail', `mailto:${email}`]]
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <a className="nav-logo" href="#top" style={{ color: '#fff', marginBottom: 16 }}>
              <img src={MARK} alt="" style={{ height: 32, width: 32 }} />
              <span>Handistack</span>
            </a>
            <p style={{ fontSize: 14.5, lineHeight: 1.6, maxWidth: 290, color: 'var(--fg-on-dark-2)' }}>{tagline}</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              {socials.map(([label, icon, href]) => (
                <a key={label} href={href} aria-label={label} style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={icon} />
                </a>
              ))}
            </div>
          </div>
          {cols.map(([h, links]) => (
            <div key={h}>
              <h4>{h}</h4>
              {links.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
            </div>
          ))}
        </div>
        <div className="footer-bot">
          <span>{content?.footerCopyright || '© 2026 Handistack — AI Consulting. All rights reserved.'}</span>
          <span style={{ display: 'flex', gap: 20 }}>
            <a href="/privacy" style={{ display: 'inline' }}>Privacy</a>
            <a href="/terms" style={{ display: 'inline' }}>Terms</a>
          </span>
        </div>
      </div>
    </footer>
  )
}

/* ============================================================ APP */
export default function Site({ content, caseStudies }: { content: Content; caseStudies: CaseStudy[] }) {
  useReveal()
  const open = () => {
    const el = document.getElementById('book')
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' })
  }
  return (
    <>
      <Nav onBook={open} content={content} />
      <Hero onBook={open} content={content} />
      <SystemBlueprint content={content} />
      <Pillars content={content} />
      <CaseStudies cases={caseStudies} content={content} />
      <Metrics content={content} />
      <Booking content={content} />
      <FAQ content={content} />
      <CTA onBook={open} content={content} />
      <Footer content={content} />
    </>
  )
}
