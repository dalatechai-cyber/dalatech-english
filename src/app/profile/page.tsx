'use client'
import { useState, useEffect, useMemo } from 'react'
import { NavBar } from '@/components/NavBar'
import { CertificateModal } from '@/components/CertificateModal'
import { loadCertificates, formatMongolianDate, type CertificateEntry } from '@/lib/certificates'
import { loadTestHistory, type TestHistoryEntry } from '@/lib/testHistory'
import { loadStreak } from '@/lib/streak'
import { t } from '@/lib/i18n'
import type { LevelCode } from '@/lib/types'
import {
  FlameIcon,
  StarIcon,
  CheckCircleIcon,
  TrophyIcon,
  CertificateIcon,
  ClipboardIcon,
  NotebookIcon,
} from '@/components/Icon'

const QUIZ_LEVELS: LevelCode[] = ['A1', 'A2', 'B1', 'B2', 'C1']
const QUIZ_PAGE_SIZE = 8

export default function ProfilePage() {
  const [certs, setCerts] = useState<CertificateEntry[]>([])
  const [history, setHistory] = useState<TestHistoryEntry[]>([])
  const [streak, setStreak] = useState({ current: 0, longest: 0 })
  const [selectedCert, setSelectedCert] = useState<CertificateEntry | null>(null)
  const [quizFilter, setQuizFilter] = useState<'all' | LevelCode>('all')
  const [quizVisible, setQuizVisible] = useState(QUIZ_PAGE_SIZE)

  useEffect(() => {
    try {
      setCerts(loadCertificates())
      setHistory(loadTestHistory())
    } catch (e) {
      console.warn('Profile load failed:', e)
    }
  }, [])

  useEffect(() => {
    const refresh = () => {
      try {
        const s = loadStreak()
        setStreak({ current: s.current, longest: s.longest })
      } catch (e) {
        console.warn('Streak refresh failed:', e)
      }
    }

    refresh()

    const handleStreakUpdate = () => refresh()
    window.addEventListener('streak:updated', handleStreakUpdate)

    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === 'core-streak-current' ||
        e.key === 'core-streak-longest' ||
        e.key === 'core-streak-last-date'
      ) {
        refresh()
      }
    }
    window.addEventListener('storage', handleStorage)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.removeEventListener('streak:updated', handleStreakUpdate)
      window.removeEventListener('storage', handleStorage)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  // Keep one certificate per level (defensive — storage already enforces this).
  const uniqueCerts = useMemo(() => {
    const byLevel = new Map<string, CertificateEntry>()
    for (const c of certs) {
      if (!byLevel.has(c.level)) byLevel.set(c.level, c)
    }
    return Array.from(byLevel.values())
  }, [certs])

  const quizHistory = useMemo(
    () =>
      history
        .filter(h => h.type === 'quiz')
        .filter(h => quizFilter === 'all' || h.level === quizFilter)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [history, quizFilter],
  )

  const ieltsHistory = useMemo(
    () => history.filter(h => h.type === 'ielts').sort((a, b) => (a.date < b.date ? 1 : -1)),
    [history],
  )

  const totalPoints = history
    .filter(t => t.type === 'quiz')
    .reduce((sum, t) => {
      const passed = t.passed || (t.score ?? 0) >= 18
      return sum + (t.score || 0) + (passed ? 50 : 0)
    }, 0)

  const lessonsCompleted = history
    .filter(t => t.type === 'quiz')
    .length

  return (
    <div className="min-h-screen bg-midnight-ink">
      <NavBar />
      <div className="max-w-3xl mx-auto px-5 py-8 sm:py-12 page-enter-up">

        {/* Profile header */}
        <div className="mb-10 pb-8 border-b hairline">
          <div className="text-[11px] font-semibold tracking-[0.22em] uppercase mb-3" style={{ color: 'var(--vellum-champagne)' }}>
            Таны профайл
          </div>
          <h1 className="font-serif-display text-4xl sm:text-5xl text-white leading-tight">
            Дэвшлийн <em className="italic" style={{ color: 'var(--candlelight-gold)' }}>хураангуй</em>
          </h1>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.04] rounded-2xl overflow-hidden border hairline shadow-editorial mb-12">
          {[
            { Icon: FlameIcon, val: streak.current, label: 'Одоогийн streak' },
            { Icon: StarIcon, val: streak.longest, label: 'Дээд streak' },
            { Icon: CheckCircleIcon, val: lessonsCompleted, label: 'Хичээл' },
            { Icon: TrophyIcon, val: totalPoints, label: 'Нийт оноо' },
          ].map(s => (
            <div key={s.label} className="bg-midnight-ink-surface p-5 sm:p-6">
              <span
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg mb-4"
                style={{ color: 'var(--candlelight-gold)', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
              >
                <s.Icon size={16} />
              </span>
              <div
                className="font-serif-display font-bold text-4xl sm:text-5xl nums-tabular leading-none mb-1.5"
                style={{
                  background: 'linear-gradient(135deg, var(--candlelight-gold) 0%, var(--candlelight-gold-light) 60%, var(--vellum-champagne) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '-0.02em',
                }}
              >
                {s.val}
              </div>
              <div className="font-sans text-[11px] uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── 01 · Certificates ── */}
        <SectionHeader label="01" kicker="Амжилт" title={t('certificates')} />

        {uniqueCerts.length === 0 ? (
          <EmptyState Icon={CertificateIcon} primary="Одоогоор гэрчилгээ байхгүй байна" secondary="Тест өгч 18/25 аваад гэрчилгээ аваарай." />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
            {uniqueCerts.map(cert => (
              <button
                key={cert.id}
                onClick={() => setSelectedCert(cert)}
                className="rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-gold group"
                style={{
                  background: 'linear-gradient(var(--midnight-ink-surface), var(--midnight-ink-surface)) padding-box, linear-gradient(135deg, var(--candlelight-gold) 0%, var(--vellum-champagne) 50%, var(--candlelight-gold-dark) 100%) border-box',
                  border: '2px solid transparent',
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-3 font-serif-display font-bold text-midnight-ink nums-tabular"
                  style={{ background: 'linear-gradient(135deg, var(--candlelight-gold-light), var(--candlelight-gold-dark))', fontSize: 20 }}
                >
                  {cert.level}
                </div>
                <div className="font-serif-display text-lg text-white mb-1">
                  {cert.level} гэрчилгээ
                </div>
                <div className="font-sans text-[11px] nums-tabular" style={{ color: 'var(--text-muted)' }}>
                  {cert.score}/{cert.total} · {formatMongolianDate(cert.date)}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── 02 · Quiz history ── */}
        <SectionHeader label="02" kicker="Түүх" title="Тестийн түүх" />

        <div className="flex flex-wrap gap-2 mb-5">
          {(['all', ...QUIZ_LEVELS] as const).map(opt => {
            const active = quizFilter === opt
            return (
              <button
                key={opt}
                onClick={() => { setQuizFilter(opt); setQuizVisible(QUIZ_PAGE_SIZE) }}
                className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] px-3.5 py-1.5 rounded-full transition-colors min-h-[36px]"
                style={{
                  background: active ? 'rgba(245,158,11,0.12)' : 'transparent',
                  color: active ? 'var(--candlelight-gold)' : 'var(--text-muted)',
                  border: `1px solid ${active ? 'rgba(245,158,11,0.35)' : 'var(--hairline)'}`,
                }}
              >
                {opt === 'all' ? 'All' : opt}
              </button>
            )
          })}
        </div>

        {quizHistory.length === 0 ? (
          <EmptyState Icon={ClipboardIcon} primary="Шалгалтын түүх байхгүй" secondary="Түвшингийн тест өгсний дараа энд харагдана." />
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {quizHistory.slice(0, quizVisible).map(entry => (
                <div
                  key={entry.id}
                  className="rounded-xl p-4 flex items-center gap-4 border hairline"
                  style={{ background: 'var(--midnight-ink-surface)' }}
                >
                  <span
                    className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--candlelight-gold)', border: '1px solid rgba(245,158,11,0.25)' }}
                  >
                    {entry.level}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-sans font-semibold text-white text-sm nums-tabular">
                      {entry.score ?? 0}/{entry.total ?? 25}
                    </div>
                    <div className="font-sans text-[11px] mt-0.5 nums-tabular" style={{ color: 'var(--text-muted)' }}>
                      {formatMongolianDate(entry.date)}
                    </div>
                  </div>
                  <span className={`font-sans text-[10px] font-semibold tracking-[0.15em] uppercase px-2.5 py-1 rounded-full flex-shrink-0 ${
                    entry.passed
                      ? 'bg-emerald-500/[0.08] text-emerald-400 border border-emerald-500/25'
                      : 'bg-rose-500/[0.08] text-rose-400 border border-rose-500/25'
                  }`}>
                    {entry.passed ? 'Тэнцсэн' : 'Тэнцээгүй'}
                  </span>
                </div>
              ))}
            </div>
            {quizHistory.length > quizVisible ? (
              <button
                onClick={() => setQuizVisible(v => v + QUIZ_PAGE_SIZE)}
                className="w-full font-sans text-[11px] font-semibold uppercase tracking-[0.18em] py-3 min-h-[44px] rounded-xl mb-12 transition-colors"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--hairline)',
                  color: 'var(--text-secondary)',
                }}
              >
                Харах ({quizHistory.length - quizVisible})
              </button>
            ) : (
              <div className="mb-12" />
            )}
          </>
        )}

        {/* ── 03 · IELTS history ── */}
        <SectionHeader label="03" kicker="IELTS" title="IELTS Түүх" />

        {ieltsHistory.length === 0 ? (
          <EmptyState Icon={NotebookIcon} primary="IELTS түүх байхгүй" secondary="IELTS Mock Test өгсний дараа энд харагдана." />
        ) : (
          <div className="space-y-3 mb-12">
            {ieltsHistory.map(entry => (
              <IELTSHistoryRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>

      {selectedCert && (
        <CertificateModal
          level={selectedCert.level}
          score={selectedCert.score}
          total={selectedCert.total}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </div>
  )
}

function IELTSHistoryRow({ entry }: { entry: TestHistoryEntry }) {
  const [expanded, setExpanded] = useState(false)

  const band = entry.overallBand ?? entry.ieltsBand ?? 0
  const listening = entry.listeningScore ?? 0
  const reading = entry.readingScore ?? 0
  const writing = entry.writingBand ?? 0
  const speaking = entry.speakingBand ?? 0
  const wrongAnswers = entry.wrongAnswers ?? []
  const feedback = entry.feedback ?? ''

  const handleToggle = () => setExpanded(v => !v)

  return (
    <div
      className="rounded-2xl border hairline overflow-hidden"
      style={{ background: 'var(--midnight-ink-surface)' }}
    >
      <button
        onClick={handleToggle}
        className="w-full p-4 flex items-center gap-4 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 font-serif-display font-bold nums-tabular"
          style={{
            background: 'linear-gradient(135deg, var(--candlelight-gold-light), var(--candlelight-gold-dark))',
            color: 'var(--midnight-ink)',
            fontSize: 22,
            letterSpacing: '-0.02em',
          }}
        >
          {band}
        </div>
        <div className="flex-1 min-w-0">
          <div lang="en" className="font-sans font-semibold text-white text-sm">IELTS Mock Test</div>
          <div className="font-sans text-[11px] mt-0.5 nums-tabular" style={{ color: 'var(--text-muted)' }}>
            {formatMongolianDate(entry.date)}
          </div>
        </div>
        <span
          className="font-sans text-[10px] font-semibold tracking-[0.15em] uppercase flex-shrink-0 transition-transform"
          style={{
            color: 'var(--candlelight-gold)',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transformOrigin: 'center',
          }}
        >
          ▸
        </span>
      </button>

      <div
        className="overflow-hidden transition-[max-height,opacity] duration-300 ease-out"
        style={{
          maxHeight: expanded ? 2000 : 0,
          opacity: expanded ? 1 : 0,
        }}
      >
        <div className="px-4 pb-4 pt-1 border-t hairline">
          {/* Section scores */}
          <div className="grid grid-cols-2 gap-2 mt-3 mb-4">
            <ScoreCell label="Listening" value={`${listening}/10`} />
            <ScoreCell label="Reading" value={`${reading}/30`} />
            <ScoreCell label="Writing" value={`Band ${writing}`} />
            <ScoreCell label="Speaking" value={`Band ${speaking}`} />
          </div>

          {/* Wrong answers */}
          {wrongAnswers.length > 0 && (
            <div className="mb-4">
              <div className="font-sans text-[10px] font-semibold tracking-[0.18em] uppercase mb-2" style={{ color: 'var(--vellum-champagne)' }}>
                Алдсан асуултууд
              </div>
              <ul className="space-y-1.5">
                {wrongAnswers.slice(0, 10).map((w, i) => (
                  <li key={i} className="font-sans text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    • {w}
                  </li>
                ))}
                {wrongAnswers.length > 10 && (
                  <li className="font-sans text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    …+{wrongAnswers.length - 10} нэмэлт
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* AI feedback */}
          <div className="mb-4">
            <div className="font-sans text-[10px] font-semibold tracking-[0.18em] uppercase mb-2" style={{ color: 'var(--vellum-champagne)' }}>
              AI үнэлгээ
            </div>
            {feedback ? (
              <div className="font-sans text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                {feedback}
              </div>
            ) : (
              <div className="font-sans text-[13px]" style={{ color: 'var(--text-muted)' }}>
                Үнэлгээ байхгүй байна
              </div>
            )}
          </div>

          <a
            href="/ielts"
            className="inline-flex items-center justify-center font-sans text-[11px] font-semibold uppercase tracking-[0.18em] px-5 py-3 min-h-[44px] rounded-xl transition-transform hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, var(--candlelight-gold), var(--candlelight-gold-dark))',
              color: 'var(--midnight-ink)',
              boxShadow: '0 6px 20px rgba(245,158,11,0.28)',
            }}
          >
            Дахин өгөх
          </a>
        </div>
      </div>
    </div>
  )
}

function ScoreCell({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl px-3 py-3 text-center"
      style={{ background: '#0F1729', border: '1px solid var(--hairline)' }}
    >
      <div className="font-sans text-[10px] font-semibold tracking-[0.18em] uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div className="font-sans text-sm font-semibold nums-tabular" style={{ color: 'var(--candlelight-gold)' }}>
        {value}
      </div>
    </div>
  )
}

function SectionHeader({ label, kicker, title }: { label: string; kicker: string; title: string }) {
  return (
    <div className="flex items-end justify-between mb-5 border-b hairline pb-4">
      <div>
        <div className="font-sans text-[10px] font-semibold tracking-[0.22em] uppercase mb-1.5" style={{ color: 'var(--vellum-champagne)' }}>
          {kicker}
        </div>
        <h2 className="font-serif-display text-xl sm:text-2xl text-white leading-tight">
          {title}
        </h2>
      </div>
      <span className="font-serif-display italic nums-tabular text-sm" style={{ color: 'rgba(245,158,11,0.5)' }}>
        {label}
      </span>
    </div>
  )
}

function EmptyState({ Icon, primary, secondary }: { Icon: (p: { size?: number }) => JSX.Element; primary: string; secondary: string }) {
  return (
    <div className="text-center py-12 mb-12 border hairline rounded-2xl" style={{ background: 'var(--midnight-ink-surface)' }}>
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4" style={{
        color: 'var(--text-muted)',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--hairline)',
      }}>
        <Icon size={20} />
      </div>
      <p className="font-sans text-sm font-medium text-white mb-1.5">{primary}</p>
      <p className="font-sans text-xs max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>{secondary}</p>
    </div>
  )
}
