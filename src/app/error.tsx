'use client'

import { useEffect } from 'react'
import { reportError } from '@/components/ErrorReporter'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error boundary caught:', error)
    reportError({
      type: 'errorboundary',
      message: error.message,
      stack: error.stack,
      digest: error.digest,
    })
  }, [error])

  return (
    <div className="min-h-screen bg-midnight-ink flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center">
        <div
          lang="en"
          className="font-serif-display text-2xl text-candlelight-gold mb-3"
        >
          Something went wrong
        </div>
        <p className="text-text-secondary text-sm mb-6">
          Алдаа гарлаа. Хуудсыг дахин ачаална уу.
        </p>
        <button
          onClick={reset}
          className="bg-candlelight-gold text-midnight-ink font-medium px-5 py-2.5 rounded-lg hover:bg-candlelight-gold-light transition min-h-[44px]"
        >
          Дахин оролдох
        </button>
        {error.digest && (
          <p className="text-text-muted text-xs mt-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
