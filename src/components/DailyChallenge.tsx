'use client'
import { useState, useEffect } from 'react'
import {
  getDailyChallenge,
  isDailyCompleted,
  saveDailyAnswer,
  getDailyAnswer,
  type DailyChallengeQ,
} from '@/lib/dailyChallenges'
import { t } from '@/lib/i18n'

export function DailyChallenge() {
  const [q, setQ] = useState<DailyChallengeQ | null>(null)
  const [selected, setSelected] = useState<number | string | null>(null)
  const [fillInput, setFillInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [, setAlreadyDone] = useState(false)
  const [correct, setCorrect] = useState<boolean | null>(null)

  useEffect(() => {
    const question = getDailyChallenge()
    setQ(question)
    const done = isDailyCompleted()
    setAlreadyDone(done)
    if (done) {
      const saved = getDailyAnswer()
      if (saved !== null) {
        if (question.type === 'mc') {
          setSelected(parseInt(saved))
        } else {
          setFillInput(saved)
        }
        setSubmitted(true)
        if (question.type === 'mc') {
          setCorrect(parseInt(saved) === question.correct)
        } else {
          setCorrect(saved.toLowerCase().trim() === String(question.correct).toLowerCase().trim())
        }
      }
    }
  }, [])

  const handleSubmit = () => {
    if (!q) return
    if (q.type === 'mc') {
      if (selected === null) return
      const isCorrect = selected === q.correct
      setCorrect(isCorrect)
      saveDailyAnswer(String(selected))
    } else {
      if (!fillInput.trim()) return
      const isCorrect = fillInput.toLowerCase().trim() === String(q.correct).toLowerCase().trim()
      setCorrect(isCorrect)
      saveDailyAnswer(fillInput.trim())
    }
    setSubmitted(true)
    setAlreadyDone(true)
  }

  if (!q) return null

  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        border: '1px solid rgba(245,158,11,0.35)',
        boxShadow: '0 0 30px rgba(245,158,11,0.08)',
      }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-2xl pointer-events-none" />
      <div className="relative flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-lg flex-shrink-0">
          🏅
        </div>
        <div>
          <div className="text-gold font-bold text-sm">{t('dailyChallenge')}</div>
          <div className="text-xs text-text-secondary/70">Өдөр бүр шинэ асуулт</div>
        </div>
        <span className="ml-auto text-xs font-bold text-gold bg-gold/10 border border-gold/25 rounded-full px-2.5 py-0.5">{q.level}</span>
      </div>
      <div className="relative">

      <p className="text-text-primary font-medium mb-4">{q.question}</p>

      {q.type === 'mc' && q.options && (
        <div className="space-y-2 mb-4">
          {q.options.map((opt, i) => {
            let style = 'border-navy-surface-2 text-text-primary hover:border-gold/40'
            if (submitted) {
              if (i === q.correct) style = 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
              else if (i === selected && i !== q.correct) style = 'border-rose-500 bg-rose-500/10 text-rose-400'
              else style = 'border-navy-surface-2 text-text-secondary opacity-50'
            } else if (selected === i) {
              style = 'border-gold bg-gold/10 text-gold'
            }
            return (
              <button
                key={i}
                disabled={submitted}
                onClick={() => !submitted && setSelected(i)}
                className={`w-full text-left px-4 py-2.5 rounded-xl border transition-colors text-sm ${style}`}
              >
                {String.fromCharCode(65 + i)}. {opt}
              </button>
            )
          })}
        </div>
      )}

      {q.type === 'fill' && (
        <div className="mb-4">
          <input
            type="text"
            value={fillInput}
            onChange={e => setFillInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !submitted && handleSubmit()}
            disabled={submitted}
            placeholder={t('yourType')}
            className="w-full bg-navy border border-navy-surface-2 focus:border-gold/40 focus:ring-2 focus:ring-amber-400 rounded-xl px-4 py-2.5 text-text-primary text-sm outline-none transition-colors disabled:opacity-60"
          />
        </div>
      )}

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={q.type === 'mc' ? selected === null : !fillInput.trim()}
          className="w-full bg-gold hover:bg-gold-dark disabled:opacity-40 text-navy font-semibold py-2.5 rounded-xl transition-colors text-sm"
        >
          {t('submitAnswer')}
        </button>
      )}

      {submitted && (
        <>
          <div className={`rounded-xl p-3 text-sm ${correct ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'}`}>
            <div className="font-semibold mb-1">
              {correct ? `✅ ${t('correct')}` : `❌ ${t('wrong')}`}
            </div>
            {!correct && (
              <div className="text-xs mb-1 text-text-secondary">
                {t('correctAnswer')}: <span className="text-emerald-400 font-medium">{String(q.correct)}</span>
              </div>
            )}
            <div className="text-xs text-text-secondary">{q.explanation}</div>
          </div>
          <p className="text-center text-sm font-semibold text-gold mt-3">
            ✅ Өнөөдрийн даалгавар дууссан. Маргааш дахин ирээрэй!
          </p>
        </>
      )}
      </div>
    </div>
  )
}
