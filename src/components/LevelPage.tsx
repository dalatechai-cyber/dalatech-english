'use client'
import Link from 'next/link'
import { useProgress } from '@/hooks/useProgress'
import { getLevelMeta } from '@/lib/levels'
import { NavBar } from './NavBar'
import { ProgressBar } from './ProgressBar'
import { t } from '@/lib/i18n'
import type { LevelCode } from '@/lib/types'

interface LevelPageProps {
  levelCode: LevelCode
}

export function LevelPage({ levelCode }: LevelPageProps) {
  const { getLevelProgress } = useProgress()
  const meta = getLevelMeta(levelCode)
  const lp = getLevelProgress(levelCode)

  if (!meta) return <div className="p-8 text-center text-rose-400">Түвшин олдсонгүй</div>

  return (
    <div className="min-h-screen bg-navy">
      <NavBar levelCode={levelCode} />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Level header */}
        <div className="mb-8">
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

        {/* Mode selection cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {/* Free Chat Card */}
          <Link
            href={`/level/${levelCode}/chat`}
            className="group block bg-navy-surface border border-navy-surface-2 hover:border-gold/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] rounded-2xl p-6 transition-all duration-200"
          >
            <div className="text-3xl mb-3">💬</div>
            <h2 className="text-lg font-bold text-gold mb-2 group-hover:text-gold-light transition-colors">
              {t('freeChat')}
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              {t('freeChatDesc')}
            </p>
            <div className="mt-4 text-gold text-sm font-medium flex items-center gap-1">
              Эхлэх <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          {/* Quiz Card */}
          <Link
            href={`/level/${levelCode}/quiz`}
            className="group block bg-navy-surface border border-navy-surface-2 hover:border-gold/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] rounded-2xl p-6 transition-all duration-200"
          >
            <div className="text-3xl mb-3">📝</div>
            <h2 className="text-lg font-bold text-gold mb-2 group-hover:text-gold-light transition-colors">
              {t('quiz')}
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              {t('quizDesc')}
            </p>
            <div className="mt-4 text-gold text-sm font-medium flex items-center gap-1">
              Тест өгөх <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        </div>

        {/* Lesson list (collapsed reference) */}
        <details className="bg-navy-surface border border-navy-surface-2 rounded-xl overflow-hidden">
          <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-text-secondary hover:text-text-primary transition-colors list-none flex items-center justify-between">
            <span>📚 {t('lessons')} ({lp.completedLessons.length}/10 дууссан)</span>
            <span className="text-xs text-text-secondary/60">▼</span>
          </summary>
          <div className="border-t border-navy-surface-2 divide-y divide-navy-surface-2/50">
            {meta.lessons.map(lesson => {
              const completed = lp.completedLessons.includes(lesson.id)
              return (
                <Link
                  key={lesson.id}
                  href={`/level/${levelCode}/lesson/${lesson.id}`}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-navy-surface-2/30 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    completed ? 'bg-emerald-600 text-white' : lesson.isExam ? 'bg-navy-surface-2 text-text-secondary' : 'bg-gold/20 text-gold'
                  }`}>
                    {lesson.isExam ? (completed ? '🏆' : '📝') : lesson.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text-primary truncate">{lesson.titleMn}</div>
                  </div>
                  {completed && <span className="text-emerald-400 text-sm flex-shrink-0">✓</span>}
                </Link>
              )
            })}
          </div>
        </details>
      </div>
    </div>
  )
}
