'use client'
import type { LevelCode } from '@/lib/types'

interface ExamScoreProps {
  content: string
  level: LevelCode
  onPassConfirmed: (score: number) => void
}

interface ParsedResult {
  score?: number
  total?: number
  passed?: boolean
  feedback?: string
  certificate?: string
  grammar?: number
  style?: number
  cohesion?: number
  vocabulary?: number
  bonus?: number
}

export function parseExamResult(text: string): ParsedResult | null {
  const match = text.match(/<exam-result>([\s\S]*?)<\/exam-result>/)
  if (!match) return null
  const block = match[1]

  const get = (key: string) => {
    const m = new RegExp(`${key}:\\s*(.+)`, 'i').exec(block)
    return m?.[1]?.trim()
  }

  const scoreStr = get('SCORE') ?? get('TOTAL')
  const [scoreNum, totalNum] = scoreStr?.split('/') ?? []
  const passStr = get('PASS')

  const parseFirstNumber = (raw: string | undefined): number | undefined => {
    if (!raw) return undefined
    const n = parseInt(raw.split('/')[0] ?? '')
    return Number.isNaN(n) ? undefined : n
  }

  const grammarRaw = get('GRAMMAR')
  const styleRaw = get('STYLE')
  const cohesionRaw = get('COHESION')
  const vocabularyRaw = get('VOCABULARY')
  const bonusRaw = get('BONUS')

  return {
    score: scoreNum ? parseInt(scoreNum) : undefined,
    total: totalNum ? parseInt(totalNum) : undefined,
    passed: passStr?.toLowerCase() === 'true',
    feedback: get('FEEDBACK'),
    certificate: get('CERTIFICATE'),
    grammar: parseFirstNumber(grammarRaw),
    style: parseFirstNumber(styleRaw),
    cohesion: parseFirstNumber(cohesionRaw),
    vocabulary: parseFirstNumber(vocabularyRaw),
    bonus: bonusRaw ? parseInt(bonusRaw) : undefined,
  }
}

export function ExamScore({ content, level: _level, onPassConfirmed }: ExamScoreProps) {
  const result = parseExamResult(content)
  if (!result || result.score === undefined) return null

  const pct = result.total ? Math.round((result.score / result.total) * 100) : 0

  return (
    <div className="mt-4 bg-midnight-ink-surface border border-midnight-ink-elevated rounded-2xl p-5 space-y-4 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="text-3xl font-bold text-candlelight-gold">{result.score}/{result.total ?? 15}</div>
        <div className="flex-1">
          <div className="w-full h-3 bg-midnight-ink-elevated rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${result.passed ? 'bg-emerald-500' : 'bg-rose-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className={`text-xs mt-1 font-medium ${result.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
            {result.passed ? '✓ Тэнцсэн' : '✗ Тэнцээгүй'}
          </div>
        </div>
      </div>

      {result.grammar !== undefined && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          {([['Дүрэм', result.grammar], ['Хэв шинж', result.style], ['Нэгдэл', result.cohesion], ['Үгийн сан', result.vocabulary]] as [string, number | undefined][]).map(([label, val]) => (
            <div key={label} className="bg-midnight-ink-elevated rounded-lg p-2 text-center">
              <div className="text-text-secondary text-xs">{label}</div>
              <div className="text-candlelight-gold font-bold">{val}/5</div>
            </div>
          ))}
        </div>
      )}

      {result.certificate && (
        <div className="border border-candlelight-gold/40 bg-candlelight-gold/5 rounded-xl p-4 text-center">
          <div className="text-candlelight-gold text-lg font-bold mb-2">🎓 Гэрчилгээ</div>
          <p className="text-sm text-text-primary">{result.certificate}</p>
        </div>
      )}

      {result.feedback && (
        <div className="text-sm text-text-secondary leading-relaxed">{result.feedback}</div>
      )}

      {result.passed && (
        <button
          onClick={() => onPassConfirmed(result.score!)}
          className="w-full py-3 bg-candlelight-gold hover:bg-candlelight-gold-dark text-midnight-ink font-bold rounded-xl transition-colors"
        >
          Дараагийн түвшин рүү →
        </button>
      )}
    </div>
  )
}
