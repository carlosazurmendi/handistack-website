'use client'
import React from 'react'
import { useTheme } from '@payloadcms/ui'

// Segmented light/dark switch rendered in the admin header's top-right actions
// slot (admin.components.actions), next to the account menu. Uses Payload's own
// useTheme() so the choice persists via the payload-theme cookie and flips the
// html[data-theme] attribute the reskin keys off of.
const SunIcon: React.FC = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
)

const MoonIcon: React.FC = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="hs-theme-toggle" role="group" aria-label="Color theme">
      <button
        type="button"
        className="hs-theme-toggle__btn"
        data-active={!isDark}
        aria-pressed={!isDark}
        aria-label="Light mode"
        title="Light mode"
        onClick={() => setTheme('light')}
      >
        <SunIcon />
      </button>
      <button
        type="button"
        className="hs-theme-toggle__btn"
        data-active={isDark}
        aria-pressed={isDark}
        aria-label="Dark mode"
        title="Dark mode"
        onClick={() => setTheme('dark')}
      >
        <MoonIcon />
      </button>
    </div>
  )
}

export default ThemeToggle
