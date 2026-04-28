import type { IELTSAnswer, IELTSQuestion } from '@/lib/ielts'

export function isAnswered(a: IELTSAnswer): boolean {
  if (typeof a === 'number') return true
  if (typeof a === 'string') return a.trim().length > 0
  return false
}

export function SectionProgress({ idx }: { idx: number }) {
  const labels = ['Listening', 'Reading', 'Writing', 'Speaking']
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2 text-[10px] uppercase tracking-[0.2em]">
        <span lang="en" style={{ color: 'var(--vellum-champagne)' }}>
          Section {String(Math.min(idx + 1, 4)).padStart(2, '0')} · {labels[Math.min(idx, 3)]}
        </span>
        <span
          className="nums-tabular font-medium"
          style={{ color: 'var(--text-muted)' }}
        >
          {Math.min(idx + 1, 4)}/4
        </span>
      </div>
      <div className="flex gap-1">
        {labels.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <div
              className="h-full transition-all duration-500"
              style={{
                width: i <= idx ? '100%' : '0%',
                background:
                  i < idx
                    ? 'linear-gradient(90deg, var(--candlelight-gold-dark) 0%, var(--candlelight-gold) 50%, var(--candlelight-gold-light) 100%)'
                    : i === idx
                    ? 'linear-gradient(90deg, var(--candlelight-gold), var(--vellum-champagne))'
                    : 'transparent',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export function renderQuestionBody(
  q: IELTSQuestion,
  globalIdx: number,
  answers: IELTSAnswer[],
  setAnswers: (a: IELTSAnswer[]) => void,
  submitted: boolean,
) {
  const type = q.type ?? 'mc'
  const ans = answers[globalIdx]
  const update = (v: IELTSAnswer) => {
    if (submitted) return
    const a = [...answers]
    a[globalIdx] = v
    setAnswers(a)
  }

  if (type === 'fill' || type === 'short') {
    const text = typeof ans === 'string' ? ans : ''
    const normalize = (s: string) =>
      s.toLowerCase().trim().replace(/[.,!?;:"'`]/g, '').replace(/\s+/g, ' ')
    const nt = normalize(text)
    const isCorrect = submitted && nt.length > 0 && !!q.acceptedAnswers?.some(acc => {
      const na = normalize(acc)
      return na === nt || nt.includes(na) || na.includes(nt)
    })
    const borderColor = !submitted ? '#334155' : isCorrect ? '#34D399' : '#F87171'
    const textColor = !submitted ? 'var(--text-primary)' : isCorrect ? '#34D399' : '#F87171'
    return (
      <div>
        <input
          type="text"
          value={text}
          onChange={e => update(e.target.value)}
          disabled={submitted}
          placeholder="Хариулт (макс 3 үг)"
          maxLength={50}
          className="w-full min-h-[44px] rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{ background: '#1E293B', border: `1px solid ${borderColor}`, color: textColor }}
        />
        {submitted && !isCorrect && q.acceptedAnswers && q.acceptedAnswers.length > 0 && (
          <p className="text-xs mt-2" style={{ color: '#94A3B8' }}>
            Зөв: <span style={{ color: '#34D399' }}>{q.acceptedAnswers[0]}</span>
          </p>
        )}
      </div>
    )
  }

  const opts = q.options ?? []
  return (
    <div className="space-y-2">
      {opts.map((opt, oi) => {
        const selected = ans === oi
        const correct = submitted && oi === q.correct
        const wrong = submitted && selected && oi !== q.correct
        const neutral = submitted && !selected && oi !== q.correct
        return (
          <button key={oi}
            onClick={() => update(oi)}
            disabled={submitted}
            className="w-full text-left px-4 py-2.5 min-h-[44px] flex items-center rounded-xl border text-sm transition-all"
            style={{
              background: correct ? 'rgba(52,211,153,0.1)' : wrong ? 'rgba(248,113,113,0.1)' : selected ? 'rgba(245,158,11,0.08)' : 'transparent',
              borderColor: correct ? '#34D399' : wrong ? '#F87171' : selected ? 'var(--candlelight-gold)' : '#334155',
              color: neutral ? 'var(--text-muted)' : correct ? '#34D399' : wrong ? '#F87171' : 'var(--text-primary)',
            }}>
            <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}
          </button>
        )
      })}
    </div>
  )
}
