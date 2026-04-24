'use client'
import { useEffect, useRef } from 'react'
import type { IELTSContent, IELTSAnswer } from '@/lib/ielts'
import { NavBar } from '../NavBar'
import { SectionProgress, renderQuestionBody, isAnswered } from './ielts-shared'

interface IELTSReadingProps {
  content: IELTSContent
  sectionIdx: number
  readAnswers: IELTSAnswer[]
  setReadAnswers: (a: IELTSAnswer[]) => void
  readSubmitted: boolean
  setReadSubmitted: (v: boolean) => void
  readPassageIdx: number
  setReadPassageIdx: (i: number) => void
  readMobileTab: 'passage' | 'questions'
  setReadMobileTab: (t: 'passage' | 'questions') => void
  onAdvance: () => void
}

export function IELTSReading({
  content,
  sectionIdx,
  readAnswers,
  setReadAnswers,
  readSubmitted,
  setReadSubmitted,
  readPassageIdx,
  setReadPassageIdx,
  readMobileTab,
  setReadMobileTab,
  onAdvance,
}: IELTSReadingProps) {
  const passages = content.reading.passages
  const passageRef = useRef<HTMLDivElement>(null)
  const questionsRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (passageRef.current) passageRef.current.scrollTop = 0
    if (questionsRef.current) questionsRef.current.scrollTop = 0
  }, [readPassageIdx])
  // Reading content may still be loading (listening fetch completes first while
  // generate-content request is in flight). Show skeleton until passages arrive.
  if (passages.length === 0) {
    return (
      <div className="min-h-dvh bg-navy flex flex-col">
        <NavBar lessonTitle="Reading" />
        <div className="flex-1 overflow-y-auto p-4 max-w-xl mx-auto w-full">
          <SectionProgress idx={sectionIdx} />
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => <span key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#F59E0B', animationDelay: `${i * 0.15}s` }} />)}
            </div>
            <p className="text-xs font-semibold" style={{ color: '#F59E0B' }}>Нийтлэл ачааллаж байна...</p>
          </div>
          <div className="bg-navy-surface border border-navy-surface-2 rounded-2xl p-4 space-y-3">
            {[100, 95, 88, 92, 80, 96, 85, 90, 75].map((w, i) => (
              <div key={i} className="h-3 rounded animate-pulse" style={{ width: `${w}%`, background: '#1E293B' }} />
            ))}
          </div>
        </div>
      </div>
    )
  }
  const totalReadQs = passages.reduce((n, p) => n + p.questions.length, 0)
  const pi = Math.min(readPassageIdx, passages.length - 1)
  const pg = passages[pi]
  // Offset of current passage's first question in the flat readAnswers array.
  const startIdx = passages.slice(0, pi).reduce((n, p) => n + p.questions.length, 0)
  const pageAnswered = pg ? pg.questions.every((_, qi) => isAnswered(readAnswers[startIdx + qi])) : false
  const answeredOnPage = pg ? pg.questions.filter((_, qi) => isAnswered(readAnswers[startIdx + qi])).length : 0
  const isLastPassage = pi === passages.length - 1
  const allReadAnswered = readAnswers.length === totalReadQs && readAnswers.every(isAnswered)
  const totalAnswered = readAnswers.filter(isAnswered).length

  const advance = () => {
    if (isLastPassage) {
      setReadSubmitted(true)
    } else {
      setReadPassageIdx(pi + 1)
      setReadMobileTab('passage')
    }
  }

  const PassagePane = (
    <div
      ref={passageRef}
      className="bg-navy-surface border border-navy-surface-2 rounded-2xl h-full overflow-y-auto"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div
        className="text-xs font-semibold text-gold uppercase tracking-wide"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          backgroundColor: '#0F172A',
          padding: '12px 16px',
          marginBottom: '12px',
          borderBottom: '1px solid #334155',
        }}
      >
        📖 Нийтлэл {pi + 1}/{passages.length}
      </div>
      <p className="text-sm leading-relaxed text-text-primary whitespace-pre-line px-4 pb-4">{pg?.passage}</p>
    </div>
  )

  const advanceButton = !readSubmitted ? (
    <button onClick={advance} disabled={!pageAnswered}
      className="w-full font-bold py-3 min-h-[48px] rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}>
      {isLastPassage ? 'Хариултаа илгээх' : 'Дараагийн нийтлэл →'}
    </button>
  ) : (
    <button onClick={onAdvance}
      disabled={!allReadAnswered}
      className="w-full font-bold py-3 min-h-[48px] rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-40"
      style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}>
      Writing →
    </button>
  )

  const QuestionsPane = (
    <div className="bg-navy-surface border border-navy-surface-2 rounded-2xl h-full flex flex-col overflow-hidden">
      <div
        ref={questionsRef}
        className="flex-1 overflow-y-auto p-4"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="space-y-4">
          {pg?.questions.map((q, qi) => {
            const globalIdx = startIdx + qi
            const typeLabel = q.type === 'tfng' ? '· True/False/NG'
              : q.type === 'matching' ? '· Зохицуулах'
              : q.type === 'short' ? '· Богино хариулт'
              : q.type === 'fill' ? '· Нөхөх'
              : ''
            return (
              <div key={globalIdx}>
                <p className="text-sm font-semibold text-text-primary mb-3">
                  <span style={{ color: '#F59E0B' }}>{globalIdx + 1}.</span> {q.question}
                  {typeLabel && <span className="ml-2 text-xs font-medium" style={{ color: '#94A3B8' }}>{typeLabel}</span>}
                </p>
                {renderQuestionBody(q, globalIdx, readAnswers, setReadAnswers, readSubmitted)}
              </div>
            )
          })}
        </div>
      </div>
      {/* Desktop footer — stays pinned below the scroll area so the last question never hides behind it. Mobile uses a fixed bottom bar rendered outside this pane. */}
      <div className="hidden md:block border-t border-navy-surface-2 p-4 bg-navy-surface">
        {advanceButton}
      </div>
    </div>
  )

  return (
    <div className="h-dvh bg-navy flex flex-col overflow-hidden">
      <NavBar lessonTitle="Reading" />
      <div className="px-4 pt-3 pb-2 max-w-6xl mx-auto w-full flex-shrink-0 sticky top-0 z-10 bg-navy md:static">
        <SectionProgress idx={sectionIdx} />
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold" style={{ color: '#F59E0B' }}>НИЙТЛЭЛ {pi + 1}/{passages.length}</p>
          <p className="text-xs font-semibold" style={{ color: '#64748B' }}>{totalAnswered}/{totalReadQs} хариулсан · Буцах боломжгүй</p>
        </div>
        <div className="flex gap-1">
          {passages.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full" style={{ background: i < pi ? '#34D39988' : i === pi ? '#F59E0B' : '#334155' }} />
          ))}
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="md:hidden flex-1 flex flex-col px-4 pb-4 min-h-0" style={{ paddingBottom: readMobileTab === 'questions' ? 92 : 16 }}>

        <div
          className="flex border-b border-navy-surface-2 mb-3 flex-shrink-0"
          style={{
            position: 'sticky',
            top: 48,
            zIndex: 20,
            backgroundColor: '#0F172A',
          }}
        >
          <button onClick={() => setReadMobileTab('passage')}
            className="flex-1 py-2.5 min-h-[44px] text-sm font-semibold transition-colors"
            style={{
              color: readMobileTab === 'passage' ? '#F59E0B' : '#64748B',
              borderBottom: readMobileTab === 'passage' ? '2px solid #F59E0B' : '2px solid transparent',
            }}>
            📖 Нийтлэл
          </button>
          <button onClick={() => setReadMobileTab('questions')}
            className="flex-1 py-2.5 min-h-[44px] text-sm font-semibold transition-colors"
            style={{
              color: readMobileTab === 'questions' ? '#F59E0B' : '#64748B',
              borderBottom: readMobileTab === 'questions' ? '2px solid #F59E0B' : '2px solid transparent',
            }}>
            ❓ Асуулт ({answeredOnPage}/{pg?.questions.length ?? 0})
          </button>
        </div>
        <div className="flex-1 min-h-0" style={{ paddingTop: 4 }}>
          {readMobileTab === 'passage' ? PassagePane : QuestionsPane}
        </div>
      </div>

      {/* Desktop split screen — each pane scrolls independently */}
      <div className="hidden md:flex flex-1 gap-4 px-4 pb-4 max-w-6xl mx-auto w-full min-h-0">
        <div className="w-1/2 h-full">{PassagePane}</div>
        <div className="w-1/2 h-full">{QuestionsPane}</div>
      </div>

      {/* Mobile fixed advance bar — sits above tab bar, only on questions tab so it never covers the passage text. */}
      {readMobileTab === 'questions' && (
        <div
          className="md:hidden fixed left-0 right-0 border-t border-navy-surface-2 px-4 py-3"
          style={{ bottom: 0, background: '#0F172A', zIndex: 40, paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
        >
          {advanceButton}
        </div>
      )}
    </div>
  )
}
