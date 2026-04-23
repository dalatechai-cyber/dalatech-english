'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { loadMistakes, type MistakeEntry } from '@/lib/mistakes'
import { t } from '@/lib/i18n'
import type { LevelCode } from '@/lib/types'
import { NotebookIcon, CheckCircleIcon, XCircleIcon, ArrowRightIcon } from './Icon'

const LEVELS: LevelCode[] = ['A1', 'A2', 'B1', 'B2', 'C1']

export function MistakeDiary() {
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([])
  const [filterLevel, setFilterLevel] = useState<LevelCode | 'all'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setMistakes(loadMistakes())
  }, [])

  const filtered = mistakes.filter(m => {
    const matchLevel = filterLevel === 'all' || m.level === filterLevel
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      m.original.toLowerCase().includes(q) ||
      m.corrected.toLowerCase().includes(q) ||
      m.explanation.toLowerCase().includes(q)
    return matchLevel && matchSearch
  })

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 page-enter-up">
      {/* Editorial header */}
      <div className="mb-10 sm:mb-12">
        <div
          className="text-[11px] font-semibold uppercase tracking-[0.22em] mb-3"
          style={{ color: 'var(--champagne)' }}
        >
          Mistake Journal
        </div>
        <h1
          className="font-serif-display text-4xl sm:text-5xl font-bold leading-none mb-3"
          style={{
            background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 50%, #E4C08A 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.02em',
          }}
        >
          {t('mistakes')}
        </h1>
        <div
          className="h-px w-16 mt-4"
          style={{ background: 'linear-gradient(90deg, var(--gold), transparent)' }}
        />
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('searchMistakes')}
          className="flex-1 rounded-xl px-4 py-3 text-sm outline-none transition-all"
          style={{
            background: '#141C30',
            border: '1px solid var(--hairline)',
            color: 'var(--text-primary)',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = 'var(--gold)'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.18)'
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = 'var(--hairline)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
        <select
          value={filterLevel}
          onChange={e => setFilterLevel(e.target.value as LevelCode | 'all')}
          className="w-full sm:w-auto rounded-xl px-4 py-3 text-sm outline-none transition-colors"
          style={{
            background: '#141C30',
            border: '1px solid var(--hairline)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="all">{t('allLevels')}</option>
          {LEVELS.map(l => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div
          className="text-center py-20 px-6 rounded-2xl shadow-editorial"
          style={{ background: '#141C30', border: '1px solid var(--hairline)' }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{
              background: 'rgba(245,158,11,0.08)',
              color: 'var(--gold)',
            }}
          >
            <NotebookIcon size={28} />
          </div>
          <h3
            className="font-serif-display text-xl mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Алдаа бүртгэгдээгүй
          </h3>
          <p className="text-sm leading-relaxed max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
            {t('noMistakes')} Чөлөөт яриа эсвэл хичээл эхлүүлбэл алдаанууд энд хадгалагдана.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((m, idx) => (
            <article
              key={m.id}
              className="rounded-2xl p-5 sm:p-6 shadow-editorial transition-all"
              style={{
                background: '#141C30',
                border: '1px solid var(--hairline)',
                borderLeftWidth: '3px',
                borderLeftColor: 'var(--gold)',
              }}
            >
              {/* Section number + meta */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className="font-serif-display text-xs nums-tabular tracking-widest"
                  style={{ color: 'var(--champagne)' }}
                >
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider">
                  <span
                    className="font-semibold rounded-full px-2.5 py-0.5"
                    style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--gold)' }}
                  >
                    {m.level}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>{m.date}</span>
                </div>
              </div>

              {/* Wrong */}
              <div className="flex items-start gap-3 mb-2.5">
                <span style={{ color: '#F87171' }} className="mt-0.5 flex-shrink-0">
                  <XCircleIcon size={18} />
                </span>
                <p
                  className="text-[15px] leading-relaxed line-through"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {m.original}
                </p>
              </div>

              {/* Correct */}
              <div className="flex items-start gap-3 mb-3">
                <span style={{ color: '#34D399' }} className="mt-0.5 flex-shrink-0">
                  <CheckCircleIcon size={18} />
                </span>
                <p
                  className="text-[15px] leading-relaxed font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {m.corrected}
                </p>
              </div>

              {m.explanation && (
                <div
                  className="text-[13px] leading-relaxed rounded-xl px-4 py-3 mt-3 italic font-serif-display"
                  style={{
                    background: 'rgba(245,158,11,0.06)',
                    color: 'var(--text-secondary)',
                    borderLeft: '2px solid rgba(245,158,11,0.4)',
                  }}
                >
                  {m.explanation}
                </div>
              )}

              <Link
                href={`/level/${m.level}/chat?drill=${encodeURIComponent(m.corrected)}`}
                className="inline-flex items-center gap-2 mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors hover:opacity-80"
                style={{ color: 'var(--gold)' }}
              >
                {t('practiceAgain')}
                <ArrowRightIcon size={14} />
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
