'use client'
import Link from 'next/link'
import { useProgress } from '@/hooks/useProgress'
import { LEVELS } from '@/lib/levels'
import type { LevelCode } from '@/lib/types'

export function LevelSelector() {
  const { getLevelProgress } = useProgress()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {LEVELS.map(level => {
        const lp = getLevelProgress(level.code as LevelCode)
        const completed = lp.completedLessons.length
        const pct = Math.round((completed / 10) * 100)

        return (
          <Link
            key={level.code}
            href={`/level/${level.code}`}
            className="group relative rounded-2xl overflow-hidden border border-navy-surface-2 hover:border-gold/60 transition-all duration-300 hover:shadow-[0_0_24px_rgba(245,158,11,0.15)] active:scale-[0.98]"
          >
            <div className={`bg-gradient-to-br ${level.color} p-0.5 rounded-2xl h-full`}>
              <div className="bg-navy rounded-[14px] p-5 h-full flex flex-col">
                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div
                      className="text-3xl font-extrabold text-gold leading-none"
                      style={{ textShadow: '0 0 20px rgba(245,158,11,0.3)' }}
                    >
                      {level.code}
                    </div>
                    <div className="text-sm font-semibold text-text-primary mt-1">
                      {level.label.split(' — ')[1]}
                    </div>
                  </div>
                  <div className="text-2xl">{lp.examPassed ? '🏆' : '📖'}</div>
                </div>

                {/* Description */}
                <p className="text-xs text-text-secondary leading-relaxed mb-4 flex-1">
                  {level.description}
                </p>

                {/* Lesson count badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-secondary/70 bg-navy-surface rounded-full px-2.5 py-0.5 border border-navy-surface-2">
                    10 хичээл
                  </span>
                  <span className="text-xs font-semibold text-gold">
                    {completed}/10 дууссан
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-navy-surface-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
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
