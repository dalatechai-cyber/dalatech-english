'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { loadMistakes, type MistakeEntry } from '@/lib/mistakes'
import { t } from '@/lib/i18n'
import type { LevelCode } from '@/lib/types'

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
    const matchSearch = !q || m.original.toLowerCase().includes(q) || m.corrected.toLowerCase().includes(q) || m.explanation.toLowerCase().includes(q)
    return matchLevel && matchSearch
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gold mb-6">📓 {t('mistakes')}</h1>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('searchMistakes')}
            className="flex-1 bg-navy-surface border border-navy-surface-2 focus:border-gold/40 focus:ring-2 focus:ring-amber-400 rounded-xl px-4 py-2.5 text-text-primary text-sm outline-none"
          />
          <select
            value={filterLevel}
            onChange={e => setFilterLevel(e.target.value as LevelCode | 'all')}
            className="w-full sm:w-auto bg-navy-surface border border-navy-surface-2 focus:ring-2 focus:ring-amber-400 rounded-xl px-4 py-2.5 text-text-primary text-sm outline-none"
          >
            <option value="all">{t('allLevels')}</option>
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center text-text-secondary py-16">{t('noMistakes')}</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(m => (
              <div key={m.id} className="bg-navy-surface border border-navy-surface-2 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-gold bg-gold/10 rounded-full px-2 py-0.5">{m.level}</span>
                  <span className="text-xs text-text-secondary">{m.date}</span>
                </div>
                <div className="space-y-1.5 mb-3">
                  <div className="text-sm">
                    <span className="text-rose-400 mr-2">❌</span>
                    <span className="text-text-secondary line-through">{m.original}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-emerald-400 mr-2">✅</span>
                    <span className="text-text-primary font-medium">{m.corrected}</span>
                  </div>
                  {m.explanation && (
                    <div className="text-xs text-text-secondary bg-navy rounded-lg px-3 py-2 mt-2">
                      💡 {m.explanation}
                    </div>
                  )}
                </div>
                <Link
                  href={`/level/${m.level}/chat?drill=${encodeURIComponent(m.corrected)}`}
                  className="text-xs text-gold hover:text-gold-light transition-colors"
                >
                  🔄 {t('practiceAgain')}
                </Link>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
