'use client'
import Link from 'next/link'

interface NavBarProps {
  levelCode?: string
  lessonId?: number
  lessonTitle?: string
}

export function NavBar({ levelCode, lessonId, lessonTitle }: NavBarProps) {
  return (
    <nav className="bg-navy-surface border-b border-navy-surface-2 px-4 py-3 flex items-center gap-3">
      <Link href="/" className="text-gold font-bold text-lg tracking-tight hover:text-gold-light transition-colors">
        Dalatech English
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
          <span className="text-navy-surface-2">/</span>
          <span className="text-text-secondary text-sm truncate max-w-[160px]">
            Хичээл {lessonId}: {lessonTitle}
          </span>
        </>
      )}
    </nav>
  )
}
