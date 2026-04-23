'use client'
import Link from 'next/link'
import { useProgress } from '@/hooks/useProgress'
import { getLevelMeta } from '@/lib/levels'
import { NavBar } from './NavBar'
import { t } from '@/lib/i18n'
import type { LevelCode } from '@/lib/types'
import { BookIcon, PencilIcon, ArrowRightIcon, CheckCircleIcon, TrophyIcon } from './Icon'

interface LevelPageProps {
  levelCode: LevelCode
}

export function LevelPage({ levelCode }: LevelPageProps) {
  const { getLevelProgress } = useProgress()
  const meta = getLevelMeta(levelCode)
  const lp = getLevelProgress(levelCode)

  if (!meta) {
    return (
      <div className="p-8 text-center" style={{ color: '#FCA5A5' }}>
        Түвшин олдсонгүй
      </div>
    )
  }

  const completed = lp.completedLessons.length
  const pct = Math.round((completed / 10) * 100)
  const subtitle = meta.label.split(' — ')[1] ?? meta.label

  return (
    <div className="min-h-screen bg-navy">
      <NavBar levelCode={levelCode} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 page-enter-up">
        {/* Hero — editorial */}
        <div className="text-center mb-12">
          <div
            className="text-[11px] font-semibold uppercase tracking-[0.22em] mb-4"
            style={{ color: 'var(--champagne)' }}
          >
            CEFR · Level
          </div>
          <div
            className="font-serif-display text-7xl sm:text-8xl font-bold leading-none mb-4 nums-tabular"
            style={{
              background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 50%, #E4C08A 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.03em',
            }}
          >
            {levelCode}
          </div>
          <h1
            className="font-serif-display text-2xl sm:text-3xl font-medium mb-3"
            style={{ color: 'var(--champagne)' }}
          >
            {subtitle}
          </h1>
          <p
            className="text-sm sm:text-base max-w-md mx-auto leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            {meta.description}
          </p>
          <div
            className="h-px w-16 mx-auto mt-6"
            style={{ background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }}
          />

          {/* Progress */}
          <div className="max-w-xs mx-auto mt-8">
            <div className="flex items-center justify-between mb-2 text-[11px] uppercase tracking-wider">
              <span style={{ color: 'var(--text-muted)' }}>Дэвшил</span>
              <span className="nums-tabular font-medium" style={{ color: 'var(--champagne)' }}>
                {completed}/10
              </span>
            </div>
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

        {/* Mode cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {/* Free Chat */}
          <Link
            href={`/level/${levelCode}/chat`}
            className="group block rounded-2xl p-6 shadow-editorial transition-all duration-300 hover:-translate-y-1 hover:shadow-gold relative overflow-hidden"
            style={{
              background: '#141C30',
              border: '1px solid var(--hairline)',
            }}
          >
            <div
              className="absolute top-0 right-0 w-20 h-20 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at top right, rgba(245,158,11,0.10) 0%, transparent 60%)',
              }}
            />
            <div className="flex items-center justify-between mb-4 relative">
              <span
                className="font-serif-display text-xs nums-tabular tracking-widest"
                style={{ color: 'var(--champagne)' }}
              >
                01
              </span>
              <span
                className="flex items-center justify-center w-8 h-8 rounded-full"
                style={{ background: 'rgba(245,158,11,0.10)', color: 'var(--gold)' }}
              >
                <BookIcon size={16} />
              </span>
            </div>
            <h2
              className="font-serif-display text-2xl font-bold mb-2 relative"
              style={{ color: 'var(--gold)', letterSpacing: '-0.02em' }}
            >
              {t('freeChat')}
            </h2>
            <p
              className="text-sm leading-relaxed mb-5 relative"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t('freeChatDesc')}
            </p>
            <span
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-transform group-hover:translate-x-1"
              style={{ color: 'var(--gold)' }}
            >
              Эхлэх <ArrowRightIcon size={14} />
            </span>
          </Link>

          {/* Quiz */}
          <Link
            href={`/level/${levelCode}/quiz`}
            className="group block rounded-2xl p-6 shadow-editorial transition-all duration-300 hover:-translate-y-1 hover:shadow-gold relative overflow-hidden"
            style={{
              background: '#141C30',
              border: '1px solid var(--hairline)',
            }}
          >
            <div
              className="absolute top-0 right-0 w-20 h-20 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at top right, rgba(245,158,11,0.10) 0%, transparent 60%)',
              }}
            />
            <div className="flex items-center justify-between mb-4 relative">
              <span
                className="font-serif-display text-xs nums-tabular tracking-widest"
                style={{ color: 'var(--champagne)' }}
              >
                02
              </span>
              <span
                className="flex items-center justify-center w-8 h-8 rounded-full"
                style={{ background: 'rgba(245,158,11,0.10)', color: 'var(--gold)' }}
              >
                <PencilIcon size={16} />
              </span>
            </div>
            <h2
              className="font-serif-display text-2xl font-bold mb-2 relative"
              style={{ color: 'var(--gold)', letterSpacing: '-0.02em' }}
            >
              {t('quiz')}
            </h2>
            <p
              className="text-sm leading-relaxed mb-1 relative"
              style={{ color: 'var(--text-secondary)' }}
            >
              {t('quizDesc')}
            </p>
            <p
              className="text-[11px] mb-4 relative"
              style={{ color: 'var(--text-muted)' }}
            >
              15 тест · 2 уншлага · 1 бичих · 18/25 тэнцэх
            </p>
            <span
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-transform group-hover:translate-x-1"
              style={{ color: 'var(--gold)' }}
            >
              Тест өгөх <ArrowRightIcon size={14} />
            </span>
          </Link>
        </div>

        {/* Lesson list */}
        <details
          className="rounded-2xl overflow-hidden shadow-editorial"
          style={{ background: '#141C30', border: '1px solid var(--hairline)' }}
        >
          <summary
            className="px-5 py-4 cursor-pointer text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors list-none flex items-center justify-between"
            style={{ color: 'var(--champagne)' }}
          >
            <span>
              {t('lessons')} · {completed}/10 дууссан
            </span>
            <span style={{ color: 'var(--text-muted)' }}>▼</span>
          </summary>
          <div style={{ borderTop: '1px solid var(--hairline)' }}>
            {meta.lessons.map((lesson, idx) => {
              const done = lp.completedLessons.includes(lesson.id)
              return (
                <Link
                  key={lesson.id}
                  href={`/level/${levelCode}/lesson/${lesson.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02]"
                  style={
                    idx > 0 ? { borderTop: '1px solid var(--hairline)' } : undefined
                  }
                >
                  <span
                    className="font-serif-display text-sm nums-tabular tracking-widest flex-shrink-0 w-7"
                    style={{ color: done ? 'var(--gold)' : 'var(--text-muted)' }}
                  >
                    {String(lesson.id).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {lesson.titleMn}
                    </div>
                  </div>
                  {lesson.isExam && (
                    <span style={{ color: 'var(--champagne)' }} className="flex-shrink-0">
                      <TrophyIcon size={16} />
                    </span>
                  )}
                  {done && (
                    <span style={{ color: '#34D399' }} className="flex-shrink-0">
                      <CheckCircleIcon size={16} />
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </details>
      </div>
    </div>
  )
}
