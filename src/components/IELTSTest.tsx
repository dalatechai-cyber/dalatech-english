'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
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
  selectSpeakerA,
  selectSpeakerB,
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

function bandColor(band: number): string {
  if (band >= 7) return '#34D399'
  if (band >= 5) return '#F59E0B'
  return '#F87171'
}

function bandLabel(band: number): string {
  if (band >= 8) return 'Маш сайн'
  if (band >= 7) return 'Сайн'
  if (band >= 6) return 'Дунд сайн'
  if (band >= 5) return 'Дунд'
  if (band >= 4) return 'Хязгаарлагдмал'
  return 'Суурь'
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

// ─── Shared loading spinner ───
function Spinner({ label }: { label: string }) {
  return (
    <div className="min-h-screen bg-navy flex flex-col">
      <NavBar lessonTitle="IELTS" />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="flex gap-1.5 justify-center mb-4">
            {[0, 1, 2].map(i => (
              <span key={i} className="w-3 h-3 rounded-full animate-bounce" style={{ background: '#F59E0B', animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <p className="text-sm" style={{ color: '#64748B' }}>{label}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Progress bar across sections ───
type Phase = 'intro' | 'loading' | 'listening' | 'reading' | 'writing' | 'speaking' | 'grading' | 'results'

function SectionProgress({ sectionIdx }: { sectionIdx: number }) {
  const sectionOrder: Phase[] = ['listening', 'reading', 'writing', 'speaking']
  return (
    <div className="flex gap-1 mb-4">
      {sectionOrder.map((s, i) => (
        <div key={s} className="flex-1 h-1.5 rounded-full" style={{
          background: i < sectionIdx ? '#F59E0B' : i === sectionIdx ? '#F59E0B88' : '#334155'
        }} />
      ))}
    </div>
  )
}

// ─── Waveform animation for listening ───
function ListeningWaveform() {
  return (
    <div className="flex items-end justify-center gap-1 h-10 my-2">
      {[0, 1, 2, 3, 4].map(i => (
        <div
          key={i}
          style={{
            width: 4,
            background: '#F59E0B',
            borderRadius: 2,
            height: `${14 + i * 6}px`,
            transformOrigin: 'bottom',
            animation: `waveBar ${0.6 + i * 0.1}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
    </div>
  )
}

// ─── Animated orb for speaking ───
function OrbAnimation({ state }: { state: 'idle' | 'speaking' | 'recording' }) {
  const gold = '#F59E0B'
  const blue = '#0EA5E9'
  const color = state === 'recording' ? blue : gold

  return (
    <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
      {/* Outer ring */}
      <div
        className={`absolute rounded-full orb-ring-outer orb-${state}`}
        style={{ width: 160, height: 160, border: `2px solid ${color}`, opacity: 0.2 }}
      />
      {/* Middle ring */}
      <div
        className={`absolute rounded-full orb-ring-middle orb-${state}`}
        style={{ width: 110, height: 110, border: `2px solid ${color}`, opacity: 0.35 }}
      />
      {/* Inner orb */}
      <div
        className={`orb-inner orb-${state} rounded-full flex items-center justify-center text-2xl`}
        style={{
          width: 70,
          height: 70,
          background: `radial-gradient(circle, ${color}55 0%, ${color}22 70%)`,
          border: `2px solid ${color}88`,
        }}
      >
        {state === 'recording' ? '🎤' : '🔊'}
      </div>
    </div>
  )
}

// ─── Task 1 prompt renderer with <data-table> support ───
function Task1Prompt({ prompt }: { prompt: string }) {
  const tableMatch = prompt.match(/<data-table>([\s\S]*?)<\/data-table>/)
  if (!tableMatch) {
    return <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">{prompt}</p>
  }

  const before = prompt.slice(0, prompt.indexOf('<data-table>')).trim()
  const after = prompt.slice(prompt.indexOf('</data-table>') + '</data-table>'.length).trim()
  const rows = tableMatch[1].trim().split('\n').map(r => r.split('|'))
  const headers = rows[0]
  const dataRows = rows.slice(1)

  return (
    <>
      {before && <p className="text-sm text-text-primary leading-relaxed mb-3">{before}</p>}
      <div className="overflow-x-auto rounded-xl mb-3">
        <table className="w-full text-xs border-collapse min-w-[280px]">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left font-semibold text-navy whitespace-nowrap" style={{ background: '#F59E0B' }}>
                  {h.trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? '#1E293B' : '#162032' }}>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 text-text-primary whitespace-nowrap" style={{ borderTop: '1px solid #334155' }}>
                    {cell.trim()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
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

  // Listening state
  const [listenIndex, setListenIndex] = useState(0)
  const [listenAnswers, setListenAnswers] = useState<(number | null)[]>(Array(6).fill(null))
  const [listenSelected, setListenSelected] = useState<number | null>(null)
  const [listenAnswered, setListenAnswered] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeSpeaker, setActiveSpeaker] = useState<'A' | 'B' | null>(null)
  const [playSpeed, setPlaySpeed] = useState<0.75 | 1 | 1.25>(1)
  const [showTranscript, setShowTranscript] = useState(false)
  const playingRef = useRef(false)

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
  const [speakQuestionIdx, setSpeakQuestionIdx] = useState(0)
  const [speakPart1, setSpeakPart1] = useState<string[]>(['', '', '', '', ''])
  const [speakPart2, setSpeakPart2] = useState('')
  const [speakPart3, setSpeakPart3] = useState<string[]>(['', '', '', ''])
  const [isRecording, setIsRecording] = useState(false)
  const [examinerSpeaking, setExaminerSpeaking] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [prepCountdown, setPrepCountdown] = useState<number | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const examinerAbortRef = useRef(false)

  const ttsSupported = isSpeechSupported()
  const sttSupported = isSpeechRecognitionSupported()

  // ─── Cleanup audio on unmount and phase change ───
  useEffect(() => {
    return () => {
      stopSpeech()
      examinerAbortRef.current = true
    }
  }, [])

  useEffect(() => {
    if (phase !== 'listening' && phase !== 'speaking') {
      stopSpeech()
      playingRef.current = false
      setIsPlaying(false)
      setActiveSpeaker(null)
      examinerAbortRef.current = true
      setExaminerSpeaking(false)
    }
  }, [phase])

  // ─── Play conversation (FIX 3: better voices, 300ms pause) ───
  const playConversation = useCallback(async () => {
    if (!content || isPlaying) return
    setIsPlaying(true)
    playingRef.current = true

    const voiceA = selectSpeakerA()
    const voiceB = selectSpeakerB()
    const enVoices = typeof window !== 'undefined'
      ? window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'))
      : []
    const onlyOneVoice = enVoices.length <= 1

    for (let i = 0; i < content.listening.conversation.length; i++) {
      if (!playingRef.current) break
      const turn = content.listening.conversation[i]
      setActiveSpeaker(turn.speaker)

      if (i > 0) {
        await new Promise<void>(r => setTimeout(r, 300))
        if (!playingRef.current) break
      }

      await speakTurn(turn.text, {
        voice: turn.speaker === 'A' ? voiceA : voiceB,
        pitch: turn.speaker === 'A' ? 1.0 : (onlyOneVoice ? 1.3 : 1.15),
        rate: (turn.speaker === 'A' ? 0.88 : 0.85) * playSpeed,
      })
    }
    setActiveSpeaker(null)
    setIsPlaying(false)
    playingRef.current = false
  }, [content, isPlaying, playSpeed])

  const pauseConversation = () => {
    playingRef.current = false
    stopSpeech()
    setIsPlaying(false)
    setActiveSpeaker(null)
  }

  // ─── Examiner auto-play (FIX 5) ───
  const autoPlayQuestion = useCallback(async (text: string) => {
    examinerAbortRef.current = false
    setExaminerSpeaking(true)
    const voiceB = selectSpeakerB()
    await speakTurn(text, { voice: voiceB, pitch: 1.05, rate: 0.85 })
    if (!examinerAbortRef.current) {
      setExaminerSpeaking(false)
    }
  }, [])

  useEffect(() => {
    if (phase !== 'speaking' || !content) return

    examinerAbortRef.current = true
    stopSpeech()
    setExaminerSpeaking(false)

    let text = ''
    if (speakPart === 1) text = content.speaking.part1Questions[speakQuestionIdx] ?? ''
    else if (speakPart === 2) text = content.speaking.part2Card
    else if (speakPart === 3) text = content.speaking.part3Questions[speakQuestionIdx] ?? ''

    if (!text || !ttsSupported) return

    const timer = setTimeout(() => { autoPlayQuestion(text) }, 600)
    return () => {
      clearTimeout(timer)
      examinerAbortRef.current = true
      stopSpeech()
      setExaminerSpeaking(false)
    }
  }, [phase, speakPart, speakQuestionIdx, content, autoPlayQuestion, ttsSupported])

  // ─── STT recording ───
  const startRecording = useCallback((part: number, idx?: number) => {
    const SpeechRecognitionCtor = getSpeechRecognition()
    if (!SpeechRecognitionCtor) return
    if (recognitionRef.current) { recognitionRef.current.abort(); recognitionRef.current = null }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = new (SpeechRecognitionCtor as any)()
    rec.lang = 'en-US'
    rec.continuous = true
    rec.interimResults = true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results = Array.from(e.results as any[])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allText = results.map((r: any) => r[0].transcript).join(' ')
      setLiveTranscript(allText)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalText = results.filter((r: any) => r.isFinal).map((r: any) => r[0].transcript).join(' ')
      if (finalText) {
        if (part === 1 && idx !== undefined) {
          setSpeakPart1(prev => { const a = [...prev]; a[idx] = finalText; return a })
        } else if (part === 2) {
          setSpeakPart2(finalText)
        } else if (part === 3 && idx !== undefined) {
          setSpeakPart3(prev => { const a = [...prev]; a[idx] = finalText; return a })
        }
      }
    }
    rec.onend = () => { setIsRecording(false); setLiveTranscript('') }
    rec.start()
    recognitionRef.current = rec
    setIsRecording(true)
    setLiveTranscript('')
  }, [])

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setIsRecording(false)
    setLiveTranscript('')
  }, [])

  // ─── Part 2 prep countdown ───
  const startPrepTimer = () => { setPrepCountdown(60) }
  useEffect(() => {
    if (prepCountdown === null || prepCountdown <= 0) return
    const t = setTimeout(() => setPrepCountdown(c => (c ?? 1) - 1), 1000)
    return () => clearTimeout(t)
  }, [prepCountdown])

  // ─── Start test ───
  const startTest = async () => {
    setPhase('loading')
    setError(null)
    setListenIndex(0)
    setListenAnswers(Array(6).fill(null))
    setListenSelected(null)
    setListenAnswered(false)
    setShowTranscript(false)
    setReadIndex(0)
    setReadAnswers(Array(8).fill(null))
    setReadSelected(null)
    setReadAnswered(false)
    setWritingTask1('')
    setWritingTask2('')
    setWritingTaskView(1)
    setSpeakPart(1)
    setSpeakQuestionIdx(0)
    setSpeakPart1(['', '', '', '', ''])
    setSpeakPart2('')
    setSpeakPart3(['', '', '', ''])
    setPrepCountdown(null)
    setGradeResult(null)

    const usedTopics = (() => {
      try { return JSON.parse(localStorage.getItem('core-ielts-used-topics') ?? '[]') as string[] }
      catch { return [] }
    })()

    try {
      const res = await fetch('/api/ielts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed: Date.now(), usedTopics }),
      })
      if (!res.ok) throw new Error('Failed to generate test')
      const data = await res.json() as IELTSContent
      if (!data.listening?.conversation || !data.reading || !data.writing || !data.speaking) {
        throw new Error('Invalid test data')
      }

      // Save Part 2 topic for future avoidance (FIX 8)
      const part2Topic = data.speaking.part2Card.split('\n')[0]?.slice(0, 60) ?? ''
      if (part2Topic) {
        try {
          const stored = JSON.parse(localStorage.getItem('core-ielts-used-topics') ?? '[]') as string[]
          localStorage.setItem('core-ielts-used-topics', JSON.stringify([part2Topic, ...stored].slice(0, 5)))
        } catch { /* ignore */ }
      }

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
    stopSpeech()
    stopRecording()
    examinerAbortRef.current = true
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
      if (!res.ok) throw new Error('Grading failed')
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
      saveTestResult({ type: 'ielts', ieltsBand: result.overall })
      setPhase('results')
    } catch {
      setError('Үнэлгээ хийхэд алдаа гарлаа.')
      setPhase('intro')
    }
  }

  const sectionOrder: Phase[] = ['listening', 'reading', 'writing', 'speaking']
  const sectionIdx = sectionOrder.indexOf(phase)

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
              { icon: '🎧', label: 'Listening', detail: ttsSupported ? '6 асуулт · Дуут яриа' : '6 асуулт · Текст харах' },
              { icon: '📖', label: 'Reading', detail: '8 асуулт · Нийтлэл' },
              { icon: '✍️', label: 'Writing', detail: 'Task 1 + Task 2' },
              { icon: '🗣️', label: 'Speaking', detail: sttSupported ? '3 хэсэг · Дуу таних' : '3 хэсэг · Бичгээр' },
            ].map(s => (
              <div key={s.label} className="bg-navy-surface border border-gold/10 rounded-xl p-3 text-left hover:border-gold/30 transition-colors">
                <div className="text-xl mb-1">{s.icon}</div>
                <div className="font-semibold text-text-primary text-sm">{s.label}</div>
                <div className="text-xs mt-0.5" style={{ color: '#64748B' }}>{s.detail}</div>
              </div>
            ))}
          </div>
          <button
            onClick={startTest}
            className="w-full font-bold py-3 min-h-[48px] rounded-xl transition-all hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}
          >
            Шинэ шалгалт эхлэх →
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'loading') return <Spinner label="Тест бэлдэж байна..." />
  if (phase === 'grading') return <Spinner label="Үнэлж байна... (30–60 секунд)" />

  // ─── Listening (FIX 2: hide transcript, show waveform) ───
  if (phase === 'listening' && content) {
    const q = content.listening.questions[listenIndex]
    const conv = content.listening.conversation
    const allListenAnswered = listenAnswers.every(a => a !== null)

    return (
      <div className="min-h-screen bg-navy flex flex-col">
        <NavBar lessonTitle={`Listening — ${listenIndex + 1}/${content.listening.questions.length}`} />
        <div className="flex-1 overflow-y-auto p-4 max-w-xl mx-auto w-full">
          <SectionProgress sectionIdx={sectionIdx} />

          {/* Conversation player */}
          <div className="bg-navy-surface border border-navy-surface-2 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-gold uppercase tracking-wide">🎧 Яриа сонсох</div>
              <div className="flex gap-1">
                {([0.75, 1, 1.25] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setPlaySpeed(s)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${playSpeed === s ? 'bg-gold text-navy font-bold' : 'bg-navy-surface-2 text-text-secondary'}`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Waveform while playing / idle state */}
            {ttsSupported ? (
              <div className="mb-3">
                {isPlaying ? (
                  <div className="flex flex-col items-center py-2">
                    <ListeningWaveform />
                    <p className="text-xs mt-1" style={{ color: '#F59E0B' }}>Яриа тоглуулж байна...</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-3">
                    <div className="flex items-center gap-2 text-xs" style={{ color: '#64748B' }}>
                      <span>🎧</span>
                      <span>Яриа сонсоод асуултад хариулна уу</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* No TTS: show transcript as fallback */
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {conv.map((turn, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center"
                      style={{
                        background: turn.speaker === 'A' ? 'linear-gradient(135deg, #F59E0B, #D97706)' : '#334155',
                        color: turn.speaker === 'A' ? '#0F172A' : '#F8FAFC',
                      }}
                    >
                      {turn.speaker}
                    </span>
                    <p className="flex-1 leading-relaxed text-text-secondary">{turn.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Transcript toggle — only after all answers done */}
            {ttsSupported && allListenAnswered && (
              <button
                onClick={() => setShowTranscript(v => !v)}
                className="w-full mb-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                style={{ background: '#0F172A', borderColor: '#334155', color: '#94A3B8' }}
              >
                {showTranscript ? '🙈 Яриа нуух' : '👁 Яриа харах'}
              </button>
            )}

            {/* Transcript content when shown */}
            {ttsSupported && showTranscript && (
              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto border-t border-navy-surface-2 pt-3">
                {conv.map((turn, i) => (
                  <div
                    key={i}
                    className={`flex gap-2 text-sm transition-all duration-300 ${activeSpeaker === turn.speaker ? 'opacity-100' : 'opacity-60'}`}
                  >
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center"
                      style={{
                        background: turn.speaker === 'A' ? 'linear-gradient(135deg, #F59E0B, #D97706)' : '#334155',
                        color: turn.speaker === 'A' ? '#0F172A' : '#F8FAFC',
                      }}
                    >
                      {turn.speaker}
                    </span>
                    <p className={`flex-1 leading-relaxed ${activeSpeaker === turn.speaker ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {turn.text}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Play controls */}
            {ttsSupported && (
              <div className="flex gap-2">
                <button
                  onClick={isPlaying ? pauseConversation : playConversation}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: isPlaying ? '#334155' : 'linear-gradient(135deg, #F59E0B, #D97706)', color: isPlaying ? '#F8FAFC' : '#0F172A' }}
                >
                  {isPlaying ? '⏸ Зогсоох' : '▶ Тоглуулах'}
                </button>
              </div>
            )}
          </div>

          {/* MCQ */}
          <div className="text-xs mb-2" style={{ color: '#64748B' }}>Асуулт {listenIndex + 1}/{content.listening.questions.length}</div>
          <h2 className="text-base font-semibold text-text-primary mb-4">{q.question}</h2>
          <div className="space-y-3 mb-6">
            {q.options.map((opt, i) => {
              let bg = 'transparent'
              let border = '#334155'
              let textColor = '#F8FAFC'
              if (listenAnswered) {
                if (i === q.correct) { bg = 'rgba(52,211,153,0.1)'; border = '#34D399'; textColor = '#34D399' }
                else if (i === listenSelected) { bg = 'rgba(248,113,113,0.1)'; border = '#F87171'; textColor = '#F87171' }
                else { textColor = '#64748B' }
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
                  className="w-full text-left px-4 py-3 min-h-[48px] flex items-center rounded-xl border transition-all text-sm"
                  style={{ background: bg, borderColor: border, color: textColor }}
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
                  stopSpeech()
                  setActiveSpeaker(null)
                  setIsPlaying(false)
                } else {
                  stopSpeech()
                  setPhase('reading')
                }
              }}
              className="w-full font-bold py-3 min-h-[48px] rounded-xl transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}
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
        <div className="flex-1 overflow-y-auto p-4 max-w-xl mx-auto w-full">
          <SectionProgress sectionIdx={sectionIdx} />

          <div className="bg-navy-surface border border-navy-surface-2 rounded-2xl p-4 mb-4">
            <div className="text-xs font-semibold text-gold uppercase tracking-wide mb-2">📖 Нийтлэл</div>
            <p className="text-sm leading-relaxed text-text-primary">{content.reading.passage}</p>
          </div>

          <div className="text-xs mb-2" style={{ color: '#64748B' }}>Асуулт {readIndex + 1}/{content.reading.questions.length}</div>
          <h2 className="text-base font-semibold text-text-primary mb-4">{q.question}</h2>
          <div className="space-y-3 mb-6">
            {q.options.map((opt, i) => {
              let bg = 'transparent'
              let border = '#334155'
              let textColor = '#F8FAFC'
              if (readAnswered) {
                if (i === q.correct) { bg = 'rgba(52,211,153,0.1)'; border = '#34D399'; textColor = '#34D399' }
                else if (i === readSelected) { bg = 'rgba(248,113,113,0.1)'; border = '#F87171'; textColor = '#F87171' }
                else { textColor = '#64748B' }
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
                  className="w-full text-left px-4 py-3 min-h-[48px] flex items-center rounded-xl border transition-all text-sm"
                  style={{ background: bg, borderColor: border, color: textColor }}
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
              className="w-full font-bold py-3 min-h-[48px] rounded-xl transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}
            >
              {readIndex < content.reading.questions.length - 1 ? 'Дараагийн →' : 'Writing →'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ─── Writing (FIX 4: render data-table) ───
  if (phase === 'writing' && content) {
    return (
      <div className="min-h-screen bg-navy flex flex-col">
        <NavBar lessonTitle={`Writing — Task ${writingTaskView}/2`} />
        <div className="flex-1 overflow-y-auto p-4 max-w-xl mx-auto w-full">
          <SectionProgress sectionIdx={sectionIdx} />

          <div className="flex gap-2 mb-4">
            {([1, 2] as const).map(task => (
              <button
                key={task}
                onClick={() => setWritingTaskView(task)}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-colors border"
                style={writingTaskView === task
                  ? { background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A', borderColor: 'transparent' }
                  : { background: '#1E293B', color: '#94A3B8', borderColor: '#334155' }}
              >
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
              <textarea
                value={writingTask1}
                onChange={e => setWritingTask1(e.target.value)}
                placeholder="Энд бичнэ үү..."
                rows={8}
                className="w-full rounded-xl p-4 text-sm resize-none outline-none mb-1"
                style={{ background: '#1E293B', border: '1px solid #334155', color: '#F8FAFC', lineHeight: 1.6 }}
                onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.5)')}
                onBlur={e => (e.target.style.borderColor = '#334155')}
              />
              <div className="flex justify-between text-xs mb-4" style={{ color: '#64748B' }}>
                <span>{wordCount(writingTask1)} үг</span>
                <span className={wordCount(writingTask1) >= 150 ? 'text-emerald-400' : ''}>
                  {wordCount(writingTask1) >= 150 ? '✓ 150+ үг' : `${150 - wordCount(writingTask1)} үг дутуу`}
                </span>
              </div>
              <button
                onClick={() => setWritingTaskView(2)}
                className="w-full font-bold py-3 min-h-[48px] rounded-xl transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}
              >
                Task 2 →
              </button>
            </>
          ) : (
            <>
              <div className="bg-navy-surface border border-gold/20 rounded-2xl p-4 mb-3">
                <div className="text-xs font-semibold text-gold uppercase tracking-wide mb-2">✍️ Task 2 — дор хаяж 250 үг</div>
                <p className="text-sm text-text-primary leading-relaxed">{content.writing.task2Prompt}</p>
              </div>
              <textarea
                value={writingTask2}
                onChange={e => setWritingTask2(e.target.value)}
                placeholder="Энд бичнэ үү..."
                rows={10}
                className="w-full rounded-xl p-4 text-sm resize-none outline-none mb-1"
                style={{ background: '#1E293B', border: '1px solid #334155', color: '#F8FAFC', lineHeight: 1.6 }}
                onFocus={e => (e.target.style.borderColor = 'rgba(245,158,11,0.5)')}
                onBlur={e => (e.target.style.borderColor = '#334155')}
              />
              <div className="flex justify-between text-xs mb-4" style={{ color: '#64748B' }}>
                <span>{wordCount(writingTask2)} үг</span>
                <span className={wordCount(writingTask2) >= 250 ? 'text-emerald-400' : ''}>
                  {wordCount(writingTask2) >= 250 ? '✓ 250+ үг' : `${250 - wordCount(writingTask2)} үг дутуу`}
                </span>
              </div>
              <button
                onClick={() => setPhase('speaking')}
                disabled={wordCount(writingTask2) < 10}
                className="w-full font-bold py-3 min-h-[48px] rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}
              >
                Speaking →
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // ─── Speaking (FIX 5: orb UI, auto-play, live transcript) ───
  if (phase === 'speaking' && content) {
    const orbState: 'idle' | 'speaking' | 'recording' = examinerSpeaking ? 'speaking' : isRecording ? 'recording' : 'idle'

    let currentQuestion = ''
    let currentAnswer = ''
    let questionLabel = ''

    if (speakPart === 1) {
      currentQuestion = content.speaking.part1Questions[speakQuestionIdx] ?? ''
      currentAnswer = speakPart1[speakQuestionIdx] || ''
      questionLabel = `Part 1 — Асуулт ${speakQuestionIdx + 1}/${content.speaking.part1Questions.length}`
    } else if (speakPart === 2) {
      currentQuestion = content.speaking.part2Card
      currentAnswer = speakPart2
      questionLabel = 'Part 2 — Сэдвийн карт'
    } else {
      currentQuestion = content.speaking.part3Questions[speakQuestionIdx] ?? ''
      currentAnswer = speakPart3[speakQuestionIdx] || ''
      questionLabel = `Part 3 — Асуулт ${speakQuestionIdx + 1}/${content.speaking.part3Questions.length}`
    }

    const isLastInPart = speakPart === 1
      ? speakQuestionIdx >= content.speaking.part1Questions.length - 1
      : speakPart === 3
      ? speakQuestionIdx >= content.speaking.part3Questions.length - 1
      : true

    const handleToggleRecord = () => {
      if (isRecording) {
        stopRecording()
      } else {
        examinerAbortRef.current = true
        stopSpeech()
        setExaminerSpeaking(false)
        const idx = speakPart !== 2 ? speakQuestionIdx : undefined
        startRecording(speakPart, idx)
      }
    }

    const handleNextQuestion = () => {
      stopRecording()
      examinerAbortRef.current = true
      stopSpeech()
      setExaminerSpeaking(false)
      setSpeakQuestionIdx(i => i + 1)
    }

    const handleNextPart = (nextPart: 1 | 2 | 3) => {
      stopRecording()
      examinerAbortRef.current = true
      stopSpeech()
      setExaminerSpeaking(false)
      setSpeakPart(nextPart)
      setSpeakQuestionIdx(0)
    }

    return (
      <div className="min-h-screen bg-navy flex flex-col">
        <NavBar lessonTitle={`Speaking — Part ${speakPart}/3`} />
        <div className="flex-1 overflow-y-auto p-4 max-w-xl mx-auto w-full">
          <SectionProgress sectionIdx={sectionIdx} />

          {/* Part tabs */}
          <div className="flex gap-2 mb-5">
            {([1, 2, 3] as const).map(part => (
              <button
                key={part}
                onClick={() => handleNextPart(part)}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-colors border"
                style={speakPart === part
                  ? { background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A', borderColor: 'transparent' }
                  : { background: '#1E293B', color: '#94A3B8', borderColor: '#334155' }}
              >
                Part {part}
              </button>
            ))}
          </div>

          {/* Orb */}
          <div className="flex justify-center mb-4">
            <OrbAnimation state={orbState} />
          </div>

          {/* Examiner speaking indicator */}
          {examinerSpeaking && (
            <div className="text-center text-sm mb-3" style={{ color: '#F59E0B' }}>
              <span>Шалгагч ярьж байна</span>
              <span className="inline-flex gap-0.5 ml-1">
                {[0, 1, 2].map(i => (
                  <span key={i} className="animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}>.</span>
                ))}
              </span>
            </div>
          )}

          {/* STT not supported notice */}
          {!sttSupported && (
            <div className="bg-navy-surface border border-gold/20 rounded-xl p-3 mb-4 text-xs" style={{ color: '#94A3B8' }}>
              ⚠️ Таны браузер дуу таних боломжгүй тул бичгээр хариулна уу
            </div>
          )}

          {/* Current question card */}
          <div className="bg-navy-surface border border-gold/20 rounded-2xl p-4 mb-4">
            <div className="text-xs font-semibold text-gold uppercase tracking-wide mb-2">{questionLabel}</div>
            <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">{currentQuestion}</p>
            {ttsSupported && (
              <button
                onClick={() => {
                  if (examinerSpeaking) {
                    examinerAbortRef.current = true
                    stopSpeech()
                    setExaminerSpeaking(false)
                  } else {
                    autoPlayQuestion(currentQuestion)
                  }
                }}
                className="mt-2 text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: '#0F172A', border: '1px solid #334155', color: '#94A3B8' }}
              >
                {examinerSpeaking ? '⏸ Зогсоох' : '🔊 Дахин тоглуулах'}
              </button>
            )}
          </div>

          {/* Part 2: prep timer */}
          {speakPart === 2 && (
            prepCountdown === null ? (
              <button onClick={startPrepTimer} className="w-full mb-4 py-2 rounded-xl text-sm font-semibold bg-navy-surface border border-navy-surface-2 text-text-secondary hover:border-gold/30 transition-colors">
                ⏱ 1 минут бэлтгэх
              </button>
            ) : (
              <div className="w-full mb-4 py-2 rounded-xl text-center text-sm font-bold bg-navy-surface border border-gold/20" style={{ color: prepCountdown > 0 ? '#F59E0B' : '#34D399' }}>
                {prepCountdown > 0 ? `Бэлтгэх: ${prepCountdown}с` : '✓ Бэлтгэл дууслаа'}
              </div>
            )
          )}

          {/* Mic button */}
          {sttSupported && (
            <div className="flex flex-col items-center mb-4">
              <button
                onClick={handleToggleRecord}
                className="w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all shadow-lg mb-2"
                style={{
                  background: isRecording
                    ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                    : 'linear-gradient(135deg, #1E293B, #334155)',
                  border: isRecording ? '3px solid #EF4444' : '3px solid #334155',
                }}
              >
                {isRecording ? '⏹' : '🎤'}
              </button>
              <span className="text-xs" style={{ color: '#64748B' }}>
                {isRecording ? 'Сонсож байна...' : '🎤 Дарж ярина уу'}
              </span>
            </div>
          )}

          {/* Live transcript while recording */}
          {isRecording && liveTranscript && (
            <div className="rounded-xl p-3 mb-3" style={{ background: '#0F172A', border: '1px solid #0EA5E933' }}>
              <div className="text-xs mb-1" style={{ color: '#0EA5E9' }}>Сонсож байна...</div>
              <p className="text-sm text-text-primary">{liveTranscript}</p>
            </div>
          )}

          {/* Answer textarea */}
          <div className="mb-4">
            <div className="text-xs mb-1" style={{ color: '#64748B' }}>Таны хариулт</div>
            <textarea
              value={currentAnswer}
              onChange={e => {
                const val = e.target.value
                if (speakPart === 1) {
                  setSpeakPart1(prev => { const a = [...prev]; a[speakQuestionIdx] = val; return a })
                } else if (speakPart === 2) {
                  setSpeakPart2(val)
                } else {
                  setSpeakPart3(prev => { const a = [...prev]; a[speakQuestionIdx] = val; return a })
                }
              }}
              placeholder={sttSupported ? 'Дуу бичлэгийн хариулт энд гарна. Засварлах боломжтой.' : 'Хариулт бичнэ үү...'}
              rows={4}
              className="w-full rounded-xl p-3 text-sm resize-none outline-none"
              style={{ background: '#1E293B', border: '1px solid #334155', color: '#F8FAFC' }}
            />
          </div>

          {/* Navigation */}
          {speakPart === 1 && !isLastInPart && (
            <button onClick={handleNextQuestion} className="w-full font-bold py-3 min-h-[48px] rounded-xl transition-all hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}>
              Дараагийн асуулт →
            </button>
          )}
          {speakPart === 1 && isLastInPart && (
            <button onClick={() => handleNextPart(2)} className="w-full font-bold py-3 min-h-[48px] rounded-xl transition-all hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}>
              Part 2 →
            </button>
          )}
          {speakPart === 2 && (
            <button onClick={() => handleNextPart(3)} className="w-full font-bold py-3 min-h-[48px] rounded-xl transition-all hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}>
              Part 3 →
            </button>
          )}
          {speakPart === 3 && !isLastInPart && (
            <button onClick={handleNextQuestion} className="w-full font-bold py-3 min-h-[48px] rounded-xl transition-all hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}>
              Дараагийн асуулт →
            </button>
          )}
          {speakPart === 3 && isLastInPart && (
            <button onClick={submitTest} className="w-full font-bold py-3 min-h-[48px] rounded-xl transition-all hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}>
              Тест илгээх →
            </button>
          )}
        </div>
      </div>
    )
  }

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
            <div
              className="text-8xl font-extrabold mb-2 leading-none"
              style={{ color: bandColor(gradeResult.overall), letterSpacing: '-0.04em' }}
            >
              {gradeResult.overall}
            </div>
            <div className="text-text-secondary text-sm mb-1">Нийт IELTS Band оноо</div>
            <div className="text-xs font-semibold" style={{ color: bandColor(gradeResult.overall) }}>
              {bandLabel(gradeResult.overall)}
            </div>
            <p className="text-xs mt-2" style={{ color: '#64748B' }}>
              Та IELTS шалгалтанд ойролцоогоор {gradeResult.overall} оноо авах боломжтой
            </p>
          </div>

          <div className="bg-navy-surface border border-navy-surface-2 rounded-2xl p-4 mb-4">
            <div className="text-sm font-semibold text-text-primary mb-3">Хэсэг тус бүрийн оноо</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '🎧 Listening', value: gradeResult.listening },
                { label: '📖 Reading', value: gradeResult.reading },
                { label: '✍️ Writing', value: gradeResult.writing },
                { label: '🗣️ Speaking', value: gradeResult.speaking },
              ].map(s => (
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
              <div className="space-y-2">
                {criteriaRows.map(r => (
                  <div key={r.label} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: '#94A3B8' }}>{r.label}</span>
                    <span className="text-sm font-bold" style={{ color: bandColor(r.value) }}>{r.value}</span>
                  </div>
                ))}
              </div>
              {gradeResult.writingFeedback && (
                <p className="text-xs mt-3 pt-3 border-t border-navy-surface-2" style={{ color: '#94A3B8' }}>
                  {gradeResult.writingFeedback}
                </p>
              )}
            </div>
          )}

          {speakRows.length > 0 && (
            <div className="bg-navy-surface border border-navy-surface-2 rounded-2xl p-4 mb-6">
              <div className="text-sm font-semibold text-text-primary mb-3">🗣️ Speaking шалгуур</div>
              <div className="space-y-2">
                {speakRows.map(r => (
                  <div key={r.label} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: '#94A3B8' }}>{r.label}</span>
                    <span className="text-sm font-bold" style={{ color: bandColor(r.value) }}>{r.value}</span>
                  </div>
                ))}
              </div>
              {gradeResult.speakingFeedback && (
                <p className="text-xs mt-3 pt-3 border-t border-navy-surface-2" style={{ color: '#94A3B8' }}>
                  {gradeResult.speakingFeedback}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={() => { stopSpeech(); setPhase('intro'); setGradeResult(null) }}
              className="w-full font-bold py-3 min-h-[48px] rounded-xl transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}
            >
              Дахин өгөх
            </button>
            <a
              href="/profile"
              className="w-full font-semibold py-3 min-h-[48px] rounded-xl border text-center transition-colors text-sm"
              style={{ background: '#1E293B', borderColor: '#334155', color: '#94A3B8' }}
            >
              Профайл руу буцах →
            </a>
          </div>
        </div>
      </div>
    )
  }

  return null
}
