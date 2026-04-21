'use client'
import Link from 'next/link'
import { useProgress } from '@/hooks/useProgress'
import { getLevelMeta } from '@/lib/levels'
import { NavBar } from './NavBar'
import { ProgressBar } from './ProgressBar'
import type { LevelCode } from '@/lib/types'

interface LevelPageProps {
  levelCode: LevelCode
}

export function LevelPage({ levelCode }: LevelPageProps) {
  const { getLevelProgress, isLessonUnlocked } = useProgress()
  const meta = getLevelMeta(levelCode)
  const lp = getLevelProgress(levelCode)

  if (!meta) return <div className="p-8 text-center text-rose-400">Түвшин олдсонгүй</div>

  return (
    <div className="min-h-screen bg-navy">
      <NavBar levelCode={levelCode} />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gold mb-1">{meta.label}</h1>
          <p className="text-text-secondary text-sm">{meta.description}</p>
          <div className="mt-4">
            <ProgressBar
              completed={lp.completedLessons.length}
              total={10}
              label="Хичээлийн дэвшил"
            />
          </div>
        </div>

        <div className="space-y-3">
          {meta.lessons.map(lesson => {
            const unlocked = isLessonUnlocked(levelCode, lesson.id)
            const completed = lp.completedLessons.includes(lesson.id)

            return (
              <div
                key={lesson.id}
                className={`rounded-xl border transition-all ${
                  unlocked
                    ? 'bg-navy-surface border-navy-surface-2 hover:border-gold/40 cursor-pointer'
                    : 'bg-navy-surface/50 border-navy-surface-2/50 opacity-60 cursor-not-allowed'
                }`}
              >
                {unlocked ? (
                  <Link href={`/level/${levelCode}/lesson/${lesson.id}`} className="flex items-center gap-4 p-4">
                    <LessonIcon id={lesson.id} completed={completed} isExam={lesson.isExam} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-text-primary">{lesson.titleMn}</div>
                      <div className="text-xs text-text-secondary mt-0.5 truncate">{lesson.description}</div>
                    </div>
                    {completed && <span className="text-emerald-400 text-lg flex-shrink-0">✓</span>}
                    {!completed && <span className="text-gold text-sm flex-shrink-0">→</span>}
                  </Link>
                ) : (
                  <div className="flex items-center gap-4 p-4">
                    <LessonIcon id={lesson.id} completed={false} locked isExam={lesson.isExam} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-text-secondary">{lesson.titleMn}</div>
                      <div className="text-xs text-text-secondary/60 mt-0.5">Өмнөх хичээлийг дуусгана уу</div>
                    </div>
                    <span className="text-text-secondary/50 text-lg flex-shrink-0">🔒</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-8 bg-navy-surface border border-gold/20 rounded-xl p-4">
          <div className="text-gold text-sm font-semibold mb-2">📚 Үгийн сангийн дасгал</div>
          <p className="text-text-secondary text-xs">Аль ч хичээлийн дотор &quot;Make a sentence with [word]&quot; гэж бичвэл AI тухайн үгийг ашиглан өгүүлбэр гарган өгнө.</p>
        </div>
      </div>
    </div>
  )
}

function LessonIcon({ id, completed, locked, isExam }: { id: number; completed: boolean; locked?: boolean; isExam: boolean }) {
  if (isExam) {
    return (
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${completed ? 'bg-gold' : 'bg-navy-surface-2'}`}>
        {completed ? '🏆' : locked ? '🔒' : '📝'}
      </div>
    )
  }
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
      completed ? 'bg-emerald-600 text-white' : locked ? 'bg-navy-surface-2 text-text-secondary' : 'bg-gold/20 text-gold'
    }`}>
      {id}
    </div>
  )
}
