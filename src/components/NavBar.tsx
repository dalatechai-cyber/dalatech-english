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

        <div className="ml-auto flex items-center gap-3" ref={menuRef}>
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
          {/* Mobile hamburger */}
          <button
            className="sm:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: '#F59E0B' }}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Цэс нээх"
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
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div
          className="sm:hidden absolute top-full right-4 mt-2 rounded-xl overflow-hidden z-50 min-w-[180px]"
          style={{
            background: '#1E293B',
            border: '1px solid #F59E0B',
            boxShadow: '0 10px 25px rgba(0,0,0,0.4), 0 0 20px rgba(245,158,11,0.15)',
          }}
        >
          <Link
            href="/ielts"
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors"
            style={{ color: '#F59E0B' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.12)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            onClick={() => setMenuOpen(false)}
          >
            📝 IELTS
          </Link>
          <Link
            href="/mistakes"
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors"
            style={{ color: '#F59E0B' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.12)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            onClick={() => setMenuOpen(false)}
          >
            📓 {t('mistakes')}
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors"
            style={{ color: '#F59E0B' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.12)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            onClick={() => setMenuOpen(false)}
          >
            👤 {t('profile')}
          </Link>
        </div>
      )}
    </nav>
  )
}
