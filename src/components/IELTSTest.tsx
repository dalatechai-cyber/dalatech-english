'use client'
import { useState, useEffect, useRef } from 'react'
import { NavBar } from './NavBar'
import type { IELTSContent, IELTSAnswers } from '@/lib/ielts'
import { saveIELTSResult } from '@/lib/ielts'
import { saveTestResult } from '@/lib/testHistory'
import {
  speakTurn,
  stopSpeech,
  isSpeechSupported,
  isSpeechRecognitionSupported,
  getSpeechRecognition,
  selectListeningVoiceA,
  selectListeningVoiceB,
} from '@/lib/tts'

interface GradeResult {
  overall: number
  listening: number
  reading: number
  writing: number
  speaking: number
  writingFeedback: string
  speakingFeedback: string
  writingCriteria?: { taskAchievement: number; coherenceCohesion: number; lexicalResource: number; grammaticalRange: number }
  speakingCriteria?: { fluencyCohesion: number; lexicalResource: number; grammaticalRange: number; pronunciation: number }
}

interface SpeakStep { text: string; needsAnswer: boolean }

function buildSpeakSteps(c: IELTSContent): SpeakStep[] {
  return [
    { text: "Hello, my name is Sarah and I'll be conducting your IELTS Speaking test today. Let's begin with some questions about yourself.", needsAnswer: false },
    ...c.speaking.part1Questions.map(q => ({ text: q, needsAnswer: true })),
    { text: c.speaking.part2Card, needsAnswer: true },
    ...c.speaking.part3Questions.map(q => ({ text: q, needsAnswer: true })),
  ]
}

function bandColor(b: number) { return b >= 7 ? '#34D399' : b >= 5 ? '#F59E0B' : '#F87171' }
function bandLabel(b: number) {
  if (b >= 8) return 'Маш сайн'
  if (b >= 7) return 'Сайн'
  if (b >= 6) return 'Дунд сайн'
  if (b >= 5) return 'Дунд'
  if (b >= 4) return 'Хязгаарлагдмал'
  return 'Суурь'
}
function wordCount(t: string) { return t.trim().split(/\s+/).filter(Boolean).length }

function Spinner({ label }: { label: string }) {
  return (
    <div className="min-h-screen bg-navy flex flex-col">
      <NavBar lessonTitle="IELTS" />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="flex gap-1.5 justify-center mb-4">
            {[0, 1, 2].map(i => <span key={i} className="w-3 h-3 rounded-full animate-bounce" style={{ background: '#F59E0B', animationDelay: `${i * 0.15}s` }} />)}
          </div>
          <p className="text-sm" style={{ color: '#64748B' }}>{label}</p>
        </div>
      </div>
    </div>
  )
}

type Phase = 'intro' | 'loading' | 'listening' | 'reading' | 'writing' | 'speaking' | 'grading' | 'results'

function SectionProgress({ idx }: { idx: number }) {
  return (
    <div className="flex gap-1 mb-4">
      {(['listening', 'reading', 'writing', 'speaking'] as Phase[]).map((_, i) => (
        <div key={i} className="flex-1 h-1.5 rounded-full" style={{ background: i < idx ? '#F59E0B' : i === idx ? '#F59E0B88' : '#334155' }} />
      ))}
    </div>
  )
}

function ListeningWaveform() {
  return (
    <div className="flex items-end justify-center gap-1 h-10">
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} style={{ width: 4, background: '#F59E0B', borderRadius: 2, height: `${12 + i * 6}px`, transformOrigin: 'bottom', animation: `waveBar ${0.6 + i * 0.1}s ease-in-out infinite alternate`, animationDelay: `${i * 0.12}s` }} />
      ))}
    </div>
  )
}

type OrbState = 'idle' | 'speaking' | 'listening' | 'thinking'

