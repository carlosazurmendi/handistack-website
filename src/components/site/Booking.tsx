'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Icon } from './ui'

/* eslint-disable @typescript-eslint/no-explicit-any */
const GCAL_BOOKING_URL = process.env.NEXT_PUBLIC_GOOGLE_BOOKING_URL || 'https://calendar.app.google/z6AfmxQy9sCRz7tx5'
const TIMELINES = ['ASAP · 0–30 days', 'This quarter', '3–6 months', 'Exploring']
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

type Slot = { start: string; end: string; label: string }
type DayAvail = { date: string; slots: Slot[] }
type Phase = 'triage' | 'researching' | 'schedule' | 'thanks' | 'done' | 'error'

function dOnly(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()) }
function keyOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function Booking({ content }: { content: any }) {
  const today = dOnly(new Date())

  const [phase, setPhase] = useState<Phase>('triage')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [domain, setDomain] = useState('')
  const [bottleneck, setBottleneck] = useState('')
  const [timeline, setTimeline] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)

  const [leadId, setLeadId] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [unqualMsg, setUnqualMsg] = useState<string>(content?.unqualifiedMessage || "Thanks for reaching out! We'll contact you regarding your request soon.")

  const [avail, setAvail] = useState<Record<string, Slot[]>>({})
  const [tz, setTz] = useState('America/New_York')
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selDate, setSelDate] = useState<Date | null>(null)
  const [slot, setSlot] = useState<Slot | null>(null)
  const [confirmedMeet, setConfirmedMeet] = useState<{ meetLink: string | null; label: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const triageValid = name.trim().length > 1 && emailOk && domain.trim().length > 2 && bottleneck.trim().length > 4 && !!timeline && consent

  /* ---- Step 1: submit triage, forward to n8n ---- */
  async function submitTriage() {
    setBusy(true)
    setSubmitError(null)
    try {
      const res = await fetch('/book/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, domain, bottleneck, timeline }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSubmitError(data?.error || 'Something went wrong. Please try again.')
        setBusy(false)
        return
      }
      setLeadId(String(data.leadId))
      setPhase('researching')
    } catch {
      setSubmitError('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  /* ---- Poll the qualification verdict ---- */
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (phase !== 'researching' || !leadId) return
    let attempts = 0
    const MAX = 50 // ~2.5 min at 3s
    pollRef.current = setInterval(async () => {
      attempts++
      try {
        const res = await fetch(`/book/lead/${leadId}`, { cache: 'no-store' })
        const data = await res.json()
        if (data.status === 'qualified') {
          clearInterval(pollRef.current!)
          await loadAvailability()
          setPhase('schedule')
        } else if (data.status === 'unqualified') {
          clearInterval(pollRef.current!)
          if (data.unqualifiedMessage) setUnqualMsg(data.unqualifiedMessage)
          setPhase('thanks')
        } else if (data.status === 'error') {
          clearInterval(pollRef.current!)
          setPhase('error')
        }
      } catch {
        /* keep polling */
      }
      if (attempts >= MAX) {
        clearInterval(pollRef.current!)
        // Research is taking long — treat as a soft "we'll reach out".
        setPhase('thanks')
      }
    }, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [phase, leadId])

  /* ---- Load live availability for the calendar ---- */
  async function loadAvailability() {
    try {
      const res = await fetch('/book/availability', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok && data.days) {
        const map: Record<string, Slot[]> = {}
        ;(data.days as DayAvail[]).forEach((d) => { map[d.date] = d.slots })
        setAvail(map)
        if (data.timezone) setTz(data.timezone)
        // Auto-select first open day.
        const firstOpen = (data.days as DayAvail[]).find((d) => d.slots.length > 0)
        if (firstOpen) {
          const [y, m, dd] = firstOpen.date.split('-').map(Number)
          const d = new Date(y, m - 1, dd)
          setSelDate(d)
          setView(new Date(y, m - 1, 1))
        }
      }
    } catch { /* leave empty */ }
  }

  /* ---- Calendar grid ---- */
  function buildCells() {
    const first = new Date(view.getFullYear(), view.getMonth(), 1)
    const start = first.getDay()
    const cells = []
    for (let i = 0; i < 42; i++) {
      const date = new Date(view.getFullYear(), view.getMonth(), 1 - start + i)
      const k = keyOf(date)
      const open = date.getMonth() === view.getMonth() && (avail[k]?.length || 0) > 0
      cells.push({ date, inMonth: date.getMonth() === view.getMonth(), isToday: +dOnly(date) === +today, open })
    }
    return cells
  }
  function shiftMonth(n: number) {
    const next = new Date(view.getFullYear(), view.getMonth() + n, 1)
    setView(next)
    setSlot(null)
  }
  const atFirstMonth = view.getFullYear() === today.getFullYear() && view.getMonth() === today.getMonth()
  const cells = buildCells()
  const slots = selDate ? avail[keyOf(selDate)] || [] : []
  const longDate = selDate && selDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  /* ---- Confirm booking ---- */
  async function confirm() {
    if (!slot || !leadId) return
    setBusy(true)
    setSubmitError(null)
    try {
      const res = await fetch('/book/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, startISO: slot.start, endISO: slot.end, label: slot.label }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSubmitError(data?.error || 'Could not book that slot. Try another.')
        if (res.status === 409) await loadAvailability()
        setBusy(false)
        return
      }
      setConfirmedMeet({ meetLink: data.meetLink, label: slot.label })
      setPhase('done')
    } catch {
      setSubmitError('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  function restart() {
    setPhase('triage'); setSlot(null); setSelDate(null); setLeadId(null)
    setConfirmedMeet(null); setSubmitError(null)
  }

  return (
    <section className="section" id="book">
      <div className="wrap">
        <div className="section-head reveal" style={{ maxWidth: 720 }}>
          <div className="eyebrow">{content?.bookingEyebrow || 'Book a teardown'}</div>
          <h2>{content?.bookingTitle || 'Real-time qualification calendar.'}</h2>
          <p>{content?.bookingBody || 'Answer three quick questions, then grab a live slot. Your answers brief our automated qualification assistant so the call starts already pointed at your bottleneck.'}</p>
        </div>

        <div className="cal-shell reveal">
          {/* Pane 1: meeting summary */}
          <aside className="cal-aside">
            <div className="cal-brand">
              <img src="/handistack-mark.png" alt="Handistack" className="cal-mark" />
              <span>Handistack</span>
            </div>
            <h3 className="cal-mtitle">AI Qualification Teardown</h3>
            <div className="cal-meta">
              <span className="cal-pill"><Icon name="clock" /> 30 min</span>
              <span className="cal-pill"><Icon name="video" /> Google Meet</span>
            </div>
            <p className="cal-desc">A focused working session: we pressure-test your single biggest operational bottleneck and sketch the architecture that clears it.</p>
            <ul className="cal-expect">
              <li><Icon name="check" /> Live teardown of your bottleneck</li>
              <li><Icon name="check" /> Local-first architecture options</li>
              <li><Icon name="check" /> Rough build scope &amp; timeline</li>
            </ul>
            {(phase === 'schedule' || phase === 'done') && selDate && (
              <div className="cal-summary">
                <div className="cal-sum-row"><Icon name="calendar" /> {longDate}{slot ? `, ${slot.label}` : ''}</div>
                <div className="cal-sum-row"><Icon name="globe" /> {tz.replace(/_/g, ' ')}</div>
              </div>
            )}
            <div className="cal-gsync"><span className="cal-gsync-dot" /> Synced from Google Calendar</div>
          </aside>

          {/* Panes 2/3: the flow */}
          <div className="cal-main">
            {phase === 'triage' && (
              <div className="cal-pane">
                <div className="cal-stepline"><span className="cal-step-n">Step 1 of 2</span> Qualification</div>
                <div className="cal-row2">
                  <div className="cal-field">
                    <label className="cal-fl">Your name</label>
                    <input className="field" placeholder="Jordan Rivera" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="cal-field">
                    <label className="cal-fl">Work email</label>
                    <input className="field" type="email" placeholder="jordan@yourcompany.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
                <label className="cal-fl">Phone number <span className="cal-opt">optional</span></label>
                <input className="field" type="tel" placeholder="(555) 010-1234" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <label className="cal-fl">What is your current company website domain?</label>
                <div className="cal-domain">
                  <span className="cal-domain-pre">https://</span>
                  <input className="field cal-domain-in" placeholder="yourcompany.com" value={domain} onChange={(e) => setDomain(e.target.value)} />
                </div>
                <label className="cal-fl">What's the single biggest operational bottleneck or manual process slowing your company down right now?</label>
                <textarea className="field cal-area" rows={3} placeholder="e.g. We reconcile inventory by hand across our POS and three supplier feeds every morning…" value={bottleneck} onChange={(e) => setBottleneck(e.target.value)} />
                <label className="cal-fl">What's your projected timeline for deploying automated infrastructure?</label>
                <div className="cal-chips">
                  {TIMELINES.map((t) => (
                    <button key={t} className={'cal-chip' + (timeline === t ? ' sel' : '')} onClick={() => setTimeline(t)}>{t}</button>
                  ))}
                </div>
                <div className="cal-bot"><Icon name="bot" /> Your answers route to our automated qualification assistant to verify your fit before your slot is confirmed.</div>
                <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '2px 0', fontSize: 13.5, lineHeight: 1.5, color: 'var(--fg-2)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required aria-required="true" style={{ marginTop: 3, width: 16, height: 16, flex: '0 0 auto', accentColor: 'var(--neon-blue)', cursor: 'pointer' }} />
                  <span>I agree to be contacted by Handistack about my request and to receive related communications. See our <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--neon-blue)', textDecoration: 'none' }}>Privacy Policy</a>.</span>
                </label>
                {submitError && <div className="cal-bot" style={{ color: 'var(--danger, #F0392B)' }}><Icon name="alert-triangle" /> {submitError}</div>}
                <button className="btn btn-neon cal-cta" disabled={!triageValid || busy} onClick={submitTriage}>
                  {busy ? 'Submitting…' : 'Continue'} <Icon name="arrow-right" />
                </button>
              </div>
            )}

            {phase === 'researching' && (
              <div className="cal-pane cal-donepane">
                <div className="success-ring" style={{ animation: 'spin 1.4s linear infinite' }}><Icon name="loader" /></div>
                <h3 className="cal-done-h">Researching your company…</h3>
                <p className="cal-done-p">Our automated qualification assistant is reviewing <strong>{domain}</strong> and your bottleneck. This takes a few moments — hang tight.</p>
                <div className="cal-bot"><Icon name="bot" /> Verifying fit before we open the calendar.</div>
              </div>
            )}

            {phase === 'schedule' && (
              <div className="cal-pane">
                <div className="cal-stepline">
                  <span className="cal-step-n">Step 2 of 2</span> Pick a time
                </div>
                <div className="cal-sched">
                  <div className="cal-cal">
                    <div className="cal-cal-head">
                      <strong>{MONTHS[view.getMonth()]} {view.getFullYear()}</strong>
                      <div className="cal-nav">
                        <button onClick={() => shiftMonth(-1)} disabled={atFirstMonth} aria-label="Previous month"><Icon name="chevron-left" /></button>
                        <button onClick={() => shiftMonth(1)} aria-label="Next month"><Icon name="chevron-right" /></button>
                      </div>
                    </div>
                    <div className="cal-dow">{DOW.map((d) => <span key={d}>{d[0]}</span>)}</div>
                    <div className="cal-grid">
                      {cells.map((c, i) => {
                        const sel = selDate && +dOnly(c.date) === +dOnly(selDate)
                        const cls = 'cal-day' + (!c.inMonth ? ' out' : '') + (c.open ? ' open' : ' closed') + (sel ? ' sel' : '') + (c.isToday ? ' today' : '')
                        return (
                          <button key={i} className={cls} disabled={!c.open} onClick={() => { setSelDate(c.date); setSlot(null) }}>
                            {c.date.getDate()}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div className="cal-slots">
                    <div className="cal-tz"><Icon name="globe" /> {tz.replace(/_/g, ' ')}</div>
                    <div className="cal-slot-scroll">
                      {slots.length ? slots.map((s) => (
                        <button key={s.start} className={'cal-slot' + (slot?.start === s.start ? ' sel' : '')} onClick={() => setSlot(s)}>{s.label}</button>
                      )) : <div className="cal-noslot">No open times — try another day.</div>}
                    </div>
                  </div>
                </div>
                {submitError && <div className="cal-bot" style={{ color: 'var(--danger, #F0392B)' }}><Icon name="alert-triangle" /> {submitError}</div>}
                <button className="btn btn-neon cal-cta" disabled={!slot || busy} onClick={confirm}>
                  {busy ? 'Booking…' : `Confirm ${slot ? `· ${slot.label}` : 'your slot'}`} <Icon name="arrow-right" />
                </button>
              </div>
            )}

            {phase === 'thanks' && (
              <div className="cal-pane cal-donepane">
                <div className="success-ring"><Icon name="mail-check" /></div>
                <h3 className="cal-done-h">Thanks for reaching out!</h3>
                <p className="cal-done-p">{unqualMsg}</p>
                <button className="cal-restart" onClick={restart}>Submit another request</button>
              </div>
            )}

            {phase === 'done' && (
              <div className="cal-pane cal-donepane">
                <div className="success-ring"><Icon name="check" /></div>
                <h3 className="cal-done-h">Your teardown is booked.</h3>
                <p className="cal-done-p">We've reserved <strong>{longDate}, {confirmedMeet?.label}</strong>. A Google Calendar invite with the Google Meet link is on its way to <strong>{email}</strong>.</p>
                {confirmedMeet?.meetLink && (
                  <a className="btn btn-neon cal-cta" href={confirmedMeet.meetLink} target="_blank" rel="noopener noreferrer">
                    <Icon name="video" /> Join with Google Meet
                  </a>
                )}
                <a className="btn btn-border cal-cta" href={GCAL_BOOKING_URL} target="_blank" rel="noopener noreferrer" style={{ marginTop: 10 }}>
                  <Icon name="calendar-plus" /> View booking calendar
                </a>
                <button className="cal-restart" onClick={restart}>Book another time</button>
              </div>
            )}

            {phase === 'error' && (
              <div className="cal-pane cal-donepane">
                <div className="success-ring"><Icon name="alert-triangle" /></div>
                <h3 className="cal-done-h">Something went sideways.</h3>
                <p className="cal-done-p">We couldn't reach our qualification service just now. Please try again in a moment — or email us and we'll sort it out.</p>
                <button className="cal-restart" onClick={restart}>Try again</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
