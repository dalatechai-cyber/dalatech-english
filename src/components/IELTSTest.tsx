'use client'
import { useState } from 'react'
import { NavBar } from './NavBar'
import type { IELTSContent, IELTSAnswers } from '@/lib/ielts'
import { saveIELTSResult } from '@/lib/ielts'

type Phase = 'intro' | 'loading' | 'listening' | 'reading' | 'writing' | 'speaking' | 'grading' | 'results'

interface GradeResult {
  overall: number
  listening: number
  reading: number
  writing: number
  speaking: number
  writingFeedback: string
  speakingFeedback: string
}

function bandColor(band: number): string {
  if (band >= 7) return 'text-emerald-400'
  if (band >= 5) return 'text-gold'
  return 'text-rose-400'
}

export function IELTSTest() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState<IELTSContent | null>(null)
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null)

  // Listening state
  const [listenIndex, setListenIndex] = useState(0)
  const [listenAnswers, setListenAnswers] = useState<(number | null)[]>(Array(6).fill(null))
  const [listenSelected, setListenSelected] = useState<number | null>(null)
  const [listenAnswered, setListenAnswered] = useState(false)

  // Reading state
  const [readIndex, setReadIndex] = useState(0)
  const [readAnswers, setReadAnswers] = useState<(number | null)[]>(Array(8).fill(null))
  const [readSelected, setReadSelected] = useState<number | null>(null)
  const [readAnswered, setReadAnswered] = useState(false)

  // Writing state
  const [writingTask1, setWritingTask1] = useState('')
  const [writingTask2, setWritingTask2] = useState('')
  const [writingTaskView, setWritingTaskView] = useState<1 | 2>(1)

  // Speaking state
  const [speakPart, setSpeakPart] = useState<1 | 2 | 3>(1)
  const [speakPart1, setSpeakPart1] = useState(['', '', ''])
  const [speakPart2, setSpeakPart2] = useState('')
  const [speakPart3, setSpeakPart3] = useState(['', '', ''])

  const startTest = async () => {
    setPhase('loading')
    setError(null)
    try {
      const res = await fetch('/api/ielts/generate', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to generate test')
      const data = await res.json() as IELTSContent
      if (!data.listening || !data.reading || !data.writing || !data.speaking) throw new Error('Invalid test data')
      setContent(data)
      setListenAnswers(Array(data.listening.questions.length).fill(null))
      setReadAnswers(Array(data.reading.questions.length).fill(null))
      setSpeakPart1(Array(data.speaking.part1Questions.length).fill(''))
      setSpeakPart3(Array(data.speaking.part3Questions.length).fill(''))
      setPhase('listening')
    } catch {
      setError('Тест ачаалахад алдаа гарлаа. Дахин оролдоно уу.')
      setPhase('intro')
    }
  }

  const submitTest = async () => {
    if (!content) return
    setPhase('grading')
    const answers: IELTSAnswers = {
      listeningAnswers: listenAnswers,
      readingAnswers: readAnswers,
      writingTask1,
      writingTask2,
      speakingPart1: speakPart1,
      speakingPart2: speakPart2,
      speakingPart3: speakPart3,
    }
    try {
      const res = await fetch('/api/ielts/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, answers }),
      })
      const result = await res.json() as GradeResult
      setGradeResult(result)
      saveIELTSResult({
        date: new Date().toISOString().slice(0, 10),
        overall: result.overall,
        listening: result.listening,
        reading: result.reading,
        writing: result.writing,
        speaking: result.speaking,
        feedback: result.writingFeedback,
      })
    } catch {
      setError('Үнэлгээ хийхэд алдаа гарлаа.')
    }
    setPhase('results')
  }

  // ─── Intro ───
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-navy flex flex-col">
        <NavBar lessonTitle="IELTS Mock Test" />
        <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-lg mx-auto w-full text-center">
          <div className="text-5xl mb-4">📝</div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">IELTS Дүрэм тест</h1>
          <p className="text-text-secondary text-sm mb-6">4 хэсэгтэй бүтэн тест: Listening, Reading, Writing, Speaking. Дуусгасны дараа 1-9 оноо авна.</p>
          {error && <p className="text-rose-400 text-sm mb-4">{error}</p>}
          <div className="grid grid-cols-2 gap-3 w-full mb-8">
            {[
              { icon: '🎧', label: 'Listening', detail: '6 асуулт' },
              { icon: '📖', label: 'Reading', detail: '8 асуулт' },
              { icon: '✍️', label: 'Writing', detail: 'Task 1 + Task 2' },
              { icon: '🗣️', label: 'Speaking', detail: '3 хэсэг' },
            ].map(s => (
              <div key={s.label} className="bg-navy-surface border border-navy-surface-2 rounded-xl p-3 text-left">
                <div className="text-xl mb-1">{s.icon}</div>
                <div className="text-text-primary text-sm font-semibold">{s.label}</div>
                <div className="text-text-secondary text-xs">{s.detail}</div>
              </div>
            ))}
          </div>
          <button
            onClick={startTest}
            className="w-full bg-gold hover:bg-gold-dark text-navy font-bold py-3 min-h-[48px] rounded-xl transition-colors"
          >
            Тест эхлэх →
          </button>
        </div>
      </div>
    )
  }

  // ─── Loading / Grading ───
  if (phase === 'loading' || phase === 'grading') {
    return (
      <div className="min-h-screen bg-navy flex flex-col">
        <NavBar lessonTitle="IELTS Mock Test" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="flex gap-1 justify-center mb-4">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-3 h-3 bg-gold rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <p className="text-text-secondary text-sm">
              {phase === 'loading' ? 'Тест бэлдэж байна...' : 'Үнэлж байна...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ─── Listening ───
  if (phase === 'listening' && content) {
    const q = content.listening.questions[listenIndex]
    return (
      <div className="min-h-screen bg-navy flex flex-col">
        <NavBar lessonTitle={`Listening — ${listenIndex + 1}/${content.listening.questions.length}`} />
        <div className="flex-1 overflow-y-auto p-6 max-w-lg mx-auto w-full">
          <div className="bg-navy-surface border border-navy-surface-2 rounded-xl p-4 mb-5">
            <div className="text-xs text-gold font-semibold mb-2 uppercase tracking-wide">🎧 Transcript</div>
            <p className="text-text-primary text-sm leading-relaxed">{content.listening.transcript}</p>
          </div>
          <div className="text-xs text-text-secondary mb-3">Асуулт {listenIndex + 1}/{content.listening.questions.length}</div>
          <h2 className="text-base font-semibold text-text-primary mb-5">{q.question}</h2>
          <div className="space-y-3 mb-6">
            {q.options.map((opt, i) => {
              let style = 'border-navy-surface-2 text-text-primary hover:border-gold/40 cursor-pointer'
              if (listenAnswered) {
                if (i === q.correct) style = 'border-emerald-500 bg-emerald-500/10 text-emerald-400 cursor-default'
                else if (i === listenSelected) style = 'border-rose-500 bg-rose-500/10 text-rose-400 cursor-default'
                else style = 'border-navy-surface-2 text-text-secondary opacity-50 cursor-default'
              }
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (listenAnswered) return
                    setListenSelected(i)
                    const a = [...listenAnswers]; a[listenIndex] = i; setListenAnswers(a)
                    setListenAnswered(true)
                  }}
                  disabled={listenAnswered}
                  className={`w-full text-left px-4 py-3 min-h-[48px] flex items-center rounded-xl border transition-all text-sm ${style}`}
                >
                  <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
                </button>
              )
            })}
          </div>
          {listenAnswered && (
            <button
              onClick={() => {
                if (listenIndex < content.listening.questions.length - 1) {
                  setListenIndex(p => p + 1)
                  setListenSelected(null)
                  setListenAnswered(false)
                } else {
                  setPhase('reading')
                  setReadIndex(0)
                  setReadSelected(null)
                  setReadAnswered(false)
                }
              }}
              className="w-full bg-gold hover:bg-gold-dark text-navy font-bold py-3 min-h-[48px] rounded-xl transition-colors"
            >
              {listenIndex < content.listening.questions.length - 1 ? 'Дараагийн →' : 'Reading →'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ─── Reading ───
  if (phase === 'reading' && content) {
    const q = content.reading.questions[readIndex]
    return (
      <div className="min-h-screen bg-navy flex flex-col">
        <NavBar lessonTitle={`Reading — ${readIndex + 1}/${content.reading.questions.length}`} />
        <div className="flex-1 overflow-y-auto p-6 max-w-lg mx-auto w-full">
          <div className="bg-navy-surface border border-navy-surface-2 rounded-xl p-4 mb-5">
            <div className="text-xs text-gold font-semibold mb-2 uppercase tracking-wide">📖 Passage</div>
            <p className="text-text-primary text-sm leading-relaxed">{content.reading.passage}</p>
          </div>
          <div className="text-xs text-text-secondary mb-3">Асуулт {readIndex + 1}/{content.reading.questions.length}</div>
          <h2 className="text-base font-semibold text-text-primary mb-5">{q.question}</h2>
          <div className="space-y-3 mb-6">
            {q.options.map((opt, i) => {
              let style = 'border-navy-surface-2 text-text-primary hover:border-gold/40 cursor-pointer'
              if (readAnswered) {
                if (i === q.correct) style = 'border-emerald-500 bg-emerald-500/10 text-emerald-400 cursor-default'
                else if (i === readSelected) style = 'border-rose-500 bg-rose-500/10 text-rose-400 cursor-default'
                else style = 'border-navy-surface-2 text-text-secondary opacity-50 cursor-default'
              }
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (readAnswered) return
                    setReadSelected(i)
                    const a = [...readAnswers]; a[readIndex] = i; setReadAnswers(a)
                    setReadAnswered(true)
                  }}
                  disabled={readAnswered}
                  className={`w-full text-left px-4 py-3 min-h-[48px] flex items-center rounded-xl border transition-all text-sm ${style}`}
                >
                  <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
                </button>
              )
            })}
          </div>
          {readAnswered && (
            <button
              onClick={() => {
                if (readIndex < content.reading.questions.length - 1) {
                  setReadIndex(p => p + 1)
                  setReadSelected(null)
                  setReadAnswered(false)
                } else {
                  setPhase('writing')
                }
              }}
              className="w-full bg-gold hover:bg-gold-dark text-navy font-bold py-3 min-h-[48px] rounded-xl transition-colors"
            >
              {readIndex < content.reading.questions.length - 1 ? 'Дараагийн →' : 'Writing →'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ─── Writing ───
  if (phase === 'writing' && content) {
    return (
      <div className="min-h-screen bg-navy flex flex-col">
        <NavBar lessonTitle={`Writing — Task ${writingTaskView}/2`} />
        <div className="flex-1 overflow-y-auto p-6 max-w-lg mx-auto w-full">
          {/* Task tabs */}
          <div className="flex gap-2 mb-5">
            {([1, 2] as const).map(task => (
              <button
                key={task}
                onClick={() => setWritingTaskView(task)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors border ${writingTaskView === task ? 'bg-gold text-navy border-gold' : 'bg-navy-surface text-text-secondary border-navy-surface-2 hover:border-gold/40'}`}
              >
                Task {task}
              </button>
            ))}
          </div>

          {writingTaskView === 1 ? (
            <>
              <div className="bg-navy-surface border border-navy-surface-2 rounded-xl p-4 mb-4">
                <div className="text-xs text-gold font-semibold mb-2 uppercase tracking-wide">✍️ Task 1 — дор хаяж 150 үг</div>
                <p className="text-text-primary text-sm leading-relaxed">{content.writing.task1Prompt}</p>
              </div>
              <textarea
                value={writingTask1}
                onChange={e => setWritingTask1(e.target.value)}
                placeholder="Энд бичнэ үү..."
                rows={8}
                className="w-full bg-navy-surface border border-navy-surface-2 rounded-xl p-4 text-text-primary text-sm resize-none focus:outline-none focus:border-gold/50 mb-2"
              />
              <div className="text-xs text-text-secondary mb-4">{writingTask1.trim().split(/\s+/).filter(Boolean).length} үг</div>
              <button
                onClick={() => setWritingTaskView(2)}
                className="w-full bg-gold hover:bg-gold-dark text-navy font-bold py-3 min-h-[48px] rounded-xl transition-colors"
              >
                Task 2 →
              </button>
            </>
          ) : (
            <>
              <div className="bg-navy-surface border border-navy-surface-2 rounded-xl p-4 mb-4">
                <div className="text-xs text-gold font-semibold mb-2 uppercase tracking-wide">✍️ Task 2 — дор хаяж 250 үг</div>
                <p className="text-text-primary text-sm leading-relaxed">{content.writing.task2Prompt}</p>
              </div>
              <textarea
                value={writingTask2}
                onChange={e => setWritingTask2(e.target.value)}
                placeholder="Энд бичнэ үү..."
                rows={10}
                className="w-full bg-navy-surface border border-navy-surface-2 rounded-xl p-4 text-text-primary text-sm resize-none focus:outline-none focus:border-gold/50 mb-2"
              />
              <div className="text-xs text-text-secondary mb-4">{writingTask2.trim().split(/\s+/).filter(Boolean).length} үг</div>
              <button
                onClick={() => setPhase('speaking')}
                disabled={writingTask2.trim().split(/\s+/).filter(Boolean).length < 10}
                className="w-full bg-gold hover:bg-gold-dark disabled:opacity-40 disabled:cursor-not-allowed text-navy font-bold py-3 min-h-[48px] rounded-xl transition-colors"
              >
                Speaking →
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // ─── Speaking ───
  if (phase === 'speaking' && content) {
    return (
      <div className="min-h-screen bg-navy flex flex-col">
        <NavBar lessonTitle={`Speaking — Part ${speakPart}/3`} />
        <div className="flex-1 overflow-y-auto p-6 max-w-lg mx-auto w-full">
          {/* Part tabs */}
          <div className="flex gap-2 mb-5">
            {([1, 2, 3] as const).map(part => (
              <button
                key={part}
                onClick={() => setSpeakPart(part)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors border ${speakPart === part ? 'bg-gold text-navy border-gold' : 'bg-navy-surface text-text-secondary border-navy-surface-2 hover:border-gold/40'}`}
              >
                Part {part}
              </button>
            ))}
          </div>

          {speakPart === 1 && (
            <>
              <div className="text-xs text-gold font-semibold mb-3 uppercase tracking-wide">🗣️ Part 1 — Personal Questions</div>
              <div className="space-y-4 mb-6">
                {content.speaking.part1Questions.map((q, i) => (
                  <div key={i}>
                    <p className="text-text-primary text-sm mb-2">{q}</p>
                    <textarea
                      value={speakPart1[i] || ''}
                      onChange={e => { const a = [...speakPart1]; a[i] = e.target.value; setSpeakPart1(a) }}
                      placeholder="Хариулт бичнэ үү..."
                      rows={2}
                      className="w-full bg-navy-surface border border-navy-surface-2 rounded-xl p-3 text-text-primary text-sm resize-none focus:outline-none focus:border-gold/50"
                    />
                  </div>
                ))}
              </div>
              <button onClick={() => setSpeakPart(2)} className="w-full bg-gold hover:bg-gold-dark text-navy font-bold py-3 min-h-[48px] rounded-xl transition-colors">
                Part 2 →
              </button>
            </>
          )}

          {speakPart === 2 && (
            <>
              <div className="bg-navy-surface border border-gold/30 rounded-xl p-4 mb-4">
                <div className="text-xs text-gold font-semibold mb-2 uppercase tracking-wide">🗣️ Part 2 — Topic Card</div>
                <p className="text-text-primary text-sm leading-relaxed whitespace-pre-line">{content.speaking.part2Card}</p>
              </div>
              <textarea
                value={speakPart2}
                onChange={e => setSpeakPart2(e.target.value)}
                placeholder="1-2 минутын монолог бичнэ үү..."
                rows={6}
                className="w-full bg-navy-surface border border-navy-surface-2 rounded-xl p-3 text-text-primary text-sm resize-none focus:outline-none focus:border-gold/50 mb-4"
              />
              <button onClick={() => setSpeakPart(3)} className="w-full bg-gold hover:bg-gold-dark text-navy font-bold py-3 min-h-[48px] rounded-xl transition-colors">
                Part 3 →
              </button>
            </>
          )}

          {speakPart === 3 && (
            <>
              <div className="text-xs text-gold font-semibold mb-3 uppercase tracking-wide">🗣️ Part 3 — Discussion</div>
              <div className="space-y-4 mb-6">
                {content.speaking.part3Questions.map((q, i) => (
                  <div key={i}>
                    <p className="text-text-primary text-sm mb-2">{q}</p>
                    <textarea
                      value={speakPart3[i] || ''}
                      onChange={e => { const a = [...speakPart3]; a[i] = e.target.value; setSpeakPart3(a) }}
                      placeholder="Хариулт бичнэ үү..."
                      rows={3}
                      className="w-full bg-navy-surface border border-navy-surface-2 rounded-xl p-3 text-text-primary text-sm resize-none focus:outline-none focus:border-gold/50"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={submitTest}
                className="w-full bg-gold hover:bg-gold-dark text-navy font-bold py-3 min-h-[48px] rounded-xl transition-colors"
              >
                Тест илгээх →
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // ─── Results ───
  if (phase === 'results' && gradeResult) {
    return (
      <div className="min-h-screen bg-navy flex flex-col">
        <NavBar lessonTitle="IELTS — Үр дүн" />
        <div className="flex-1 overflow-y-auto p-6 max-w-lg mx-auto w-full">
          {/* Overall band */}
          <div className="text-center mb-6">
            <div className={`text-7xl font-extrabold mb-1 ${bandColor(gradeResult.overall)}`}>
              {gradeResult.overall}
            </div>
            <div className="text-text-secondary text-sm">Нийт IELTS Band оноо</div>
          </div>

          {/* Section scores */}
          <div className="bg-navy-surface border border-navy-surface-2 rounded-xl p-4 mb-5">
            <div className="text-sm font-semibold text-text-primary mb-3">Хэсэг тус бүрийн оноо</div>
            <div className="grid grid-cols-2 gap-3">
              {([
                { label: '🎧 Listening', value: gradeResult.listening },
                { label: '📖 Reading', value: gradeResult.reading },
                { label: '✍️ Writing', value: gradeResult.writing },
                { label: '🗣️ Speaking', value: gradeResult.speaking },
              ]).map(s => (
                <div key={s.label} className="bg-navy rounded-xl p-3 text-center">
                  <div className="text-xs text-text-secondary mb-1">{s.label}</div>
                  <div className={`text-2xl font-bold ${bandColor(s.value)}`}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback */}
          {gradeResult.writingFeedback && (
            <div className="bg-navy-surface border border-navy-surface-2 rounded-xl p-4 mb-4">
              <div className="text-sm font-semibold text-text-primary mb-2">✍️ Writing үнэлгээ</div>
              <p className="text-text-secondary text-xs leading-relaxed">{gradeResult.writingFeedback}</p>
            </div>
          )}
          {gradeResult.speakingFeedback && (
            <div className="bg-navy-surface border border-navy-surface-2 rounded-xl p-4 mb-6">
              <div className="text-sm font-semibold text-text-primary mb-2">🗣️ Speaking үнэлгээ</div>
              <p className="text-text-secondary text-xs leading-relaxed">{gradeResult.speakingFeedback}</p>
            </div>
          )}

          <button
            onClick={() => { setPhase('intro'); setGradeResult(null) }}
            className="w-full bg-navy-surface hover:bg-navy-surface-2 border border-navy-surface-2 text-text-primary font-semibold py-3 min-h-[48px] rounded-xl transition-colors"
          >
            Дахин тест өгөх
          </button>
        </div>
      </div>
    )
  }

  return null
}
