'use client'
import Link from 'next/link'
import { useProgress } from '@/hooks/useProgress'
import { LEVELS } from '@/lib/levels'
import type { LevelCode } from '@/lib/types'

export function LevelSelector() {
  const { isLevelUnlocked, getLevelProgress } = useProgress()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {LEVELS.map(level => {
        const unlocked = isLevelUnlocked(level.code as LevelCode)
        const lp = getLevelProgress(level.code as LevelCode)
        const pct = Math.round((lp.completedLessons.length / 10) * 100)

        return (
          <div
            key={level.code}
            className={`relative rounded-2xl overflow-hidden border transition-all duration-200 ${
              unlocked
                ? 'border-navy-surface-2 hover:border-gold/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] cursor-pointer'
                : 'border-navy-surface-2/50 opacity-60 cursor-not-allowed'
            }`}
          >
            {unlocked ? (
              <Link href={`/level/${level.code}`} className="block">
                <LevelCardContent level={level} pct={pct} examPassed={lp.examPassed} />
              </Link>
            ) : (
              <LevelCardContent level={level} pct={pct} locked examPassed={false} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function LevelCardContent({
  level,
  pct,
  locked,
  examPassed,
}: {
  level: (typeof LEVELS)[0]
  pct: number
  locked?: boolean
  examPassed: boolean
}) {
  return (
    <div className={`bg-gradient-to-br ${level.color} p-0.5 rounded-2xl`}>
      <div className="bg-navy rounded-[14px] p-5 h-full">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xl font-bold text-gold">{level.code}</div>
            <div className="text-sm font-medium text-text-primary mt-0.5">{level.label.split(' — ')[1]}</div>
          </div>
          <div className="text-2xl">{locked ? '🔒' : examPassed ? '🏆' : '📖'}</div>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed mb-4">{level.description}</p>
        <div className="w-full h-1.5 bg-navy-surface-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gold rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-text-secondary mt-1.5">
          <span>{pct}% дууссан</span>
          <span>10 хичээл</span>
        </div>
      </div>
    </div>
  )
}
