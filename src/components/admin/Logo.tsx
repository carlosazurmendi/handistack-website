import React from 'react'

// Login-screen lockup (admin.components.graphics.Logo). Built as the colorful
// mark + a CSS wordmark (not the baked-text PNG) so it stays legible in BOTH
// light and dark admin themes — the wordmark uses --theme-elevation-800, which
// is ink in light mode and near-white in dark mode.
export const Logo: React.FC = () => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
    <img src="/handistack-mark.png" alt="" style={{ height: 44, width: 'auto', objectFit: 'contain' }} />
    <span
      style={{
        fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
        fontWeight: 600,
        fontSize: 28,
        letterSpacing: '0.01em',
        color: 'var(--theme-elevation-800)',
      }}
    >
      Handistack
    </span>
  </span>
)

export default Logo
