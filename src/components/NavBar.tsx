'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { loadStreak } from '@/lib/streak'
import { t } from '@/lib/i18n'

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
    <nav className="bg-navy-surface border-b border-navy-surface-2 px-4 py-3 relative z-40">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-gold font-bold text-lg tracking-tight hover:text-gold-light transition-colors flex-shrink-0">
          {t('appName')}
        </Link>
        {levelCode && (
          <>
            <span className="text-navy-surface-2">/</span>
            <Link
              href={`/level/${levelCode}`}
              className="text-text-secondary hover:text-text-primary transition-colors text-sm"
            >
              {levelCode}
            </Link>
          </>
        )}
        {lessonId && lessonTitle && (
          <>
            <span className="text-navy-surface-2 hidden sm:block">/</span>
            <span className="text-text-secondary text-sm truncate max-w-[120px] sm:max-w-[200px] hidden sm:block">
              {t('lessonLabel')} {lessonId}: {lessonTitle}
            </span>
          </>
        )}

        <div className="ml-auto flex items-center gap-3">
          {streak > 0 && (
            <span className="text-gold text-sm font-medium flex items-center gap-1 flex-shrink-0">
              🔥 {streak} <span className="hidden sm:inline">{t('streak')}</span>
            </span>
          )}
          {/* Desktop nav links */}
          <Link href="/ielts" className="text-text-secondary hover:text-text-primary text-xs transition-colors hidden sm:block">
            IELTS
          </Link>
          <Link href="/mistakes" className="text-text-secondary hover:text-text-primary text-xs transition-colors hidden sm:block">
            {t('mistakes')}
          </Link>
          <Link href="/profile" className="text-text-secondary hover:text-text-primary text-xs transition-colors hidden sm:block">
            {t('profile')}
          </Link>
          {/* Mobile hamburger + dropdown — ref wraps both so dropdown taps don't count as "outside" */}
          <div className="sm:hidden relative" ref={menuRef}>
            <button
              className="w-11 h-11 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: '#F59E0B' }}
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Цэс нээх"
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {menuOpen && (
              <div
                className="absolute top-full right-0 mt-2 rounded-xl overflow-hidden z-50 w-[220px]"
                style={{
                  background: '#1E293B',
                  border: '1px solid #F59E0B',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.4), 0 0 20px rgba(245,158,11,0.15)',
                }}
              >
                <Link
                  href="/ielts"
                  className="flex items-center gap-3 px-4 min-h-12 text-sm font-medium active:bg-gold/10"
                  style={{ color: '#F59E0B' }}
                  onClick={() => setMenuOpen(false)}
                >
                  📝 IELTS
                </Link>
                <Link
                  href="/mistakes"
                  className="flex items-center gap-3 px-4 min-h-12 text-sm font-medium active:bg-gold/10 border-t"
                  style={{ color: '#F59E0B', borderColor: '#334155' }}
                  onClick={() => setMenuOpen(false)}
                >
                  📓 {t('mistakes')}
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-4 min-h-12 text-sm font-medium active:bg-gold/10 border-t"
                  style={{ color: '#F59E0B', borderColor: '#334155' }}
                  onClick={() => setMenuOpen(false)}
                >
                  👤 {t('profile')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
