'use client'
import Link from 'next/link'
import { useProgress } from '@/hooks/useProgress'
import { LEVELS } from '@/lib/levels'
import type { LevelCode } from '@/lib/types'

export function LevelSelector() {
  const { getLevelProgress } = useProgress()

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {LEVELS.map((level, idx) => {
        const lp = getLevelProgress(level.code as LevelCode)
        const completed = lp.completedLessons.length
        const pct = Math.round((completed / 10) * 100)

        return (
          <Link
            key={level.code}
            href={`/level/${level.code}`}
            className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-gold"
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            <div
              style={{
                background: lp.examPassed
                  ? 'linear-gradient(#1E293B, #1E293B) padding-box, linear-gradient(135deg, #F59E0B, #FCD34D) border-box'
                  : undefined,
                border: lp.examPassed ? '1px solid transparent' : '1px solid rgba(245,158,11,0.12)',
                borderRadius: 16,
              }}
              className={`h-full ${!lp.examPassed ? 'bg-navy-surface' : ''}`}
            >
              <div className="p-4 flex flex-col h-full relative overflow-hidden">
                {/* Subtle diagonal pattern */}
                <div
                  className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{
                    backgroundImage: `repeating-linear-gradient(45deg, #F59E0B 0, #F59E0B 1px, transparent 0, transparent 50%)`,
                    backgroundSize: '12px 12px',
                  }}
                />

                {/* Level code */}
                <div
                  className="text-4xl font-extrabold leading-none mb-1 relative"
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B, #FCD34D)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {level.code}
                </div>

                {/* Level name */}
                <div className="text-xs font-semibold text-text-primary mb-3 leading-tight relative">
                  {level.label.split(' — ')[1]}
                </div>

                {/* Badge row */}
                <div className="flex items-center justify-between mb-2 relative">
                  <span className="text-xs" style={{ color: '#64748B' }}>
                    {completed}/10
                  </span>
                  <span className="text-xl">{lp.examPassed ? '🏆' : '📖'}</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-navy-surface-2 rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background: 'linear-gradient(90deg, #F59E0B, #FCD34D)',
                    }}
                  />
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