function SpeakOrb({ state }: { state: OrbState }) {
  const colors: Record<OrbState, string> = {
    idle: '#1E40AF',
    speaking: '#F59E0B',
    listening: '#38BDF8',
    thinking: '#8B5CF6',
  }
  const c = colors[state]
  return (
    <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
      <div className={`absolute rounded-full orb-ring-outer orb-${state}`}
        style={{ width: 280, height: 280, border: `2px solid ${c}`, opacity: 0.2, boxShadow: `0 0 60px ${c}22` }} />
      <div className={`absolute rounded-full orb-ring-middle orb-${state}`}
        style={{ width: 200, height: 200, border: `2px solid ${c}`, opacity: 0.35, boxShadow: `0 0 40px ${c}33` }} />
      <div className={`orb-inner orb-${state} rounded-full flex items-center justify-center`}
        style={{
          width: 120, height: 120,
          background: `radial-gradient(circle, ${c}66 0%, ${c}33 50%, ${c}11 100%)`,
          border: `2px solid ${c}99`,
          boxShadow: `0 0 30px ${c}55, 0 0 60px ${c}33, 0 0 100px ${c}11`,
        }} />
    </div>
  )
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
          <thead><tr>{headers.map((h, i) => <th key={i} className="px-3 py-2 text-left font-semibold text-navy whitespace-nowrap" style={{ background: '#F59E0B' }}>{h.trim()}</th>)}</tr></thead>
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

export function IELTSTest() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState<IELTSContent | null>(null)
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null)

  // ── Listening ──
  const [listenAnswers, setListenAnswers] = useState<(number | null)[]>(Array(6).fill(null))
  const [listenPlayCount, setListenPlayCount] = useState(0) // 0=idle 1=1st play 2=2nd play 3=done
  const [isPlaying, setIsPlaying] = useState(false)
  const [playSpeed, setPlaySpeed] = useState<0.75 | 1 | 1.25>(1)
  const [listenSubmitted, setListenSubmitted] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const playingRef = useRef(false)

  // ── Reading ──
  const [readIndex, setReadIndex] = useState(0)
  const [readAnswers, setReadAnswers] = useState<(number | null)[]>(Array(8).fill(null))
  const [readSelected, setReadSelected] = useState<number | null>(null)
  const [readAnswered, setReadAnswered] = useState(false)

  // ── Writing ──
  const [writingTask1, setWritingTask1] = useState('')
  const [writingTask2, setWritingTask2] = useState('')
  const [writingTaskView, setWritingTaskView] = useState<1 | 2>(1)

  // ── Speaking (state machine) ──
  type SpeakPhase = 'ready' | 'speaking' | 'listening' | 'thinking'
  const [speakPhase, setSpeakPhase] = useState<SpeakPhase>('ready')
  const [speakStepIdx, setSpeakStepIdx] = useState(0)
  const [speakTranscript, setSpeakTranscript] = useState('')
  const speakAbortRef = useRef(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const speakStepsRef = useRef<SpeakStep[]>([])

  const ttsSupported = isSpeechSupported()
  const sttSupported = isSpeechRecognitionSupported()

  // ── Cleanup on unmount / phase change ──
  useEffect(() => () => { stopSpeech(); speakAbortRef.current = true }, [])
  useEffect(() => {
    if (phase !== 'listening') { stopSpeech(); playingRef.current = false; setIsPlaying(false) }
    if (phase !== 'speaking') {
      speakAbortRef.current = true
      try { recognitionRef.current?.stop() } catch { /* ignore */ }
      recognitionRef.current = null
      setSpeakPhase('ready')
      setSpeakTranscript('')
    }
  }, [phase])

  // ── Play conversation twice ──
  const playConversationTwice = async () => {
    if (!content || isPlaying) return
    setIsPlaying(true)
    playingRef.current = true

    const voiceA = selectListeningVoiceA()
    const voiceB = selectListeningVoiceB()
    const voices = typeof window !== 'undefined' ? window.speechSynthesis.getVoices() : []
    const onlyOne = voices.filter(v => v.lang.startsWith('en')).length <= 1

    for (let play = 1; play <= 2; play++) {
      if (!playingRef.current) break
      setListenPlayCount(play)
      for (let i = 0; i < content.listening.conversation.length; i++) {
        if (!playingRef.current) break
        const turn = content.listening.conversation[i]
        if (i > 0) { await new Promise<void>(r => setTimeout(r, 350)); if (!playingRef.current) break }
        await speakTurn(turn.text, {
          voice: turn.speaker === 'A' ? voiceA : voiceB,
          pitch: turn.speaker === 'A' ? 1.05 : (onlyOne ? 0.75 : 0.9),
          rate: turn.speaker === 'A' ? 0.88 : 0.85,
        })
      }
      if (play === 1 && playingRef.current) {
        await new Promise<void>(r => setTimeout(r, 1500))
      }
    }
    setIsPlaying(false)
    setListenPlayCount(3)
    playingRef.current = false
  }

  const pauseConversation = () => {
    playingRef.current = false
    stopSpeech()
    setIsPlaying(false)
  }

  // ── Speaking: collect one student answer via STT ──
  const collectAnswer = (): Promise<string> =>
    new Promise(resolve => {
      const Ctor = getSpeechRecognition()
      if (!Ctor) { resolve(''); return }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rec = new (Ctor as any)()
      rec.lang = 'en-US'
      rec.continuous = false
      rec.interimResults = true
      let final = ''
      let done = false
      const timer = setTimeout(() => { if (!done) try { rec.stop() } catch { /* ignore */ } }, 8000)
      const finish = (ans: string) => {
        if (done) return
        done = true
        clearTimeout(timer)
        recognitionRef.current = null
        setSpeakTranscript('')
        resolve(ans)
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = (e: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const results = Array.from(e.results as any[])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setSpeakTranscript(results.map((r: any) => r[0].transcript).join(' '))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fins = results.filter((r: any) => r.isFinal).map((r: any) => r[0].transcript).join(' ')
        if (fins) final = fins
      }
      rec.onend = () => finish(final)
      rec.onerror = () => finish(final)
      recognitionRef.current = rec
      try { rec.start() } catch { finish('') }
    })

  // ── Speaking: run the full conversation then submit ──
  const handleStartSpeaking = async () => {
    if (!content) return
    speakAbortRef.current = false

    const steps = buildSpeakSteps(content)
    speakStepsRef.current = steps
    const answers: string[] = []
    let answerIdx = 0
    const examVoice = selectListeningVoiceA()

    for (let i = 0; i < steps.length; i++) {
      if (speakAbortRef.current) { setSpeakPhase('ready'); return }
      setSpeakStepIdx(i)
      setSpeakPhase('speaking')
      setSpeakTranscript('')

      await speakTurn(steps[i].text, { voice: examVoice, pitch: 1.05, rate: 0.85 })
      if (speakAbortRef.current) { setSpeakPhase('ready'); return }

      if (steps[i].needsAnswer) {
        setSpeakPhase('listening')
        const answer = await collectAnswer()
        if (speakAbortRef.current) { setSpeakPhase('ready'); return }
        answers[answerIdx++] = answer

        setSpeakPhase('thinking')
        await new Promise<void>(r => setTimeout(r, 1200))
        if (speakAbortRef.current) { setSpeakPhase('ready'); return }
      }
    }

    // All done — grade
    const p1 = content.speaking.part1Questions.length
    const p3 = content.speaking.part3Questions.length
    const gradePayload: IELTSAnswers = {
      listeningAnswers: listenAnswers,
      readingAnswers: readAnswers,
      writingTask1,
      writingTask2,
      speakingPart1: answers.slice(0, p1),
      speakingPart2: answers[p1] ?? '',
      speakingPart3: answers.slice(p1 + 1, p1 + 1 + p3),
    }

    setPhase('grading')
    stopSpeech()

    try {
      const res = await fetch('/api/ielts/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, answers: gradePayload }),
      })
      if (!res.ok) throw new Error('Grading failed')
      const result = await res.json() as GradeResult
      setGradeResult(result)
      saveIELTSResult({ date: new Date().toISOString().slice(0, 10), overall: result.overall, listening: result.listening, reading: result.reading, writing: result.writing, speaking: result.speaking, feedback: result.writingFeedback })
      saveTestResult({ type: 'ielts', ieltsBand: result.overall })
      setPhase('results')
    } catch {
      setError('Үнэлгээ хийхэд алдаа гарлаа.')
      setPhase('intro')
    }
  }

  // ── Start test ──
  const startTest = async () => {
    setPhase('loading')
    setError(null)
    setListenAnswers(Array(6).fill(null))
    setListenPlayCount(0)
    setListenSubmitted(false)
    setShowTranscript(false)
    setReadIndex(0); setReadAnswers(Array(8).fill(null)); setReadSelected(null); setReadAnswered(false)
    setWritingTask1(''); setWritingTask2(''); setWritingTaskView(1)
    setSpeakPhase('ready'); setSpeakStepIdx(0); setSpeakTranscript('')
    setGradeResult(null)

    const usedTopics = (() => { try { return JSON.parse(localStorage.getItem('core-ielts-used-topics') ?? '[]') as string[] } catch { return [] } })()

    try {
      const res = await fetch('/api/ielts/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seed: Date.now(), usedTopics }) })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json() as IELTSContent
      if (!data.listening?.conversation || !data.reading || !data.writing || !data.speaking) throw new Error('Invalid')

      const part2Topic = data.speaking.part2Card.split('\n')[0]?.slice(0, 60) ?? ''
      if (part2Topic) try { const s = JSON.parse(localStorage.getItem('core-ielts-used-topics') ?? '[]') as string[]; localStorage.setItem('core-ielts-used-topics', JSON.stringify([part2Topic, ...s].slice(0, 5))) } catch { /* ignore */ }

      setContent(data)
      setListenAnswers(Array(data.listening.questions.length).fill(null))
      setReadAnswers(Array(data.reading.questions.length).fill(null))
      setPhase('listening')
    } catch {
      setError('Тест ачаалахад алдаа гарлаа. Дахин оролдоно уу.')
      setPhase('intro')
    }
  }

  const sectionIdx = (['listening', 'reading', 'writing', 'speaking'] as Phase[]).indexOf(phase)

  // ══════════════════════════════════════════
  // ─── Intro ───
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-navy flex flex-col">
        <NavBar lessonTitle="IELTS Mock Test" />
        <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-lg mx-auto w-full text-center page-enter-up">
          <div className="text-5xl mb-4">📝</div>
          <h1 className="text-2xl font-bold text-text-primary mb-2" style={{ letterSpacing: '-0.02em' }}>IELTS Academic Дадлага</h1>
          <p className="text-sm mb-8" style={{ color: '#CBD5E1' }}>4 хэсэгтэй бүтэн тест. Listening, Reading, Writing, Speaking. Дуусгасны дараа 1–9 Band оноо авна.</p>
          {error && <p className="text-rose-400 text-sm mb-4">{error}</p>}
          <div className="grid grid-cols-2 gap-3 w-full mb-8">
            {[
              { icon: '🎧', label: 'Listening', detail: ttsSupported ? '6 асуулт · Яриа 2 удаа' : '6 асуулт · Текст харах' },
              { icon: '📖', label: 'Reading', detail: '8 асуулт · Нийтлэл' },
              { icon: '✍️', label: 'Writing', detail: 'Task 1 + Task 2' },
              { icon: '🗣️', label: 'Speaking', detail: sttSupported ? 'AI яриа · Автомат' : 'Дуу таних боломжгүй' },
            ].map(s => (
              <div key={s.label} className="bg-navy-surface border border-gold/10 rounded-xl p-3 text-left">
                <div className="text-xl mb-1">{s.icon}</div>
                <div className="font-semibold text-text-primary text-sm">{s.label}</div>
                <div className="text-xs mt-0.5" style={{ color: '#64748B' }}>{s.detail}</div>
              </div>
            ))}
          </div>
          <button onClick={startTest} className="w-full font-bold py-3 min-h-[48px] rounded-xl transition-all hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}>
            Шинэ шалгалт эхлэх →
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'loading') return <Spinner label="Тест бэлдэж байна..." />
  if (phase === 'grading') return <Spinner label="Үнэлж байна... (30–60 секунд)" />

  // ══════════════════════════════════════════
  // ─── Listening — single page, all questions, plays twice ───
  if (phase === 'listening' && content) {
    const conv = content.listening.conversation
    const allAnswered = listenAnswers.every(a => a !== null)

    const playStatusText =
      listenPlayCount === 1 ? '1-р удаа тоглуулж байна...' :
      listenPlayCount === 2 ? '2-р удаа тоглуулж байна...' :
      listenPlayCount === 3 ? 'Дууссан ✓' : ''

    const noVoices = ttsSupported && typeof window !== 'undefined' && window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en')).length === 0

    return (
      <div className="min-h-screen bg-navy flex flex-col">
        <NavBar lessonTitle="Listening" />
        <div className="flex-1 overflow-y-auto p-4 max-w-xl mx-auto w-full">
          <SectionProgress idx={sectionIdx} />

          {/* Audio player card */}
          <div className="bg-navy-surface border border-navy-surface-2 rounded-2xl p-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-gold uppercase tracking-wide">🎧 Яриа сонсох</div>
              <div className="flex gap-1">
                {([0.75, 1, 1.25] as const).map(s => (
                  <button key={s} onClick={() => setPlaySpeed(s)} disabled={isPlaying}
                    className={`text-xs px-2 py-1 rounded transition-colors ${playSpeed === s ? 'bg-gold text-navy font-bold' : 'bg-navy-surface-2 text-text-secondary'}`}>
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {noVoices ? (
              <p className="text-xs text-center py-3" style={{ color: '#94A3B8' }}>
                Таны браузер дуу дэмждэггүй байна. Доорх яриаг уншина уу
              </p>
            ) : ttsSupported ? (
              <div className="mb-3">
                {isPlaying ? (
                  <div className="flex flex-col items-center py-2 gap-2">
                    <ListeningWaveform />
                    <p className="text-xs" style={{ color: '#F59E0B' }}>{playStatusText}</p>
                    <button onClick={pauseConversation} className="text-xs px-3 py-1 rounded-lg" style={{ background: '#334155', color: '#94A3B8' }}>⏸ Зогсоох</button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-2">
                    {listenPlayCount === 3 && <p className="text-xs font-semibold" style={{ color: '#34D399' }}>✓ Яриа дууссан</p>}
                    <button onClick={playConversationTwice}
                      className="px-6 py-2 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                      style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}>
                      ▶ Тоглуулах
                    </button>
                    <p className="text-xs" style={{ color: '#64748B' }}>Яриа 2 удаа автоматаар тоглуулна</p>
                  </div>
                )}
              </div>
            ) : (
              /* No TTS — show transcript as fallback */
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {conv.map((turn, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center"
                      style={{ background: turn.speaker === 'A' ? 'linear-gradient(135deg, #F59E0B, #D97706)' : '#334155', color: turn.speaker === 'A' ? '#0F172A' : '#F8FAFC' }}>
                      {turn.speaker}
                    </span>
                    <p className="flex-1 leading-relaxed text-text-secondary text-xs">{turn.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All questions at once */}
          <p className="text-xs mb-3 font-semibold" style={{ color: '#64748B' }}>Бүх {content.listening.questions.length} асуултад хариулна уу</p>
          <div className="space-y-4 mb-6">
            {content.listening.questions.map((q, qi) => (
              <div key={qi} className="bg-navy-surface border border-navy-surface-2 rounded-2xl p-4">
                <p className="text-sm font-semibold text-text-primary mb-3">
                  <span style={{ color: '#F59E0B' }}>{qi + 1}.</span> {q.question}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    const selected = listenAnswers[qi] === oi
                    const correct = listenSubmitted && oi === q.correct
                    const wrong = listenSubmitted && selected && oi !== q.correct
                    const neutral = listenSubmitted && !selected && oi !== q.correct
                    return (
                      <button key={oi}
                        onClick={() => { if (listenSubmitted) return; const a = [...listenAnswers]; a[qi] = oi; setListenAnswers(a) }}
                        disabled={listenSubmitted}
                        className="w-full text-left px-4 py-2.5 min-h-[44px] flex items-center rounded-xl border text-sm transition-all"
                        style={{
                          background: correct ? 'rgba(52,211,153,0.1)' : wrong ? 'rgba(248,113,113,0.1)' : selected ? 'rgba(245,158,11,0.08)' : 'transparent',
                          borderColor: correct ? '#34D399' : wrong ? '#F87171' : selected ? '#F59E0B' : '#334155',
                          color: neutral ? '#64748B' : correct ? '#34D399' : wrong ? '#F87171' : '#F8FAFC',
                        }}>
                        <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {!listenSubmitted ? (
            <button onClick={() => setListenSubmitted(true)} disabled={!allAnswered}
              className="w-full font-bold py-3 min-h-[48px] rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed mb-2"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}>
              Хариултаа илгээх
            </button>
          ) : (
            <div className="space-y-3">
              {ttsSupported && (
                <button onClick={() => setShowTranscript(v => !v)}
                  className="w-full py-2 rounded-xl text-xs font-semibold border transition-colors"
                  style={{ background: '#0F172A', borderColor: '#334155', color: '#94A3B8' }}>
                  {showTranscript ? '🙈 Яриа нуух' : '👁 Яриа харах'}
                </button>
              )}
              {showTranscript && (
                <div className="bg-navy-surface border border-navy-surface-2 rounded-2xl p-4 space-y-2 max-h-52 overflow-y-auto">
                  {conv.map((turn, i) => (
                    <div key={i} className="flex gap-2 text-xs">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
                        style={{ background: turn.speaker === 'A' ? 'linear-gradient(135deg, #F59E0B, #D97706)' : '#334155', color: turn.speaker === 'A' ? '#0F172A' : '#F8FAFC', fontSize: 9 }}>
                        {turn.speaker}
                      </span>
                      <p className="flex-1 text-text-secondary leading-relaxed">{turn.text}</p>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => { stopSpeech(); setPhase('reading') }}
                className="w-full font-bold py-3 min-h-[48px] rounded-xl transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}>
                Reading →
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════
  // ─── Reading ───
  if (phase === 'reading' && content) {
    const q = content.reading.questions[readIndex]
    return (
      <div className="min-h-screen bg-navy flex flex-col">
        <NavBar lessonTitle={`Reading — ${readIndex + 1}/${content.reading.questions.length}`} />
        <div className="flex-1 overflow-y-auto p-4 max-w-xl mx-auto w-full">
          <SectionProgress idx={sectionIdx} />
          <div className="bg-navy-surface border border-navy-surface-2 rounded-2xl p-4 mb-4">
            <div className="text-xs font-semibold text-gold uppercase tracking-wide mb-2">📖 Нийтлэл</div>
            <p className="text-sm leading-relaxed text-text-primary">{content.reading.passage}</p>
          </div>
          <div className="text-xs mb-2" style={{ color: '#64748B' }}>Асуулт {readIndex + 1}/{content.reading.questions.length}</div>
          <h2 className="text-base font-semibold text-text-primary mb-4">{q.question}</h2>
          <div className="space-y-3 mb-6">
            {q.options.map((opt, i) => {
              let bg = 'transparent', border = '#334155', textColor = '#F8FAFC'
              if (readAnswered) {
                if (i === q.correct) { bg = 'rgba(52,211,153,0.1)'; border = '#34D399'; textColor = '#34D399' }
                else if (i === readSelected) { bg = 'rgba(248,113,113,0.1)'; border = '#F87171'; textColor = '#F87171' }
                else textColor = '#64748B'
              }
              return (
                <button key={i} onClick={() => { if (readAnswered) return; setReadSelected(i); const a = [...readAnswers]; a[readIndex] = i; setReadAnswers(a); setReadAnswered(true) }}
                  disabled={readAnswered} className="w-full text-left px-4 py-3 min-h-[48px] flex items-center rounded-xl border transition-all text-sm"
                  style={{ background: bg, borderColor: border, color: textColor }}>
                  <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
                </button>
              )
            })}
          </div>
          {readAnswered && (
            <button onClick={() => { if (readIndex < content.reading.questions.length - 1) { setReadIndex(p => p + 1); setReadSelected(null); setReadAnswered(false) } else setPhase('writing') }}
              className="w-full font-bold py-3 min-h-[48px] rounded-xl transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}>
              {readIndex < content.reading.questions.length - 1 ? 'Дараагийн →' : 'Writing →'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════
  // ─── Writing ───
  if (phase === 'writing' && content) {
    return (
      <div className="min-h-screen bg-navy flex flex-col">
        <NavBar lessonTitle={`Writing — Task ${writingTaskView}/2`} />
        <div className="flex-1 overflow-y-auto p-4 max-w-xl mx-auto w-full">
          <SectionProgress idx={sectionIdx} />
          <div className="flex gap-2 mb-4">
            {([1, 2] as const).map(task => (
              <button key={task} onClick={() => setWritingTaskView(task)} className="flex-1 py-2 rounded-xl text-sm font-semibold transition-colors border"
                style={writingTaskView === task ? { background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A', borderColor: 'transparent' } : { background: '#1E293B', color: '#94A3B8', borderColor: '#334155' }}>
                Task {task}
              </button>
            ))}
          </div>
          {writingTaskView === 1 ? (
            <>
              <div className="bg-navy-surface border border-gold/20 rounded-2xl p-4 mb-3">
                <div className="text-xs font-semibold text-gold uppercase tracking-wide mb-2">✍️ Task 1 — дор хаяж 150 үг</div>
                <Task1Prompt prompt={content.writing.task1Prompt} />
              </div>
              <textarea value={writingTask1} onChange={e => setWritingTask1(e.target.value)} placeholder="Энд бичнэ үү..." rows={8}
                className="w-full rounded-xl p-4 text-sm resize-none outline-none mb-1"
                style={{ background: '#1E293B', border: '1px solid #334155', color: '#F8FAFC', lineHeight: 1.6 }}
                onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.5)')}
                onBlur={e => (e.target.style.borderColor = '#334155')} />
              <div className="flex justify-between text-xs mb-4" style={{ color: '#64748B' }}>
                <span>{wordCount(writingTask1)} үг</span>
                <span className={wordCount(writingTask1) >= 150 ? 'text-emerald-400' : ''}>{wordCount(writingTask1) >= 150 ? '✓ 150+ үг' : `${150 - wordCount(writingTask1)} үг дутуу`}</span>
              </div>
              <button onClick={() => setWritingTaskView(2)} className="w-full font-bold py-3 min-h-[48px] rounded-xl" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}>Task 2 →</button>
            </>
          ) : (
            <>
              <div className="bg-navy-surface border border-gold/20 rounded-2xl p-4 mb-3">
                <div className="text-xs font-semibold text-gold uppercase tracking-wide mb-2">✍️ Task 2 — дор хаяж 250 үг</div>
                <p className="text-sm text-text-primary leading-relaxed">{content.writing.task2Prompt}</p>
              </div>
              <textarea value={writingTask2} onChange={e => setWritingTask2(e.target.value)} placeholder="Энд бичнэ үү..." rows={10}
                className="w-full rounded-xl p-4 text-sm resize-none outline-none mb-1"
                style={{ background: '#1E293B', border: '1px solid #334155', color: '#F8FAFC', lineHeight: 1.6 }}
                onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.5)')}
                onBlur={e => (e.target.style.borderColor = '#334155')} />
              <div className="flex justify-between text-xs mb-4" style={{ color: '#64748B' }}>
                <span>{wordCount(writingTask2)} үг</span>
                <span className={wordCount(writingTask2) >= 250 ? 'text-emerald-400' : ''}>{wordCount(writingTask2) >= 250 ? '✓ 250+ үг' : `${250 - wordCount(writingTask2)} үг дутуу`}</span>
              </div>
              <button onClick={() => setPhase('speaking')} disabled={wordCount(writingTask2) < 10}
                className="w-full font-bold py-3 min-h-[48px] rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}>
                Speaking →
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════
  // ─── Speaking — Siri-style orb conversation ───
  if (phase === 'speaking') {
    if (!sttSupported) {
      return (
        <div className="min-h-screen bg-navy flex flex-col items-center justify-center p-8 text-center">
          <NavBar lessonTitle="Speaking" />
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="text-5xl">🎤</div>
            <p className="text-sm max-w-sm" style={{ color: '#94A3B8' }}>
              Таны браузер дуу таних боломжгүй. Chrome браузер ашиглана уу.
            </p>
          </div>
        </div>
      )
    }

    const orbState: OrbState =
      speakPhase === 'speaking' ? 'speaking' :
      speakPhase === 'listening' ? 'listening' :
      speakPhase === 'thinking' ? 'thinking' : 'idle'

    const statusLabel =
      speakPhase === 'speaking' ? 'Шалгагч ярьж байна...' :
      speakPhase === 'listening' ? 'Таны хариулт...' :
      speakPhase === 'thinking' ? '...' : ''

    const currentStepText = speakStepsRef.current[speakStepIdx]?.text ?? ''

    return (
      <div className="min-h-screen bg-navy flex flex-col" style={{ background: '#050D1A' }}>
        {/* Pause button top-right */}
        {speakPhase !== 'ready' && (
          <div className="fixed top-4 right-4 z-50">
            <button
              onClick={() => { speakAbortRef.current = true; stopSpeech(); try { recognitionRef.current?.stop() } catch { /* ignore */ } recognitionRef.current = null; setSpeakPhase('ready'); setSpeakTranscript('') }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: '#1E293B', border: '1px solid #334155', color: '#94A3B8' }}>
              ⏸ Зогсоох
            </button>
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {/* Orb */}
          <SpeakOrb state={orbState} />

          {/* Status */}
          {speakPhase === 'ready' ? (
            <div className="mt-10 flex flex-col items-center gap-6 w-full max-w-xs">
              <p className="text-sm text-center" style={{ color: '#64748B' }}>
                AI шалгагч таныг асуулт асуух болно. Автоматаар дуу бичнэ.
              </p>
              <button
                onClick={handleStartSpeaking}
                className="w-52 py-4 rounded-2xl font-bold text-base transition-all hover:-translate-y-1 shadow-lg"
                style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}>
                🎤 Ярианы шалгалт эхлэх
              </button>
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center gap-4 w-full max-w-sm">
              {/* Status label */}
              <div className="flex items-center gap-1 text-sm" style={{ color: orbState === 'speaking' ? '#F59E0B' : orbState === 'listening' ? '#38BDF8' : '#8B5CF6' }}>
                {statusLabel}
                {speakPhase !== 'thinking' && (
                  <span className="inline-flex gap-0.5 ml-1">
                    {[0, 1, 2].map(i => <span key={i} className="animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}>.</span>)}
                  </span>
                )}
              </div>

              {/* Current question (shown while AI speaking) */}
              {speakPhase === 'speaking' && currentStepText && (
                <div className="text-center px-4 py-3 rounded-2xl w-full" style={{ background: '#0F172A55', border: '1px solid #334155' }}>
                  <p className="text-sm leading-relaxed text-text-primary">{currentStepText}</p>
                </div>
              )}

              {/* Live transcript (shown while listening) */}
              {speakPhase === 'listening' && speakTranscript && (
                <div className="text-center px-4 py-3 rounded-2xl w-full" style={{ background: '#38BDF808', border: '1px solid #38BDF822' }}>
                  <p className="text-lg leading-relaxed text-white">{speakTranscript}</p>
                </div>
              )}

              {speakPhase === 'listening' && !speakTranscript && (
                <p className="text-sm" style={{ color: '#38BDF8' }}>Ярина уу...</p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════
  // ─── Results ───
  if (phase === 'results' && gradeResult) {
    const criteriaRows = gradeResult.writingCriteria ? [
      { label: 'Task Achievement', value: gradeResult.writingCriteria.taskAchievement },
      { label: 'Coherence & Cohesion', value: gradeResult.writingCriteria.coherenceCohesion },
      { label: 'Lexical Resource', value: gradeResult.writingCriteria.lexicalResource },
      { label: 'Grammatical Range', value: gradeResult.writingCriteria.grammaticalRange },
    ] : []
    const speakRows = gradeResult.speakingCriteria ? [
      { label: 'Fluency & Coherence', value: gradeResult.speakingCriteria.fluencyCohesion },
      { label: 'Lexical Resource', value: gradeResult.speakingCriteria.lexicalResource },
      { label: 'Grammatical Range', value: gradeResult.speakingCriteria.grammaticalRange },
      { label: 'Pronunciation', value: gradeResult.speakingCriteria.pronunciation },
    ] : []
    return (
      <div className="min-h-screen bg-navy flex flex-col">
        <NavBar lessonTitle="IELTS — Үр дүн" />
        <div className="flex-1 overflow-y-auto p-4 max-w-xl mx-auto w-full page-enter-up">
          <div className="text-center mb-6 py-6">
            <div className="text-8xl font-extrabold mb-2 leading-none" style={{ color: bandColor(gradeResult.overall), letterSpacing: '-0.04em' }}>{gradeResult.overall}</div>
            <div className="text-text-secondary text-sm mb-1">Нийт IELTS Band оноо</div>
            <div className="text-xs font-semibold" style={{ color: bandColor(gradeResult.overall) }}>{bandLabel(gradeResult.overall)}</div>
          </div>
          <div className="bg-navy-surface border border-navy-surface-2 rounded-2xl p-4 mb-4">
            <div className="text-sm font-semibold text-text-primary mb-3">Хэсэг тус бүрийн оноо</div>
            <div className="grid grid-cols-2 gap-3">
              {[{ label: '🎧 Listening', value: gradeResult.listening }, { label: '📖 Reading', value: gradeResult.reading }, { label: '✍️ Writing', value: gradeResult.writing }, { label: '🗣️ Speaking', value: gradeResult.speaking }].map(s => (
                <div key={s.label} className="bg-navy rounded-xl p-3 text-center">
                  <div className="text-xs mb-1" style={{ color: '#64748B' }}>{s.label}</div>
                  <div className="text-2xl font-bold" style={{ color: bandColor(s.value) }}>{s.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: bandColor(s.value), opacity: 0.7 }}>{bandLabel(s.value)}</div>
                </div>
              ))}
            </div>
          </div>
          {criteriaRows.length > 0 && (
            <div className="bg-navy-surface border border-navy-surface-2 rounded-2xl p-4 mb-4">
              <div className="text-sm font-semibold text-text-primary mb-3">✍️ Writing шалгуур</div>
              <div className="space-y-2">{criteriaRows.map(r => <div key={r.label} className="flex items-center justify-between"><span className="text-xs" style={{ color: '#94A3B8' }}>{r.label}</span><span className="text-sm font-bold" style={{ color: bandColor(r.value) }}>{r.value}</span></div>)}</div>
              {gradeResult.writingFeedback && <p className="text-xs mt-3 pt-3 border-t border-navy-surface-2" style={{ color: '#94A3B8' }}>{gradeResult.writingFeedback}</p>}
            </div>
          )}
          {speakRows.length > 0 && (
            <div className="bg-navy-surface border border-navy-surface-2 rounded-2xl p-4 mb-6">
              <div className="text-sm font-semibold text-text-primary mb-3">🗣️ Speaking шалгуур</div>
              <div className="space-y-2">{speakRows.map(r => <div key={r.label} className="flex items-center justify-between"><span className="text-xs" style={{ color: '#94A3B8' }}>{r.label}</span><span className="text-sm font-bold" style={{ color: bandColor(r.value) }}>{r.value}</span></div>)}</div>
              {gradeResult.speakingFeedback && <p className="text-xs mt-3 pt-3 border-t border-navy-surface-2" style={{ color: '#94A3B8' }}>{gradeResult.speakingFeedback}</p>}
            </div>
          )}
          <div className="flex flex-col gap-3">
            <button onClick={() => { stopSpeech(); setPhase('intro'); setGradeResult(null) }} className="w-full font-bold py-3 min-h-[48px] rounded-xl hover:-translate-y-0.5 transition-all" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}>Дахин өгөх</button>
            <a href="/profile" className="w-full font-semibold py-3 min-h-[48px] rounded-xl border text-center text-sm" style={{ background: '#1E293B', borderColor: '#334155', color: '#94A3B8' }}>Профайл руу буцах →</a>
          </div>
        </div>
      </div>
    )
  }

  return null
}
