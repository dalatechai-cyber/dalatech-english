'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { loadStreak } from '@/lib/streak'
import { getStreak } from '@/lib/supabase/streak'
import { createClient } from '@/lib/supabase/client'
import { t } from '@/lib/i18n'
import { StreakFlame } from './StreakFlame'

interface NavBarProps {
  levelCode?: string
  lessonId?: number
  lessonTitle?: string
}

const COUNT_UP_MS = 600
const FLAME_PULSE_MS = 600

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function NavBar({ levelCode, lessonId, lessonTitle }: NavBarProps) {
  const [streak, setStreak] = useState(0)
  const [displayedStreak, setDisplayedStreak] = useState(0)
  const [absorbing, setAbsorbing] = useState(false)
  const [pulsing, setPulsing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const prevStreakRef = useRef(0)
  const absorbTimerRef = useRef<number | null>(null)
  const pulseTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let userId: string | null = null

    const refresh = async () => {
      if (userId) {
        try {
          const row = await getStreak(userId)
          setStreak(row.current_streak)
          return
        } catch {
          // fall through to local
        }
      }
      const data = loadStreak()
      setStreak(data.current)
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      userId = user?.id ?? null
      refresh()
    })

    const handleStreakUpdate = () => refresh()
    window.addEventListener('streak:updated', handleStreakUpdate)

    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === 'core-streak-current' ||
        e.key === 'core-streak-longest' ||
        e.key === 'core-streak-last-date'
      ) {
        refresh()
      }
    }
    window.addEventListener('storage', handleStorage)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    const handleArriving = () => {
      if (absorbTimerRef.current) {
        window.clearTimeout(absorbTimerRef.current)
      }
      // Toggle off then back on so a second arrival within the same animation window restarts cleanly.
      setAbsorbing(false)
      requestAnimationFrame(() => {
        setAbsorbing(true)
        absorbTimerRef.current = window.setTimeout(() => {
          setAbsorbing(false)
          absorbTimerRef.current = null
        }, 540)
      })
    }
    window.addEventListener('streak:flame-arriving', handleArriving)

    return () => {
      window.removeEventListener('streak:updated', handleStreakUpdate)
      window.removeEventListener('storage', handleStorage)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('streak:flame-arriving', handleArriving)
      if (absorbTimerRef.current) {
        window.clearTimeout(absorbTimerRef.current)
      }
      if (pulseTimerRef.current) {
        window.clearTimeout(pulseTimerRef.current)
      }
    }
  }, [])

  // Count-up the displayed streak number when the streak advances forward.
  // Backwards changes and wide jumps (initial load, cross-tab sync, reset) snap so we don't
  // replay the celebration on every navigation.
  useEffect(() => {
    const from = prevStreakRef.current
    const to = streak
    prevStreakRef.current = to

    // Streaks advance by exactly 1 per day; any other delta is a load, sync, or reset.
    if (prefersReducedMotion() || to - from !== 1) {
      setDisplayedStreak(to)
      return
    }

    // Subtle pulse on the flame whenever the streak increments.
    // Toggle off then on so back-to-back increments restart the animation cleanly.
    if (pulseTimerRef.current) {
      window.clearTimeout(pulseTimerRef.current)
    }
    setPulsing(false)
    const pulseRaf = requestAnimationFrame(() => {
      setPulsing(true)
      pulseTimerRef.current = window.setTimeout(() => {
        setPulsing(false)
        pulseTimerRef.current = null
      }, FLAME_PULSE_MS)
    })

    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_UP_MS)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplayedStreak(Math.round(from + (to - from) * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      cancelAnimationFrame(pulseRaf)
    }
  }, [streak])

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <nav
      className="px-4 sm:px-6 py-4 sm:py-5 relative z-40"
      style={{
        background: 'rgba(20, 28, 48, 0.92)',
        borderBottom: '1px solid var(--hairline)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center gap-3 max-w-6xl mx-auto">
        <Link
          href="/"
          lang="en"
          className="font-serif-display text-lg sm:text-xl font-bold tracking-tight transition-colors flex-shrink-0"
          style={{ color: 'var(--candlelight-gold)' }}
        >
          {t('appName')}
        </Link>
        {levelCode && (
          <>
            <span style={{ color: 'var(--hairline)' }}>/</span>
            <Link
              href={`/level/${levelCode}`}
              className="text-sm font-medium tracking-wider uppercase transition-colors hover:opacity-80"
              style={{ color: 'var(--vellum-champagne)' }}
            >
              {levelCode}
            </Link>
          </>
        )}
        {lessonId && lessonTitle && (
          <>
            <span className="hidden sm:inline" style={{ color: 'var(--hairline)' }}>/</span>
            <span
              className="text-sm truncate max-w-[120px] sm:max-w-[200px] hidden sm:block"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t('lessonLabel')} {lessonId}: {lessonTitle}
            </span>
          </>
        )}

        <div className="ml-auto flex items-center gap-4 sm:gap-6">
          {streak > 0 && (
            <span
              className="text-sm font-medium flex items-center gap-1.5 flex-shrink-0 nums-tabular min-w-11 min-h-11"
              style={{ color: 'var(--candlelight-gold)' }}
            >
              <span
                id="navbar-streak-flame"
                className={[
                  'inline-flex items-center justify-center',
                  absorbing
                    ? 'navbar-streak-flame-absorbing'
                    : pulsing
                    ? 'navbar-streak-flame-pulsing'
                    : '',
                ].filter(Boolean).join(' ')}
                style={{ transform: 'translateY(1px)' }}
              >
                <StreakFlame size={16} />
              </span>
              <span className="leading-none">{displayedStreak}</span>
              <span
                className="hidden sm:inline text-[11px] uppercase tracking-wider leading-none"
                style={{ color: 'var(--vellum-champagne)' }}
              >
                {t('streak')}
              </span>
            </span>
          )}
          {/* Desktop nav links — champagne, uppercase, tracked */}
          <Link
            href="/ielts"
            lang="en"
            className="text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors hidden sm:block hover:text-candlelight-gold"
            style={{ color: 'var(--vellum-champagne)' }}
          >
            IELTS
          </Link>
          <Link
            href="/mistakes"
            className="text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors hidden sm:block hover:text-candlelight-gold"
            style={{ color: 'var(--vellum-champagne)' }}
          >
            {t('mistakes')}
          </Link>
          <Link
            href="/profile"
            className="text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors hidden sm:block hover:text-candlelight-gold"
            style={{ color: 'var(--vellum-champagne)' }}
          >
            {t('profile')}
          </Link>

          {/* Mobile hamburger + dropdown */}
          <div className="sm:hidden relative" ref={menuRef}>
            <button
              className="w-11 h-11 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: 'var(--candlelight-gold)' }}
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Цэс нээх"
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>

            {menuOpen && (
              <div
                className="absolute top-full right-0 mt-3 rounded-2xl overflow-hidden z-50 w-[240px] shadow-editorial"
                style={{
                  background: 'var(--midnight-ink-surface)',
                  border: '1px solid rgba(245,158,11,0.35)',
                }}
              >
                <Link
                  href="/ielts"
                  lang="en"
                  className="flex items-center gap-3 px-5 min-h-14 text-[12px] font-semibold uppercase tracking-[0.18em] active:bg-candlelight-gold/10"
                  style={{ color: 'var(--vellum-champagne)' }}
                  onClick={() => setMenuOpen(false)}
                >
                  IELTS
                </Link>
                <div style={{ borderTop: '1px solid var(--hairline)' }} />
                <Link
                  href="/mistakes"
                  className="flex items-center gap-3 px-5 min-h-14 text-[12px] font-semibold uppercase tracking-[0.18em] active:bg-candlelight-gold/10"
                  style={{ color: 'var(--vellum-champagne)' }}
                  onClick={() => setMenuOpen(false)}
                >
                  {t('mistakes')}
                </Link>
                <div style={{ borderTop: '1px solid var(--hairline)' }} />
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-5 min-h-14 text-[12px] font-semibold uppercase tracking-[0.18em] active:bg-candlelight-gold/10"
                  style={{ color: 'var(--vellum-champagne)' }}
                  onClick={() => setMenuOpen(false)}
                >
                  {t('profile')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
