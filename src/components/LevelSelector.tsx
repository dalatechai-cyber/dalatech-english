'use client'
import Link from 'next/link'
import { useProgress } from '@/hooks/useProgress'
import { LEVELS } from '@/lib/levels'
import type { LevelCode } from '@/lib/types'
import { TrophyIcon, BookIcon } from './Icon'

export function LevelSelector() {
  const { getLevelProgress } = useProgress()

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {LEVELS.map((level, idx) => {
        const lp = getLevelProgress(level.code as LevelCode)
        const completed = lp.completedLessons.length
        const pct = Math.round((completed / 10) * 100)
        const label = level.label.split(' — ')[1] ?? level.label

        return (
          <Link
            key={level.code}
            href={`/level/${level.code}`}
            className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 focus-visible:-translate-y-1"
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            <div
              className={`h-full relative ${
                lp.examPassed ? 'shadow-gold' : 'shadow-editorial'
              } group-hover:shadow-gold transition-shadow duration-300`}
              style={{
                background: lp.examPassed
                  ? 'linear-gradient(#141C30, #141C30) padding-box, linear-gradient(135deg, #F59E0B 0%, #E4C08A 50%, #D97706 100%) border-box'
                  : '#141C30',
                border: lp.examPassed
                  ? '1px solid transparent'
                  : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
              }}
            >
              {/* Corner decoration */}
              <div
                className="absolute top-0 right-0 w-16 h-16 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle at top right, rgba(245,158,11,0.12) 0%, transparent 60%)',
                }}
              />

              <div className="p-5 flex flex-col h-full relative">
                {/* Top row: status pill */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="text-[10px] font-semibold tracking-[0.2em] uppercase"
                    style={{ color: lp.examPassed ? 'var(--champagne)' : 'var(--text-muted)' }}
                  >
                    CEFR
                  </span>
                  <span
                    className="flex items-center justify-center w-7 h-7 rounded-full"
                    style={{
                      color: lp.examPassed ? 'var(--gold)' : 'var(--text-muted)',
                      background: lp.examPassed
                        ? 'rgba(245,158,11,0.1)'
                        : 'rgba(255,255,255,0.04)',
                    }}
                  >
                    {lp.examPassed ? <TrophyIcon size={14} /> : <BookIcon size={14} />}
                  </span>
                </div>

                {/* Level code — serif, editorial */}
                <div
                  className="font-serif-display text-5xl font-bold leading-none mb-1 nums-tabular"
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 50%, #E4C08A 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {level.code}
                </div>

                {/* Level name */}
                <div
                  className="text-[11px] font-medium mb-4 leading-tight uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {label}
                </div>

                <div className="mt-auto">
                  {/* Progress label */}
                  <div className="flex items-center justify-between mb-2 text-[11px]">
                    <span style={{ color: 'var(--text-muted)' }}>Дэвшил</span>
                    <span
                      className="nums-tabular font-medium"
                      style={{ color: 'var(--champagne)' }}
                    >
                      {completed}/10
                    </span>
                  </div>

                  {/* Progress bar — hairline track, gold fill */}
                  <div
                    className="w-full h-1 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background:
                          'linear-gradient(90deg, #D97706 0%, #F59E0B 50%, #FCD34D 100%)',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
