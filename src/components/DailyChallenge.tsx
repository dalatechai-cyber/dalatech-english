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
import { TrophyIcon, CheckCircleIcon, XCircleIcon } from './Icon'

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
    <section
      className="rounded-2xl p-6 sm:p-7 shadow-editorial relative overflow-hidden"
      style={{
        background: 'var(--midnight-ink-surface)',
        border: '1px solid var(--hairline)',
        borderLeftWidth: '3px',
        borderLeftColor: 'var(--candlelight-gold)',
      }}
    >
      <div
        className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at top right, rgba(245,158,11,0.10) 0%, transparent 60%)',
        }}
      />

      <div className="relative flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3">
          <span
            className="flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0 mt-0.5"
            style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--candlelight-gold)' }}
          >
            <TrophyIcon size={18} />
          </span>
          <div>
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-1"
              style={{ color: 'var(--vellum-champagne)' }}
            >
              Daily · Challenge
            </div>
            <h3
              className="font-serif-display text-xl sm:text-2xl font-medium leading-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {t('dailyChallenge')}
            </h3>
          </div>
        </div>
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.2em] rounded-full px-2.5 py-1 flex-shrink-0"
          style={{
            background: 'rgba(245,158,11,0.12)',
            color: 'var(--candlelight-gold)',
            border: '1px solid rgba(245,158,11,0.25)',
          }}
        >
          {q.level}
        </span>
      </div>

      <div
        className="h-px w-12 mb-5"
        style={{ background: 'linear-gradient(90deg, var(--candlelight-gold), transparent)' }}
      />

      <p
        className="text-[15px] leading-relaxed mb-5 font-medium"
        style={{ color: 'var(--text-primary)' }}
      >
        {q.question}
      </p>

      {q.type === 'mc' && q.options && (
        <div className="space-y-2 mb-5">
          {q.options.map((opt, i) => {
            let bg = '#0F1729'
            let border = 'var(--hairline)'
            let color = 'var(--text-primary)'
            if (submitted) {
              if (i === q.correct) {
                bg = 'rgba(52,211,153,0.08)'
                border = 'rgba(52,211,153,0.4)'
                color = '#34D399'
              } else if (i === selected && i !== q.correct) {
                bg = 'rgba(248,113,113,0.08)'
                border = 'rgba(248,113,113,0.4)'
                color = '#F87171'
              } else {
                color = 'var(--text-muted)'
              }
            } else if (selected === i) {
              bg = 'rgba(245,158,11,0.10)'
              border = 'var(--candlelight-gold)'
              color = 'var(--candlelight-gold)'
            }
            return (
              <button
                key={i}
                disabled={submitted}
                onClick={() => !submitted && setSelected(i)}
                className="w-full text-left px-4 py-3 rounded-xl transition-all text-sm flex items-center gap-3"
                style={{
                  background: bg,
                  border: `1px solid ${border}`,
                  color,
                }}
                onMouseEnter={e => {
                  if (submitted || selected === i) return
                  e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)'
                }}
                onMouseLeave={e => {
                  if (submitted || selected === i) return
                  e.currentTarget.style.borderColor = 'var(--hairline)'
                }}
              >
                <span
                  className="font-serif-display text-xs tracking-widest"
                  style={{ color: 'var(--vellum-champagne)' }}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1">{opt}</span>
              </button>
            )
          })}
        </div>
      )}

      {q.type === 'fill' && (
        <div className="mb-5">
          <input
            type="text"
            value={fillInput}
            onChange={e => setFillInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !submitted && handleSubmit()}
            disabled={submitted}
            placeholder={t('yourType')}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all disabled:opacity-60"
            style={{
              background: '#0F1729',
              border: '1px solid var(--hairline)',
              color: 'var(--text-primary)',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'var(--candlelight-gold)'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.18)'
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'var(--hairline)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
        </div>
      )}

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={q.type === 'mc' ? selected === null : !fillInput.trim()}
          className="w-full font-semibold py-3 min-h-[48px] rounded-xl transition-all text-sm uppercase tracking-[0.18em] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, var(--candlelight-gold) 0%, var(--candlelight-gold-dark) 100%)',
            color: 'var(--midnight-ink)',
            boxShadow: '0 4px 14px rgba(245,158,11,0.25)',
          }}
        >
          {t('submitAnswer')}
        </button>
      )}

      {submitted && (
        <>
          <div
            className="rounded-xl p-4 text-sm"
            style={{
              background: correct ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
              border: `1px solid ${correct ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
              color: correct ? '#34D399' : '#F87171',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              {correct ? <CheckCircleIcon size={18} /> : <XCircleIcon size={18} />}
              <span className="font-semibold uppercase tracking-[0.18em] text-[11px]">
                {correct ? t('correct') : t('wrong')}
              </span>
            </div>
            {!correct && (
              <div
                className="text-[13px] mb-1.5 flex gap-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span className="uppercase tracking-wider text-[10px] font-semibold flex-shrink-0 mt-0.5">
                  {t('correctAnswer')}
                </span>
                <span className="font-medium" style={{ color: '#34D399' }}>
                  {String(q.correct)}
                </span>
              </div>
            )}
            <div
              className="text-[13px] leading-relaxed italic font-serif-display"
              style={{ color: 'var(--text-secondary)' }}
            >
              {q.explanation}
            </div>
          </div>
          <p
            className="text-center text-[13px] font-serif-display italic mt-4"
            style={{ color: 'var(--vellum-champagne)' }}
          >
            Өнөөдрийн даалгавар дууссан. Маргааш дахин ирээрэй.
          </p>
        </>
      )}
    </section>
  )
}
