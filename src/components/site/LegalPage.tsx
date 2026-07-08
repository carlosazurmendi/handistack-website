import React from 'react'

// Shared shell for the static legal pages (Privacy, Terms). Server component —
// inherits the frontend layout's fonts/CSS variables and adds a scoped prose
// stylesheet so the long-form copy stays readable and on-brand.
const MARK = '/handistack-mark.png'

const css = `
.legal-wrap{max-width:820px;margin:0 auto;padding:0 32px}
.legal-top{border-bottom:1px solid var(--border);padding:22px 0}
.legal-logo{display:flex;align-items:center;gap:11px;font-family:var(--font-display);font-weight:600;font-size:20px;letter-spacing:.02em;color:var(--fg-1);text-decoration:none}
.legal-logo img{height:32px;width:32px}
.legal-main{padding:56px 0 72px}
.legal-eyebrow{font-family:var(--font-mono);font-size:13px;letter-spacing:.18em;text-transform:uppercase;font-weight:500;color:var(--fg-3)}
.legal-main h1{font-family:var(--font-display);font-size:clamp(34px,4.4vw,52px);line-height:1.05;letter-spacing:-.025em;font-weight:600;margin:14px 0 10px}
.legal-updated{font-family:var(--font-mono);font-size:13px;color:var(--fg-3);margin-bottom:40px}
.legal-body{color:var(--fg-2);font-size:16px;line-height:1.7}
.legal-body h2{font-family:var(--font-display);font-size:24px;font-weight:600;letter-spacing:-.01em;color:var(--fg-1);margin:40px 0 12px}
.legal-body h3{font-family:var(--font-display);font-size:18px;font-weight:600;color:var(--fg-1);margin:26px 0 8px}
.legal-body p{margin:0 0 14px}
.legal-body ul{margin:0 0 14px;padding-left:22px}
.legal-body li{margin:0 0 8px}
.legal-body a{color:var(--neon-blue);text-decoration:none}
.legal-body a:hover{text-decoration:underline}
.legal-body strong{color:var(--fg-1);font-weight:600}
.legal-foot{border-top:1px solid var(--border);padding:26px 0;display:flex;flex-wrap:wrap;gap:8px 22px;align-items:center;justify-content:space-between}
.legal-foot span{font-size:13.5px;color:var(--fg-3)}
.legal-foot nav{display:flex;gap:20px}
.legal-foot a{font-size:13.5px;color:var(--fg-2);text-decoration:none}
.legal-foot a:hover{color:var(--fg-1)}
@media (max-width:560px){.legal-main{padding:40px 0 56px}}
`

export function LegalPage({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string
  title: string
  updated: string
  children: React.ReactNode
}) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <header className="legal-top">
        <div className="legal-wrap">
          <a className="legal-logo" href="/">
            <img src={MARK} alt="Handistack" />
            <span>Handistack</span>
          </a>
        </div>
      </header>
      <main className="legal-main">
        <div className="legal-wrap">
          <div className="legal-eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
          <div className="legal-updated">Last updated: {updated}</div>
          <div className="legal-body">{children}</div>
        </div>
      </main>
      <footer className="legal-foot">
        <div className="legal-wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 22px', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span>© 2026 Handistack — AI Consulting. All rights reserved.</span>
          <nav>
            <a href="/">Home</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
          </nav>
        </div>
      </footer>
    </>
  )
}
