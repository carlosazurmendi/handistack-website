'use client'
import React, { useEffect, useRef } from 'react'

// Lucide icon helper — loads the global lucide UMD (injected in the layout) and
// renders one icon. Retries until the CDN script is present so SSR/hydration
// timing never leaves a blank.
export function Icon({
  name,
  className = 'ic',
  strokeWidth = 1.75,
}: {
  name: string
  className?: string
  strokeWidth?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const w = window as unknown as { lucide?: { createIcons: (o: unknown) => void } }
    const render = () => {
      if (!ref.current || !w.lucide) return false
      ref.current.innerHTML = ''
      const el = document.createElement('i')
      el.setAttribute('data-lucide', name)
      ref.current.appendChild(el)
      w.lucide.createIcons({ attrs: { 'stroke-width': strokeWidth, class: className }, nameAttr: 'data-lucide' })
      return true
    }
    if (render()) return
    const t = setInterval(() => {
      if (render()) clearInterval(t)
    }, 120)
    return () => clearInterval(t)
  }, [name, strokeWidth, className])
  return <span ref={ref} className="ic-host" style={{ display: 'inline-flex' }} />
}

// Scroll-reveal — adds `.in` to `.reveal` elements as they enter the viewport.
export function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('in') }),
      { threshold: 0.12 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  })
}
