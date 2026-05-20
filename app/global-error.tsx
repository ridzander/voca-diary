'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#fffbfe', color: '#1c1b1f', display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div style={{ maxWidth: 360, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#49454f', marginBottom: 8 }}>Something went wrong</p>
          <p style={{ fontSize: 12, color: '#6e6e73', marginBottom: 24, wordBreak: 'break-word' }}>{error.message}</p>
          <button
            onClick={reset}
            style={{ background: '#00696b', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
