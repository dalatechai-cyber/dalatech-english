'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { loadStreak } from '@/lib/streak'
import { t } from '@/lib/i18n'
import { FlameIcon } from './Icon'

interface NavBarProps {
  levelCode?: string
  lessonId?: number
  lessonTitle?: string
}

export function NavBar({ levelCode, lessonId, lessonTitle }: NavBarProps) {
  const [streak, setStreak] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const data = loadStreak()
    setStreak(data.current)
  }, [])

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
          style={{ color: 'var(--gold)' }}
        >
          {t('appName')}
        </Link>
        {levelCode && (
          <>
            <span style={{ color: 'var(--hairline)' }}>/</span>
            <Link
              href={`/level/${levelCode}`}
              className="text-sm font-medium tracking-wider uppercase transition-colors hover:opacity-80"
              style={{ color: 'var(--champagne)' }}
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
              style={{ color: 'var(--gold)' }}
            >
              <FlameIcon size={20} />
              {streak}
              <span
                className="hidden sm:inline text-[11px] uppercase tracking-wider"
                style={{ color: 'var(--champagne)' }}
              >
                {t('streak')}
              </span>
            </span>
          )}
          {/* Desktop nav links — champagne, uppercase, tracked */}
          <Link
            href="/ielts"
            lang="en"
            className="text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors hidden sm:block hover:text-gold"
            style={{ color: 'var(--champagne)' }}
          >
            IELTS
          </Link>
          <Link
            href="/mistakes"
            className="text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors hidden sm:block hover:text-gold"
            style={{ color: 'var(--champagne)' }}
          >
            {t('mistakes')}
          </Link>
          <Link
            href="/profile"
            className="text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors hidden sm:block hover:text-gold"
            style={{ color: 'var(--champagne)' }}
          >
            {t('profile')}
          </Link>

          {/* Mobile hamburger + dropdown */}
          <div className="sm:hidden relative" ref={menuRef}>
            <button
              className="w-11 h-11 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: 'var(--gold)' }}
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
                  background: '#141C30',
                  border: '1px solid rgba(245,158,11,0.35)',
                }}
              >
                <Link
                  href="/ielts"
                  lang="en"
                  className="flex items-center gap-3 px-5 min-h-14 text-[12px] font-semibold uppercase tracking-[0.18em] active:bg-gold/10"
                  style={{ color: 'var(--champagne)' }}
                  onClick={() => setMenuOpen(false)}
                >
                  IELTS
                </Link>
                <div style={{ borderTop: '1px solid var(--hairline)' }} />
                <Link
                  href="/mistakes"
                  className="flex items-center gap-3 px-5 min-h-14 text-[12px] font-semibold uppercase tracking-[0.18em] active:bg-gold/10"
                  style={{ color: 'var(--champagne)' }}
                  onClick={() => setMenuOpen(false)}
                >
                  {t('mistakes')}
                </Link>
                <div style={{ borderTop: '1px solid var(--hairline)' }} />
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-5 min-h-14 text-[12px] font-semibold uppercase tracking-[0.18em] active:bg-gold/10"
                  style={{ color: 'var(--champagne)' }}
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
