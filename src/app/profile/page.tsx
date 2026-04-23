'use client'
import { useState, useEffect } from 'react'
import { NavBar } from '@/components/NavBar'
import { CertificateModal } from '@/components/CertificateModal'
import { loadCertificates, formatMongolianDate, type CertificateEntry } from '@/lib/certificates'
import { loadTestHistory, type TestHistoryEntry } from '@/lib/testHistory'
import { loadStreak } from '@/lib/streak'
import { loadIELTSResults, type IELTSResult } from '@/lib/ielts'
import { loadProgress } from '@/lib/storage'
import { t } from '@/lib/i18n'
import {
  FlameIcon,
  StarIcon,
  CheckCircleIcon,
  TrophyIcon,
  CertificateIcon,
  ClipboardIcon,
  NotebookIcon,
  ArrowRightIcon,
  BookIcon,
} from '@/components/Icon'

export default function ProfilePage() {
  const [certs, setCerts] = useState<CertificateEntry[]>([])
  const [testHistory, setTestHistory] = useState<TestHistoryEntry[]>([])
  const [ieltsHistory, setIeltsHistory] = useState<IELTSResult[]>([])
  const [streak, setStreak] = useState({ current: 0, longest: 0 })
  const [lessonsCompleted, setLessonsCompleted] = useState(0)
  const [passedExams, setPassedExams] = useState(0)
  const [selectedCert, setSelectedCert] = useState<CertificateEntry | null>(null)

  useEffect(() => {
    const loadedCerts = loadCertificates()
    const loadedHistory = loadTestHistory()
    setCerts(loadedCerts)
    setTestHistory(loadedHistory)
    setIeltsHistory(loadIELTSResults())
    const s = loadStreak()
    setStreak({ current: s.current, longest: s.longest })
    const progress = loadProgress()
    const lessons = Object.values(progress.levels).reduce(
      (sum, lp) => sum + (lp?.completedLessons?.length ?? 0),
      0,
    )
    setLessonsCompleted(lessons)
    setPassedExams(loadedCerts.length)
  }, [])

  const totalPoints = lessonsCompleted * 10 + passedExams * 50

  return (
    <div className="min-h-screen bg-navy">
      <NavBar />
      <div className="max-w-3xl mx-auto px-5 py-8 sm:py-12 page-enter-up">

        {/* Profile header — editorial */}
        <div className="mb-10 pb-8 border-b hairline">
          <div className="text-[11px] font-semibold tracking-[0.22em] uppercase mb-3" style={{ color: 'var(--champagne)' }}>
            Таны профайл
          </div>
          <h1 className="font-serif-display text-4xl sm:text-5xl text-white leading-tight">
            Дэвшлийн <em className="italic" style={{ color: 'var(--gold)' }}>хураангуй</em>
          </h1>
        </div>

        {/* Stats hero row — premium grid with hairline separators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.04] rounded-2xl overflow-hidden border hairline shadow-editorial mb-12">
          {[
            { Icon: FlameIcon, val: streak.current, label: 'Одоогийн streak' },
            { Icon: StarIcon, val: streak.longest, label: 'Дээд streak' },
            { Icon: CheckCircleIcon, val: lessonsCompleted, label: 'Хичээл' },
            { Icon: TrophyIcon, val: totalPoints, label: 'Нийт оноо' },
          ].map(s => (
            <div
              key={s.label}
              className="bg-navy-surface p-5 sm:p-6 transition-colors duration-300 hover:bg-navy-surface-2 relative"
            >
              <span
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg mb-4"
                style={{
                  color: 'var(--gold)',
                  background: 'rgba(245,158,11,0.06)',
                  border: '1px solid rgba(245,158,11,0.15)',
                }}
              >
                <s.Icon size={16} />
              </span>
              <div
                className="font-serif-display font-bold text-4xl sm:text-5xl nums-tabular leading-none mb-1.5"
                style={{
                  background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 60%, #E4C08A 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '-0.02em',
                }}
              >
                {s.val}
              </div>
              <div className="text-[11px] uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Certificates ── */}
        <SectionHeader label="01" kicker="Амжилт" title={t('certificates')} />

        {certs.length === 0 ? (
          <EmptyState Icon={CertificateIcon} primary={t('noCertificates')} secondary="Тест өгч 18/25 аваад гэрчилгээ аваарай." />
        ) : (
          <div className="space-y-2 mb-12">
            {certs.map(cert => (
              <button
                key={cert.id}
                onClick={() => setSelectedCert(cert)}
                className="w-full rounded-xl p-4 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-gold text-left group"
                style={{
                  background: 'linear-gradient(#141C30, #141C30) padding-box, linear-gradient(135deg, #F59E0B 0%, #E4C08A 50%, #D97706 100%) border-box',
                  border: '1px solid transparent',
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-serif-display font-bold text-navy nums-tabular"
                  style={{ background: 'linear-gradient(135deg, #FCD34D, #D97706)', fontSize: 18 }}
                >
                  {cert.level}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm mb-0.5" style={{ letterSpacing: '-0.01em' }}>
                    {cert.level} гэрчилгээ
                  </div>
                  <div className="text-[11px] nums-tabular" style={{ color: 'var(--text-muted)' }}>
                    {cert.score}/{cert.total} · {formatMongolianDate(cert.date)}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium flex-shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--gold)' }}>
                  Харах
                  <ArrowRightIcon size={14} />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Test History ── */}
        <SectionHeader label="02" kicker="Түүх" title="Шалгалтын түүх" />

        {testHistory.length === 0 ? (
          <EmptyState Icon={ClipboardIcon} primary="Шалгалтын түүх байхгүй" secondary="Тест эсвэл IELTS өгсний дараа энд харагдана." />
        ) : (
          <div className="space-y-2 mb-12">
            {testHistory.map(entry => (
              <div
                key={entry.id}
                className="rounded-xl p-4 flex items-center gap-4 border hairline transition-colors hover:bg-white/[0.02]"
                style={{ background: '#141C30' }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    color: 'var(--gold)',
                    background: 'rgba(245,158,11,0.06)',
                    border: '1px solid rgba(245,158,11,0.15)',
                  }}
                >
                  {entry.type === 'ielts' ? <NotebookIcon size={16} /> : <BookIcon size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm">
                    {entry.type === 'ielts' ? 'IELTS Mock Test' : `${entry.level} Тест`}
                  </div>
                  <div className="text-[11px] mt-0.5 nums-tabular" style={{ color: 'var(--text-muted)' }}>
                    {entry.type === 'ielts'
                      ? `Band ${entry.ieltsBand ?? '—'}`
                      : `${entry.score ?? 0}/${entry.total ?? 25}`}
                    {' · '}{formatMongolianDate(entry.date)}
                  </div>
                </div>
                {entry.type === 'quiz' && (
                  <span className={`text-[10px] font-semibold tracking-[0.15em] uppercase px-2.5 py-1 rounded-full flex-shrink-0 ${
                    entry.passed
                      ? 'bg-emerald-500/[0.08] text-emerald-400 border border-emerald-500/25'
                      : 'bg-rose-500/[0.08] text-rose-400 border border-rose-500/25'
                  }`}>
                    {entry.passed ? 'Тэнцсэн' : 'Тэнцээгүй'}
                  </span>
                )}
                {entry.type === 'ielts' && (
                  <span className={`text-[10px] font-semibold tracking-[0.15em] uppercase px-2.5 py-1 rounded-full flex-shrink-0 nums-tabular ${
                    (entry.ieltsBand ?? 0) >= 5
                      ? 'bg-emerald-500/[0.08] text-emerald-400 border border-emerald-500/25'
                      : 'bg-rose-500/[0.08] text-rose-400 border border-rose-500/25'
                  }`}>
                    Band {entry.ieltsBand ?? '—'}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── IELTS History ── */}
        {ieltsHistory.length > 0 && (
          <>
            <SectionHeader label="03" kicker="IELTS" title="IELTS түүх" />
            <div className="space-y-2">
              {ieltsHistory.map((r, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4 flex items-center gap-4 border hairline"
                  style={{ background: '#141C30' }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-serif-display font-bold text-navy text-lg flex-shrink-0 nums-tabular"
                    style={{ background: 'linear-gradient(135deg, #FCD34D, #D97706)' }}
                  >
                    {r.overall}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm">IELTS Overall Band</div>
                    <div className="text-[11px] mt-0.5 nums-tabular" style={{ color: 'var(--text-muted)' }}>
                      L {r.listening} · R {r.reading} · W {r.writing} · S {r.speaking}
                      <span className="opacity-60"> · {formatMongolianDate(r.date)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
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

function SectionHeader({ label, kicker, title }: { label: string; kicker: string; title: string }) {
  return (
    <div className="flex items-end justify-between mb-5 border-b hairline pb-4">
      <div>
        <div className="text-[10px] font-semibold tracking-[0.22em] uppercase mb-1.5" style={{ color: 'var(--champagne)' }}>
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
    <div className="text-center py-12 mb-12 border hairline rounded-2xl" style={{ background: '#141C30' }}>
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4" style={{
        color: 'var(--text-muted)',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--hairline)',
      }}>
        <Icon size={20} />
      </div>
      <p className="text-sm font-medium text-white mb-1.5">{primary}</p>
      <p className="text-xs max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>{secondary}</p>
    </div>
  )
}
