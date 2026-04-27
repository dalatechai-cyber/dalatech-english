'use client'
import type { IELTSContent } from '@/lib/ielts'
import { wordCount } from '@/lib/textUtils'
import { NavBar } from '../NavBar'
import { SectionProgress } from './ielts-shared'

function mmss(sec: number): string {
  const m = Math.floor(Math.max(0, sec) / 60)
  const s = Math.max(0, sec) % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function Task1Prompt({ prompt }: { prompt: string }) {
  const m = prompt.match(/<data-table>([\s\S]*?)<\/data-table>/)
  if (!m) return <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">{prompt}</p>
  const before = prompt.slice(0, prompt.indexOf('<data-table>')).trim()
  const after = prompt.slice(prompt.indexOf('</data-table>') + 13).trim()
  const rows = m[1].trim().split('\n').map(r => r.split('|'))
  const headers = rows[0]; const dataRows = rows.slice(1)
  return (
    <>
      {before && <p className="text-sm text-text-primary leading-relaxed mb-3">{before}</p>}
      <div className="overflow-x-auto rounded-xl mb-3">
        <table className="w-full text-xs border-collapse min-w-[280px]">
          <thead><tr>{headers.map((h, i) => <th key={i} className="px-3 py-2 text-left font-semibold text-midnight-ink whitespace-nowrap" style={{ background: '#F59E0B' }}>{h.trim()}</th>)}</tr></thead>
          <tbody>{dataRows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? '#1E293B' : '#162032' }}>
              {row.map((cell, ci) => <td key={ci} className="px-3 py-2 text-text-primary whitespace-nowrap" style={{ borderTop: '1px solid #334155' }}>{cell.trim()}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
      {after && <p className="text-sm text-text-primary leading-relaxed">{after}</p>}
    </>
  )
}

interface IELTSWritingProps {
  content: IELTSContent
  sectionIdx: number
  writingTask1: string
  setWritingTask1: (v: string) => void
  writingTask2: string
  setWritingTask2: (v: string) => void
  writingTaskView: 1 | 2
  setWritingTaskView: (v: 1 | 2) => void
  task1Remaining: number
  task2Remaining: number
  onAdvance: () => void
}

export function IELTSWriting({
  content,
  sectionIdx,
  writingTask1,
  setWritingTask1,
  writingTask2,
  setWritingTask2,
  writingTaskView,
  setWritingTaskView,
  task1Remaining,
  task2Remaining,
  onAdvance,
}: IELTSWritingProps) {
  return (
    <div className="min-h-dvh bg-midnight-ink flex flex-col">
      <NavBar lessonTitle={`Writing — Task ${writingTaskView}/2`} />
      <div className="flex-1 overflow-y-auto p-4 max-w-xl mx-auto w-full">
        <SectionProgress idx={sectionIdx} />
        <div className="flex gap-2 mb-5">
          {([1, 2] as const).map(task => {
            const active = writingTaskView === task
            return (
              <button
                key={task}
                onClick={() => setWritingTaskView(task)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-[0.18em] transition-all"
                style={
                  active
                    ? {
                        background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                        color: '#0B1222',
                        border: '1px solid transparent',
                        boxShadow: '0 4px 14px rgba(245,158,11,0.25)',
                      }
                    : {
                        background: '#0F1729',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--hairline)',
                      }
                }
              >
                Task {task}
              </button>
            )
          })}
        </div>
        {writingTaskView === 1 ? (
          <>
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-1"
                  style={{ color: 'var(--vellum-champagne)' }}
                >
                  Remaining
                </div>
                <span
                  className="font-serif-display text-3xl font-bold nums-tabular"
                  style={{ color: task1Remaining === 0 ? 'var(--candlelight-gold)' : 'var(--text-primary)', letterSpacing: '-0.02em' }}
                >
                  {mmss(task1Remaining)}
                </span>
              </div>
              {task1Remaining === 0 && (
                <span
                  className="text-[11px] font-serif-display italic max-w-[60%] text-right"
                  style={{ color: 'var(--candlelight-gold)' }}
                >
                  Цаг дууслаа — үргэлжлүүлж болно
                </span>
              )}
            </div>
            <div
              className="rounded-2xl p-5 mb-4 shadow-editorial"
              style={{
                background: '#141C30',
                border: '1px solid var(--hairline)',
                borderLeftWidth: '3px',
                borderLeftColor: 'var(--candlelight-gold)',
              }}
            >
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-3"
                style={{ color: 'var(--vellum-champagne)' }}
              >
                Task 01 · Minimum 150 words
              </div>
              <Task1Prompt prompt={content.writing.task1Prompt} />
            </div>
            <textarea
              value={writingTask1}
              onChange={e => setWritingTask1(e.target.value)}
              placeholder="Энд бичнэ үү..."
              rows={10}
              className="w-full rounded-xl p-4 text-sm resize-none outline-none mb-2 transition-all font-serif-display"
              style={{
                background: '#0F1729',
                border: '1px solid var(--hairline)',
                color: 'var(--text-primary)',
                lineHeight: 1.7,
              }}
              onFocus={e => {
                e.target.style.borderColor = 'var(--candlelight-gold)'
                e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.18)'
              }}
              onBlur={e => {
                e.target.style.borderColor = 'var(--hairline)'
                e.target.style.boxShadow = 'none'
              }}
            />
            <div className="flex justify-between text-[11px] uppercase tracking-wider mb-5">
              <span style={{ color: 'var(--text-muted)' }}>
                <span className="nums-tabular font-medium" style={{ color: 'var(--vellum-champagne)' }}>{wordCount(writingTask1)}</span> үг
              </span>
              <span
                className="font-medium"
                style={{ color: wordCount(writingTask1) >= 150 ? '#34D399' : 'var(--text-muted)' }}
              >
                {wordCount(writingTask1) >= 150 ? '150+ үг' : `${150 - wordCount(writingTask1)} үг дутуу`}
              </span>
            </div>
            <button
              onClick={() => setWritingTaskView(2)}
              className="w-full font-semibold py-3.5 min-h-[48px] rounded-xl text-sm uppercase tracking-[0.18em] transition-all hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#0B1222',
                boxShadow: '0 6px 20px rgba(245,158,11,0.28)',
              }}
            >
              Task 2
            </button>
          </>
        ) : (
          <>
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-1"
                  style={{ color: 'var(--vellum-champagne)' }}
                >
                  Remaining
                </div>
                <span
                  className="font-serif-display text-3xl font-bold nums-tabular"
                  style={{ color: task2Remaining === 0 ? 'var(--candlelight-gold)' : 'var(--text-primary)', letterSpacing: '-0.02em' }}
                >
                  {mmss(task2Remaining)}
                </span>
              </div>
              {task2Remaining === 0 && (
                <span
                  className="text-[11px] font-serif-display italic max-w-[60%] text-right"
                  style={{ color: 'var(--candlelight-gold)' }}
                >
                  Цаг дууслаа — үргэлжлүүлж болно
                </span>
              )}
            </div>
            <div
              className="rounded-2xl p-5 mb-4 shadow-editorial"
              style={{
                background: '#141C30',
                border: '1px solid var(--hairline)',
                borderLeftWidth: '3px',
                borderLeftColor: 'var(--candlelight-gold)',
              }}
            >
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-3"
                style={{ color: 'var(--vellum-champagne)' }}
              >
                Task 02 · Minimum 250 words
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {content.writing.task2Prompt}
              </p>
            </div>
            <textarea
              value={writingTask2}
              onChange={e => setWritingTask2(e.target.value)}
              placeholder="Энд бичнэ үү..."
              rows={12}
              className="w-full rounded-xl p-4 text-sm resize-none outline-none mb-2 transition-all font-serif-display"
              style={{
                background: '#0F1729',
                border: '1px solid var(--hairline)',
                color: 'var(--text-primary)',
                lineHeight: 1.7,
              }}
              onFocus={e => {
                e.target.style.borderColor = 'var(--candlelight-gold)'
                e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.18)'
              }}
              onBlur={e => {
                e.target.style.borderColor = 'var(--hairline)'
                e.target.style.boxShadow = 'none'
              }}
            />
            <div className="flex justify-between text-[11px] uppercase tracking-wider mb-5">
              <span style={{ color: 'var(--text-muted)' }}>
                <span className="nums-tabular font-medium" style={{ color: 'var(--vellum-champagne)' }}>{wordCount(writingTask2)}</span> үг
              </span>
              <span
                className="font-medium"
                style={{ color: wordCount(writingTask2) >= 250 ? '#34D399' : 'var(--text-muted)' }}
              >
                {wordCount(writingTask2) >= 250 ? '250+ үг' : `${250 - wordCount(writingTask2)} үг дутуу`}
              </span>
            </div>
            <button
              onClick={onAdvance}
              disabled={wordCount(writingTask2) < 250}
              className="w-full font-semibold py-3.5 min-h-[48px] rounded-xl text-sm uppercase tracking-[0.18em] transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
              style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#0B1222',
                boxShadow: '0 6px 20px rgba(245,158,11,0.28)',
              }}
            >
              <span lang="en">Speaking</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
