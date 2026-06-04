'use client'

// Frontend error boundary — prevents an unexpected client error from blanking the
// whole page. Logs to the console and offers a recovery action.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  if (typeof window !== 'undefined') console.error('Frontend error boundary:', error)
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center' }}>
      <h2 style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Something went wrong.</h2>
      <p style={{ color: '#5b5f66', maxWidth: 420 }}>An unexpected error occurred. Please try again — if it keeps happening, email hello@handistack.com.</p>
      <button className="btn btn-neon" onClick={() => reset()}>Try again</button>
    </div>
  )
}
