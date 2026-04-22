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
      <div className="max-w-2xl mx-auto px-4 py-8 page-enter-up">

        {/* Level hero */}
        <div className="text-center mb-8">
          <div
            className="text-7xl font-extrabold leading-none mb-2"
            style={{
              background: 'linear-gradient(135deg, #F59E0B, #FCD34D)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.03em',
            }}
          >
            {levelCode}
          </div>
          <h1 className="text-xl font-bold text-text-primary mb-1">{meta.label.split(' — ')[1]}</h1>
          <p className="text-sm mb-4" style={{ color: '#CBD5E1' }}>{meta.description}</p>
          <div className="max-w-xs mx-auto">
            <ProgressBar
              completed={lp.completedLessons.length}
              total={10}
              label="Хичээлийн дэвшил"
            />
          </div>
        </div>

        {/* Mode cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {/* Free Chat */}
          <Link
            href={`/level/${levelCode}/chat`}
            className="group block rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-gold"
            style={{
              background: 'linear-gradient(#1E293B, #1E293B) padding-box, linear-gradient(135deg, #F59E0B, #FCD34D) border-box',
              border: '1px solid transparent',
            }}
          >
            <div className="text-4xl mb-3">💬</div>
            <h2 className="text-lg font-bold text-gold mb-2 group-hover:text-gold-light transition-colors" style={{ letterSpacing: '-0.02em' }}>
              {t('freeChat')}
            </h2>
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#CBD5E1' }}>
              {t('freeChatDesc')}
            </p>
            <div
              className="inline-flex items-center gap-2 font-semibold text-sm py-2 px-4 rounded-xl transition-all group-hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}
            >
              Эхлэх <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          {/* Quiz */}
          <Link
            href={`/level/${levelCode}/quiz`}
            className="group block rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-gold"
            style={{
              background: 'linear-gradient(#1E293B, #1E293B) padding-box, linear-gradient(135deg, #F59E0B, #FCD34D) border-box',
              border: '1px solid transparent',
            }}
          >
            <div className="text-4xl mb-3">📝</div>
            <h2 className="text-lg font-bold text-gold mb-2 group-hover:text-gold-light transition-colors" style={{ letterSpacing: '-0.02em' }}>
              {t('quiz')}
            </h2>
            <p className="text-sm leading-relaxed mb-1" style={{ color: '#CBD5E1' }}>
              {t('quizDesc')}
            </p>
            <p className="text-xs mb-4" style={{ color: '#64748B' }}>
              15 тест · 2 уншлага · 1 бичих · 18/25 тэнцэх
            </p>
            <div
              className="inline-flex items-center gap-2 font-semibold text-sm py-2 px-4 rounded-xl transition-all group-hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}
            >
              Тест өгөх <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        </div>

        {/* Lesson list */}
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
