'use client'

import { useEffect } from 'react'

const REPORT_ENDPOINT = '/api/log/error'

const recentReports = new Set<string>()
const REPORT_COOLDOWN_MS = 60_000

function reportError(payload: {
  type: 'window.onerror' | 'unhandledrejection' | 'errorboundary'
  message: string
  stack?: string
  digest?: string
}) {
  const key = `${payload.type}::${payload.message}::${payload.stack ?? ''}`.slice(0, 500)
  if (recentReports.has(key)) return
  recentReports.add(key)
  setTimeout(() => recentReports.delete(key), REPORT_COOLDOWN_MS)

  const body = {
    ...payload,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  }

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(body)], { type: 'application/json' })
      navigator.sendBeacon(REPORT_ENDPOINT, blob)
    } else {
      fetch(REPORT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    // Silent fail — never throw from error reporter
  }
}

export function ErrorReporter() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      reportError({
        type: 'window.onerror',
        message: event.message || 'Unknown error',
        stack: event.error?.stack,
      })
    }

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      reportError({
        type: 'unhandledrejection',
        message: reason instanceof Error ? reason.message : String(reason).slice(0, 500),
        stack: reason instanceof Error ? reason.stack : undefined,
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  return null
}

export { reportError }
