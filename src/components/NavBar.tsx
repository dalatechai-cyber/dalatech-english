'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
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

  useEffect(() => {
    const data = loadStreak()
    setStreak(data.current)
  }, [])

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
              🔥 {streak} {t('streak')}
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
          {/* Mobile hamburger */}
          <button
            className="sm:hidden w-9 h-9 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-navy-surface-2/50"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Цэс нээх"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-navy-surface border-b border-navy-surface-2 py-2 z-50">
          <Link
            href="/ielts"
            className="flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-text-primary hover:bg-navy-surface-2/30 transition-colors text-sm"
            onClick={() => setMenuOpen(false)}
          >
            📝 IELTS
          </Link>
          <Link
            href="/mistakes"
            className="flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-text-primary hover:bg-navy-surface-2/30 transition-colors text-sm"
            onClick={() => setMenuOpen(false)}
          >
            📓 {t('mistakes')}
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-text-primary hover:bg-navy-surface-2/30 transition-colors text-sm"
            onClick={() => setMenuOpen(false)}
          >
            👤 {t('profile')}
          </Link>
        </div>
      )}
    </nav>
  )
}
