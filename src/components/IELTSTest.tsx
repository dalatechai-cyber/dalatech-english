'use client'
import { useState, useEffect, useRef } from 'react'
import { NavBar } from './NavBar'
import type { IELTSContent, IELTSAnswers, IELTSAnswer, IELTSQuestion } from '@/lib/ielts'
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
import {
  generateTTS,
  playAudioURL,
  transcribeAudio,
  fetchReaction,
  clearTTSCache,
  type AudioHandle,
  type ElevenVoice,
} from '@/lib/elevenlabs'

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
  rawCounts?: {
    listeningCorrect: number
    listeningTotal: number
    readingCorrect: number
    readingTotal: number
  }
}

const SHORT_REACTIONS = [
  'I see.',
  'Right.',
  'Mm-hmm.',
  'Okay.',
  'Indeed.',
  'I understand.',
  'Right, thank you.',
] as const

function pickShortReaction(): string {
  return SHORT_REACTIONS[Math.floor(Math.random() * SHORT_REACTIONS.length)]
}

function isAnswered(a: IELTSAnswer): boolean {
  if (typeof a === 'number') return true
  if (typeof a === 'string') return a.trim().length > 0
  return false
}

function mmss(sec: number): string {
  const m = Math.floor(Math.max(0, sec) / 60)
  const s = Math.max(0, sec) % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const GREETING = "Hello, my name is Sarah and I'll be conducting your IELTS Speaking test today. Let's begin with some questions about yourself."
const PART2_INTRO = "Now I'd like you to talk about a topic. You have one minute to prepare. Here is your topic card."
const PART2_BEGIN = "Please begin."
const CLOSING = "Thank you very much. That's the end of the speaking test. Well done for completing it. Your detailed results will be ready in just a moment."

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
    <div className="min-h-dvh bg-navy flex flex-col">
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
  const [isPartialResult, setIsPartialResult] = useState(false)
  const [mounted, setMounted] = useState(false)

  // ── Listening ──
  const [listenAnswers, setListenAnswers] = useState<IELTSAnswer[]>(Array(10).fill(null))
  const [listenPlayCount, setListenPlayCount] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [listenSubmitted, setListenSubmitted] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const [listenAudioReady, setListenAudioReady] = useState(false)
  const [listenAudioLoading, setListenAudioLoading] = useState(false)
  const [listenAudioError, setListenAudioError] = useState(false)
  const [listenCurrentTurn, setListenCurrentTurn] = useState(-1)
  const [listenNotice, setListenNotice] = useState<string | null>(null)
  const [listenLoadProgress, setListenLoadProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 })
  const playingRef = useRef(false)
  const listenAudiosRef = useRef<string[]>([])
  const listenCurrentHandleRef = useRef<AudioHandle | null>(null)
  const listenLoadStartedRef = useRef(false)

  // ── Reading ──
  const [readAnswers, setReadAnswers] = useState<IELTSAnswer[]>(Array(30).fill(null))
  const [readSubmitted, setReadSubmitted] = useState(false)
  const [readPassageIdx, setReadPassageIdx] = useState(0)
  const [readMobileTab, setReadMobileTab] = useState<'passage' | 'questions'>('passage')

  // ── Writing ──
  const [writingTask1, setWritingTask1] = useState('')
  const [writingTask2, setWritingTask2] = useState('')
  const [writingTaskView, setWritingTaskView] = useState<1 | 2>(1)
  // Countdown timers: Task 1 = 20:00, Task 2 = 40:00. Does NOT block submission;
  // when the timer reaches 0 we show a Mongolian warning but let the user continue.
  const [task1Remaining, setTask1Remaining] = useState(20 * 60)
  const [task2Remaining, setTask2Remaining] = useState(40 * 60)

  // ── Speaking (state machine) ──
  type SpeakPhase = 'ready' | 'speaking' | 'listening' | 'thinking' | 'prep'
  const [speakPhase, setSpeakPhase] = useState<SpeakPhase>('ready')
  const [speakTranscript, setSpeakTranscript] = useState('')
  const [speakStatus, setSpeakStatus] = useState('')
  const [speakCurrentText, setSpeakCurrentText] = useState('')
  const [speakShowCard, setSpeakShowCard] = useState<string | null>(null)
  const [speakPrepCountdown, setSpeakPrepCountdown] = useState<number | null>(null)
  const [speakPart2Countdown, setSpeakPart2Countdown] = useState<number | null>(null)
  const [speakContinue, setSpeakContinue] = useState(false)
  const [speakNotice, setSpeakNotice] = useState<string | null>(null)
  const speakAbortRef = useRef(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const currentExaminerHandleRef = useRef<AudioHandle | null>(null)
  const speakAnswersRef = useRef<string[]>([])
  const questionsAskedRef = useRef<number>(0)

  // Browser-capability flags: default to true for SSR to avoid hydration mismatch,
  // then re-check client-side in useEffect.
  const [ttsSupported, setTtsSupported] = useState(true)
  const [sttSupported, setSttSupported] = useState(true)
  useEffect(() => {
    setTtsSupported(isSpeechSupported())
    setSttSupported(isSpeechRecognitionSupported())
    setMounted(true)
  }, [])

  // ── Cleanup on unmount / phase change ──
  useEffect(() => () => {
    stopSpeech()
    speakAbortRef.current = true
    listenCurrentHandleRef.current?.stop()
    currentExaminerHandleRef.current?.stop()
    try { mediaRecorderRef.current?.stop() } catch { /* ignore */ }
    mediaStreamRef.current?.getTracks().forEach(t => t.stop())
    clearTTSCache()
  }, [])

  useEffect(() => {
    if (phase !== 'listening') {
      stopSpeech()
      listenCurrentHandleRef.current?.stop()
      playingRef.current = false
      setIsPlaying(false)
      setListenCurrentTurn(-1)
      listenLoadStartedRef.current = false
    }
    if (phase !== 'speaking') {
      speakAbortRef.current = true
      stopSpeech()
      currentExaminerHandleRef.current?.stop()
      try { recognitionRef.current?.stop() } catch { /* ignore */ }
      recognitionRef.current = null
      try { mediaRecorderRef.current?.stop() } catch { /* ignore */ }
      mediaRecorderRef.current = null
      mediaStreamRef.current?.getTracks().forEach(t => t.stop())
      mediaStreamRef.current = null
      setSpeakPhase('ready')
      setSpeakTranscript('')
      setSpeakStatus('')
      setSpeakCurrentText('')
      setSpeakShowCard(null)
      setSpeakPrepCountdown(null)
      setSpeakContinue(false)
    }
  }, [phase])

  // ── Pre-generate listening audio in small parallel batches ──
  // ElevenLabs free tier caps at 4 concurrent requests; BATCH_SIZE=3 stays safely under it.
  // Gate on a ref (not state) so setState inside the effect doesn't retrigger cleanup.
  useEffect(() => {
    if (phase !== 'listening' || !content) return
    if (listenLoadStartedRef.current) return
    listenLoadStartedRef.current = true

    let cancelled = false
    setListenAudioLoading(true)
    setListenNotice(null)

    const turns = content.listening.conversation
    const total = turns.length
    setListenLoadProgress({ done: 0, total })

    ;(async () => {
      const BATCH_SIZE = 3
      const urls: (string | null)[] = new Array(total).fill(null)

      // Retry once on 502/upstream errors before falling back to Web Speech.
      const loadWithRetry = async (text: string, voice: ElevenVoice): Promise<string> => {
        try {
          return await generateTTS(text, voice)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          if (/502|503|504/.test(msg)) {
            await new Promise(r => setTimeout(r, 1000))
            return await generateTTS(text, voice)
          }
          throw err
        }
      }

      for (let i = 0; i < total; i += BATCH_SIZE) {
        if (cancelled) return
        const batch = turns.slice(i, i + BATCH_SIZE)
        await Promise.all(
          batch.map(async (turn, j) => {
            const idx = i + j
            const voice: ElevenVoice = turn.speaker === 'A' ? 'alice' : 'george'
            try {
              const url = await loadWithRetry(turn.text, voice)
              urls[idx] = url
            } catch {
              urls[idx] = null
            }
            setListenLoadProgress({
              done: urls.filter(u => u !== null).length,
              total,
            })
          })
        )
      }

      if (cancelled) return
      const successCount = urls.filter(u => u !== null).length
      const failedCount = total - successCount
      listenAudiosRef.current = urls.map(u => u ?? '')
      if (successCount === 0) {
        setListenAudioError(true)
        setListenNotice('ElevenLabs холбогдсонгүй, өөр дуу ашиглаж байна')
      } else {
        if (failedCount > 0) {
          setListenNotice(`${failedCount} хэсэгт өөр дуу ашиглана`)
        }
        setListenAudioReady(true)
      }
      setListenAudioLoading(false)
    })()

    return () => { cancelled = true }
  }, [phase, content])

  // ── Pre-generate Part 1 examiner audio in background when entering speaking phase ──
  useEffect(() => {
    if (phase !== 'speaking' || !content) return
    let cancelled = false
    ;(async () => {
      try {
        await generateTTS(GREETING, 'alice')
        for (const q of content.speaking.part1Questions) {
          if (cancelled) return
          await generateTTS(q, 'alice')
        }
      } catch { /* silent — on-demand fallback */ }
    })()
    return () => { cancelled = true }
  }, [phase, content])

  // ── Pre-cache short reactions in parallel so "I see." / "Right." plays instantly ──
  useEffect(() => {
    if (phase !== 'speaking') return
    let cancelled = false
    ;(async () => {
      await Promise.all(
        SHORT_REACTIONS.map(async (r) => {
          if (cancelled) return
          try { await generateTTS(r, 'alice') } catch { /* ignore */ }
        })
      )
    })()
    return () => { cancelled = true }
  }, [phase])

  // ── Writing countdown timers ──
  useEffect(() => {
    if (phase !== 'writing') return
    const id = setInterval(() => {
      if (writingTaskView === 1) setTask1Remaining(t => Math.max(0, t - 1))
      else setTask2Remaining(t => Math.max(0, t - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [phase, writingTaskView])

  // ── Part 2 long-turn countdown tick ──
  useEffect(() => {
    if (speakPart2Countdown === null || speakPart2Countdown <= 0) return
    const id = setTimeout(
      () => setSpeakPart2Countdown(c => (c === null ? null : Math.max(0, c - 1))),
      1000,
    )
    return () => clearTimeout(id)
  }, [speakPart2Countdown])

  // ── Play conversation twice (ElevenLabs with Web-Speech fallback) ──
  const playConversationTwice = async () => {
    if (!content || isPlaying) return
    setIsPlaying(true)
    playingRef.current = true

    const useEleven = listenAudioReady && listenAudiosRef.current.length === content.listening.conversation.length
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
        setListenCurrentTurn(i)

        const cachedUrl = useEleven ? listenAudiosRef.current[i] : ''
        if (cachedUrl) {
          const handle = playAudioURL(cachedUrl)
          listenCurrentHandleRef.current = handle
          await handle.promise
          listenCurrentHandleRef.current = null
        } else {
          await speakTurn(turn.text, {
            voice: turn.speaker === 'A' ? voiceA : voiceB,
            pitch: turn.speaker === 'A' ? 1.05 : (onlyOne ? 0.75 : 0.9),
            rate: turn.speaker === 'A' ? 0.88 : 0.85,
          })
        }
      }
      if (play === 1 && playingRef.current) {
        await new Promise<void>(r => setTimeout(r, 1500))
      }
    }
    setIsPlaying(false)
    setListenPlayCount(3)
    setListenCurrentTurn(-1)
    playingRef.current = false
  }


  // ── Speaking helpers ─────────────────────────────
  const playExaminer = async (text: string, setStatus = true): Promise<void> => {
    if (speakAbortRef.current) return
    if (setStatus) {
      setSpeakPhase('speaking')
      setSpeakStatus('Шалгагч ярьж байна...')
      setSpeakCurrentText(text)
    }
    try {
      const url = await generateTTS(text, 'alice')
      if (speakAbortRef.current) return
      const handle = playAudioURL(url)
      currentExaminerHandleRef.current = handle
      await handle.promise
      currentExaminerHandleRef.current = null
    } catch {
      setSpeakNotice('Дуу ачааллахад алдаа гарлаа')
      const voice = selectListeningVoiceA()
      await speakTurn(text, { voice, pitch: 1.05, rate: 0.85 })
    }
  }

  const pause = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

  // Collect student answer using MediaRecorder + SpeechRecognition with pro silence detection
  const collectStudentAnswer = (options: { minSpeakSec: number; silenceSec: number }): Promise<string> =>
    new Promise(async (resolve) => {
      setSpeakPhase('listening')
      setSpeakStatus('Сонсож байна...')
      setSpeakCurrentText('')
      setSpeakTranscript('')
      setSpeakContinue(false)

      // Web Speech transcript (always running as backup + for silence cues)
      let webSpeechTranscript = ''
      const Ctor = getSpeechRecognition()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let rec: any = null
      let lastSpeechTs = Date.now()
      const speechStartTs = Date.now()

      if (Ctor) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rec = new (Ctor as any)()
        rec.lang = 'en-US'
        rec.continuous = true
        rec.interimResults = true
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rec.onresult = (e: any) => {
          lastSpeechTs = Date.now()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const results = Array.from(e.results as any[])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const combined = results.map((r: any) => r[0].transcript).join(' ')
          webSpeechTranscript = combined
          setSpeakTranscript(combined)
          setSpeakContinue(false)
        }
        rec.onerror = () => {}
        rec.onend = () => {
          // Auto-restart if still listening
          if (!speakAbortRef.current && recognitionRef.current === rec) {
            try { rec.start() } catch { /* ignore */ }
          }
        }
        recognitionRef.current = rec
        try { rec.start() } catch { /* ignore */ }
      }

      // MediaRecorder for high-quality audio → ElevenLabs STT
      let stream: MediaStream | null = null
      const chunks: Blob[] = []
      let mr: MediaRecorder | null = null
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaStreamRef.current = stream
        mr = new MediaRecorder(stream)
        mediaRecorderRef.current = mr
        mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
        mr.start()
      } catch {
        mr = null
      }

      const stopAll = () => {
        try { rec?.stop() } catch { /* ignore */ }
        recognitionRef.current = null
        try { mr?.stop() } catch { /* ignore */ }
        stream?.getTracks().forEach(t => t.stop())
        mediaStreamRef.current = null
      }

      const hardMax = options.minSpeakSec >= 45 ? 150 : 45 // Part 2: 2.5 min cap, else 45s
      let finalized = false

      const finalize = async () => {
        if (finalized) return
        finalized = true
        setSpeakContinue(false)
        setSpeakPhase('thinking')
        setSpeakStatus('Боловсруулж байна...')
        setSpeakCurrentText('')

        // Wait a tick for MediaRecorder ondataavailable to flush
        await new Promise<void>(r => setTimeout(r, 150))

        let finalText = webSpeechTranscript.trim()
        if (mr && chunks.length > 0) {
          try {
            const blob = new Blob(chunks, { type: chunks[0].type || 'audio/webm' })
            const sttText = await transcribeAudio(blob)
            if (sttText) finalText = sttText
          } catch (e) {
            console.warn('[STT] failed after retry — using Web Speech transcript:', e)
          }
        }
        resolve(finalText)
      }

      const timer = setInterval(() => {
        if (speakAbortRef.current) {
          clearInterval(timer)
          stopAll()
          finalize()
          return
        }
        const now = Date.now()
        const elapsed = (now - speechStartTs) / 1000
        const silent = (now - lastSpeechTs) / 1000

        // "Please continue" prompt when student pauses before min speaking time
        if (elapsed < options.minSpeakSec && silent > 2.5) {
          setSpeakContinue(true)
        } else if (silent < 0.5) {
          setSpeakContinue(false)
        }

        const reached = elapsed >= options.minSpeakSec && silent >= options.silenceSec
        const timedOut = elapsed >= hardMax
        if (reached || timedOut) {
          clearInterval(timer)
          stopAll()
          // MediaRecorder.onstop fires asynchronously; finalize after small delay
          setTimeout(() => { finalize() }, 200)
        }
      }, 400)
    })

  // Compile answers into final grade payload and submit to /api/ielts/grade
  const gradeAndShowResults = async () => {
    if (!content) return
    const collected = [...speakAnswersRef.current]
    const p1 = content.speaking.part1Questions.length
    const p3 = content.speaking.part3Questions.length
    const total = p1 + 1 + p3
    while (collected.length < total) collected.push('')

    const gradePayload: IELTSAnswers = {
      listeningAnswers: listenAnswers,
      readingAnswers: readAnswers,
      writingTask1,
      writingTask2,
      speakingPart1: collected.slice(0, p1),
      speakingPart2: collected[p1] ?? '',
      speakingPart3: collected.slice(p1 + 1, p1 + 1 + p3),
    }

    setPhase('grading')
    stopSpeech()
    currentExaminerHandleRef.current?.stop()

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

  // Stop handler — aborts flow and shows partial results if any answers collected
  const handleStopSpeaking = () => {
    speakAbortRef.current = true
    stopSpeech()
    currentExaminerHandleRef.current?.stop()
    try { recognitionRef.current?.stop() } catch { /* ignore */ }
    recognitionRef.current = null
    try { mediaRecorderRef.current?.stop() } catch { /* ignore */ }
    mediaStreamRef.current?.getTracks().forEach(t => t.stop())
    mediaStreamRef.current = null
    setSpeakTranscript('')
    setSpeakStatus('')
    setSpeakCurrentText('')
    setSpeakShowCard(null)
    setSpeakPrepCountdown(null)
    setSpeakContinue(false)

    if (questionsAskedRef.current > 0) {
      setIsPartialResult(true)
      gradeAndShowResults()
    } else {
      setError('Шалгалт эхлээгүй байна')
      setPhase('intro')
    }
  }

  // ── Main Speaking flow ──
  const handleStartSpeaking = async () => {
    if (!content) return
    speakAbortRef.current = false
    setSpeakNotice(null)
    speakAnswersRef.current = []
    questionsAskedRef.current = 0

    const pushAnswer = (ans: string) => { speakAnswersRef.current = [...speakAnswersRef.current, ans] }

    // ask(): play question → collect answer → examiner reacts.
    // If the examiner has a contextual follow-up (and no probe has been used
    // yet on this question), play it, collect one more answer, then always
    // move on. Maximum ONE follow-up per question.
    // Play a cached short reaction INSTANTLY (0ms delay), while Claude generates
    // the followUp/move-on decision in parallel. Then wait exactly 600ms before
    // playing the next question — natural human pacing.
    const reactAndDecide = async (args: {
      transcript: string
      question: string
      part: 1 | 2 | 3
      probeUsed: boolean
    }) => {
      const cachedText = pickShortReaction()
      const reactionPromise = fetchReaction(args)
      // Fire instant cached reaction; wait for it to finish before pause.
      await playExaminer(cachedText)
      const decision = await reactionPromise
      await pause(600)
      return decision
    }

    const ask = async (
      question: string,
      part: 1 | 3,
      minSpeakSec: number,
      silenceSec: number,
    ): Promise<string> => {
      if (speakAbortRef.current) return ''
      questionsAskedRef.current += 1
      await playExaminer(question)
      if (speakAbortRef.current) return ''
      const ans1 = await collectStudentAnswer({ minSpeakSec, silenceSec })
      if (speakAbortRef.current) return ans1

      const r1 = await reactAndDecide({ transcript: ans1, question, part, probeUsed: false })
      if (speakAbortRef.current) return ans1

      if (!r1.moveToNext && r1.followUp) {
        // Play the contextual follow-up question through the examiner voice.
        await playExaminer(r1.followUp)
        if (speakAbortRef.current) return ans1
        const ans2 = await collectStudentAnswer({
          minSpeakSec: Math.max(4, minSpeakSec - 2),
          silenceSec,
        })
        if (speakAbortRef.current) return `${ans1} ${ans2}`.trim()

        // Closing reaction — instant cached ack, then move on.
        await reactAndDecide({
          transcript: ans2,
          question: r1.followUp,
          part,
          probeUsed: true, // never probe twice on same question
        })
        return `${ans1} ${ans2}`.trim()
      }

      return ans1
    }

    try {
      // 1. Greeting
      await playExaminer(GREETING)
      if (speakAbortRef.current) return
      await pause(300)

      // 2. Part 1
      for (const q of content.speaking.part1Questions) {
        if (speakAbortRef.current) return
        const ans = await ask(q, 1, 8, 4)
        pushAnswer(ans)
      }

      // 3. Part 2 — intro, prep countdown, begin, long turn
      if (speakAbortRef.current) return
      questionsAskedRef.current += 1
      await playExaminer(PART2_INTRO)
      if (speakAbortRef.current) return

      // Prep phase with topic card + 60s countdown
      setSpeakPhase('prep')
      setSpeakCurrentText('')
      setSpeakShowCard(content.speaking.part2Card)
      for (let s = 60; s > 0; s--) {
        if (speakAbortRef.current) { setSpeakShowCard(null); return }
        setSpeakPrepCountdown(s)
        setSpeakStatus(`Бэлдэх хугацаа: 0:${String(s).padStart(2, '0')}`)
        await pause(1000)
      }
      setSpeakPrepCountdown(null)

      if (speakAbortRef.current) { setSpeakShowCard(null); return }
      await playExaminer(PART2_BEGIN)
      await pause(200)

      // Part 2 answer — min 45s, 4s silence, 2:00 countdown visible to student
      setSpeakPart2Countdown(120)
      const p2Answer = await collectStudentAnswer({ minSpeakSec: 45, silenceSec: 4 })
      setSpeakPart2Countdown(null)
      setSpeakShowCard(null)
      pushAnswer(p2Answer)

      if (!speakAbortRef.current) {
        await reactAndDecide({
          transcript: p2Answer,
          question: content.speaking.part2Card,
          part: 2,
          probeUsed: true, // never follow up after the long turn
        })
      }

      // 4. Part 3 — discussion, follow-ups may challenge the student's view
      for (const q of content.speaking.part3Questions) {
        if (speakAbortRef.current) return
        const ans = await ask(q, 3, 8, 4)
        pushAnswer(ans)
      }

      if (speakAbortRef.current) return

      // 5. Closing
      await playExaminer(CLOSING)
      await pause(300)

      // Grade & show results
      await gradeAndShowResults()
    } catch {
      setError('Үнэлгээ хийхэд алдаа гарлаа.')
      setPhase('intro')
    }
  }

  // ── Start test ──
  const startTest = async () => {
    setPhase('loading')
    setError(null)
    clearTTSCache()
    listenAudiosRef.current = []
    setListenAnswers(Array(10).fill(null))
    setListenPlayCount(0)
    setListenSubmitted(false)
    setShowTranscript(false)
    setListenAudioReady(false)
    setListenAudioLoading(false)
    setListenAudioError(false)
    setListenCurrentTurn(-1)
    setListenNotice(null)
    setReadAnswers(Array(30).fill(null)); setReadSubmitted(false); setReadPassageIdx(0); setReadMobileTab('passage')
    setWritingTask1(''); setWritingTask2(''); setWritingTaskView(1); setTask1Remaining(20 * 60); setTask2Remaining(40 * 60)
    setSpeakPhase('ready')
    setSpeakTranscript('')
    setSpeakStatus('')
    setSpeakCurrentText('')
    setSpeakShowCard(null)
    setSpeakPrepCountdown(null)
    setSpeakContinue(false)
    setSpeakNotice(null)
    setGradeResult(null)
    setIsPartialResult(false)

    const usedTopics = (() => { try { return JSON.parse(localStorage.getItem('core-ielts-used-topics') ?? '[]') as string[] } catch { return [] } })()

    try {
      const seed = Date.now()

      // Fire both endpoints in parallel: listening is fast and unblocks TTS preload;
      // content (reading/writing/speaking) generates in background.
      const listenPromise = fetch('/api/ielts/generate-listening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed }),
      })
      const contentPromise = fetch('/api/ielts/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed, usedTopics }),
      })

      const listenRes = await listenPromise
      if (!listenRes.ok) {
        const errBody = await listenRes.text().catch(() => '')
        throw new Error(`Listening failed (${listenRes.status}): ${errBody.slice(0, 200)}`)
      }
      const listenData = await listenRes.json() as { listening: IELTSContent['listening'] }
      if (!listenData.listening?.conversation) throw new Error('Invalid listening')

      // Set partial content so the listening preload effect fires immediately.
      setContent({
        listening: listenData.listening,
        reading: { passages: [] },
        writing: { task1Prompt: '', task2Prompt: '' },
        speaking: { part1Questions: [], part2Card: '', part3Questions: [] },
      })
      setListenAnswers(Array(listenData.listening.questions.length).fill(null))
      setPhase('listening')

      // Merge reading/writing/speaking when they arrive (in parallel with TTS preload).
      contentPromise
        .then(async res => {
          if (!res.ok) throw new Error(`Content failed (${res.status})`)
          const contentData = await res.json() as { reading: IELTSContent['reading']; writing: IELTSContent['writing']; speaking: IELTSContent['speaking'] }
          if (!contentData.reading || !contentData.writing || !contentData.speaking) throw new Error('Invalid content')

          const part2Topic = contentData.speaking.part2Card.split('\n')[0]?.slice(0, 60) ?? ''
          if (part2Topic) try { const s = JSON.parse(localStorage.getItem('core-ielts-used-topics') ?? '[]') as string[]; localStorage.setItem('core-ielts-used-topics', JSON.stringify([part2Topic, ...s].slice(0, 5))) } catch { /* ignore */ }

          setContent(prev => prev ? {
            ...prev,
            reading: contentData.reading,
            writing: contentData.writing,
            speaking: contentData.speaking,
          } : prev)
          const totalReadQs = contentData.reading.passages.reduce((n, p) => n + p.questions.length, 0)
          setReadAnswers(Array(totalReadQs).fill(null))
        })
        .catch(err => {
          console.error('IELTS content fetch failed:', err)
        })
    } catch {
      setError('Тест ачаалахад алдаа гарлаа. Дахин оролдоно уу.')
      setPhase('intro')
    }
  }

  // Renders the answer UI for a question based on its type.
  // Choice types (mc / tfng / matching) → option buttons.
  // Text types (fill / short) → text input; graded on submit via acceptedAnswers.
  const renderQuestionBody = (
    q: IELTSQuestion,
    globalIdx: number,
    answers: IELTSAnswer[],
    setAnswers: (a: IELTSAnswer[]) => void,
    submitted: boolean,
  ) => {
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
      const textColor = !submitted ? '#F8FAFC' : isCorrect ? '#34D399' : '#F87171'
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
                borderColor: correct ? '#34D399' : wrong ? '#F87171' : selected ? '#F59E0B' : '#334155',
                color: neutral ? '#64748B' : correct ? '#34D399' : wrong ? '#F87171' : '#F8FAFC',
              }}>
              <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}
            </button>
          )
        })}
      </div>
    )
  }

  const sectionIdx = (['listening', 'reading', 'writing', 'speaking'] as Phase[]).indexOf(phase)

  // ══════════════════════════════════════════
  // Prevent SSR/hydration flash on direct /ielts navigation
  if (!mounted) return <Spinner label="Ачаалж байна..." />
  // ─── Intro ───
  if (phase === 'intro') {
    return (
      <div className="min-h-dvh bg-navy flex flex-col">
        <NavBar lessonTitle="IELTS Mock Test" />
        <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-lg mx-auto w-full text-center page-enter-up">
          <div className="text-5xl mb-4">📝</div>
          <h1 className="text-2xl font-bold text-text-primary mb-2" style={{ letterSpacing: '-0.02em' }}>IELTS Academic Дадлага</h1>
          <p className="text-sm mb-8" style={{ color: '#CBD5E1' }}>4 хэсэгтэй бүтэн тест. Listening, Reading, Writing, Speaking. Дуусгасны дараа 1–9 Band оноо авна.</p>
          {error && <p className="text-rose-400 text-sm mb-4">{error}</p>}
          <div className="grid grid-cols-2 gap-3 w-full mb-8">
            {[
              { icon: '🎧', label: 'Listening', detail: '10 асуулт · Яриа 2 удаа' },
              { icon: '📖', label: 'Reading', detail: '30 асуулт · 3 нийтлэл' },
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

  if (phase === 'loading') return <Spinner label="Яриа бэлтгэж байна..." />
  if (phase === 'grading') return <Spinner label="Үнэлж байна... (30–60 секунд)" />

  // ══════════════════════════════════════════
  // ─── Listening — ElevenLabs with fallback ───
  if (phase === 'listening' && content) {
    const conv = content.listening.conversation
    const allAnswered = listenAnswers.length === content.listening.questions.length && listenAnswers.every(isAnswered)

    const playStatusText =
      listenPlayCount === 1 ? '1-р удаа тоглуулж байна...' :
      listenPlayCount === 2 ? '2-р удаа тоглуулж байна...' :
      listenPlayCount === 3 ? 'Дууссан ✓' : ''

    const canPlay = listenAudioReady || listenAudioError
    const useFallback = listenAudioError && ttsSupported

    return (
      <div className="min-h-dvh bg-navy flex flex-col">
        <NavBar lessonTitle="Listening" />
        <div className="flex-1 overflow-y-auto p-4 max-w-xl mx-auto w-full">
          <SectionProgress idx={sectionIdx} />

          {/* Audio player card */}
          <div className="bg-navy-surface border border-navy-surface-2 rounded-2xl p-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-gold uppercase tracking-wide">🎧 Яриа сонсох</div>
              {isPlaying && listenCurrentTurn >= 0 && (
                <div className="flex items-center gap-2">
                  {(['A', 'B'] as const).map(sp => {
                    const active = conv[listenCurrentTurn]?.speaker === sp
                    return (
                      <span key={sp} className="text-xs font-bold rounded-full flex items-center justify-center transition-all"
                        style={{
                          width: 22, height: 22,
                          background: active ? 'linear-gradient(135deg, #F59E0B, #D97706)' : '#1E293B',
                          color: active ? '#0F172A' : '#475569',
                          boxShadow: active ? '0 0 12px #F59E0B66' : 'none',
                          transform: active ? 'scale(1.1)' : 'scale(1)',
                        }}>{sp}</span>
                    )
                  })}
                </div>
              )}
            </div>

            {listenNotice && (
              <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: '#1E293B', color: '#F59E0B', border: '1px solid #F59E0B33' }}>
                ⚠ {listenNotice}
              </p>
            )}

            {!canPlay && listenAudioLoading ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => <span key={i} className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ background: '#F59E0B', animationDelay: `${i * 0.15}s` }} />)}
                </div>
                <p className="text-xs" style={{ color: '#F59E0B' }}>
                  Яриа бэлтгэж байна...
                  {listenLoadProgress.total > 0 && ` (${listenLoadProgress.done}/${listenLoadProgress.total})`}
                </p>
                {listenLoadProgress.total > 0 && (
                  <div className="w-40 h-1.5 rounded-full overflow-hidden" style={{ background: '#334155' }}>
                    <div className="h-full transition-all" style={{ width: `${(listenLoadProgress.done / listenLoadProgress.total) * 100}%`, background: '#F59E0B' }} />
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-1">
                {isPlaying ? (
                  <div className="flex flex-col items-center py-2 gap-2">
                    <ListeningWaveform />
                    <p className="text-xs" style={{ color: '#F59E0B' }}>{playStatusText}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-2">
                    {listenPlayCount === 3 && <p className="text-xs font-semibold" style={{ color: '#34D399' }}>✓ Яриа дууссан</p>}
                    {(listenAudioReady || (useFallback && ttsSupported)) && (
                      <button onClick={playConversationTwice}
                        className="px-6 py-2 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                        style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}>
                        ▶ Тоглуулах
                      </button>
                    )}
                    <p className="text-xs" style={{ color: '#64748B' }}>
                      {listenAudioError ? 'Аудио ачаалагдсангүй — дахин оролдоно уу' : 'Яриа 2 удаа автоматаар тоглуулна'}
                    </p>
                  </div>
                )}
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
                  {(q.type === 'fill') && (
                    <span className="ml-2 text-xs font-medium" style={{ color: '#94A3B8' }}>· Нөхөх</span>
                  )}
                  {(q.type === 'tfng') && (
                    <span className="ml-2 text-xs font-medium" style={{ color: '#94A3B8' }}>· True/False/NG</span>
                  )}
                </p>
                {renderQuestionBody(q, qi, listenAnswers, setListenAnswers, listenSubmitted)}
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
              <button onClick={() => setShowTranscript(v => !v)}
                className="w-full py-2 rounded-xl text-xs font-semibold border transition-colors"
                style={{ background: '#0F172A', borderColor: '#334155', color: '#94A3B8' }}>
                {showTranscript ? '🙈 Яриа нуух' : '👁 Яриа харах'}
              </button>
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
              <button onClick={() => { stopSpeech(); listenCurrentHandleRef.current?.stop(); setPhase('reading') }}
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
    const passages = content.reading.passages
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
      <div className="bg-navy-surface border border-navy-surface-2 rounded-2xl p-4 h-full overflow-y-auto">
        <div className="text-xs font-semibold text-gold uppercase tracking-wide mb-2 sticky top-0 bg-navy-surface pb-2">
          📖 Нийтлэл {pi + 1}/{passages.length}
        </div>
        <p className="text-sm leading-relaxed text-text-primary whitespace-pre-line">{pg?.passage}</p>
      </div>
    )

    const QuestionsPane = (
      <div className="bg-navy-surface border border-navy-surface-2 rounded-2xl p-4 h-full overflow-y-auto flex flex-col">
        <div className="space-y-4 flex-1">
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
        <div className="sticky bottom-0 pt-3 bg-navy-surface mt-4">
          {!readSubmitted ? (
            <button onClick={advance} disabled={!pageAnswered}
              className="w-full font-bold py-3 min-h-[48px] rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}>
              {isLastPassage ? 'Хариултаа илгээх' : 'Дараагийн нийтлэл →'}
            </button>
          ) : (
            <button onClick={() => setPhase('writing')}
              disabled={!allReadAnswered}
              className="w-full font-bold py-3 min-h-[48px] rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}>
              Writing →
            </button>
          )}
        </div>
      </div>
    )

    return (
      <div className="min-h-dvh bg-navy flex flex-col">
        <NavBar lessonTitle="Reading" />
        <div className="px-4 pt-3 max-w-6xl mx-auto w-full">
          <SectionProgress idx={sectionIdx} />
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold" style={{ color: '#F59E0B' }}>НИЙТЛЭЛ {pi + 1}/{passages.length}</p>
            <p className="text-xs font-semibold" style={{ color: '#64748B' }}>{totalAnswered}/{totalReadQs} хариулсан · Буцах боломжгүй</p>
          </div>
          <div className="flex gap-1 mb-3">
            {passages.map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full" style={{ background: i < pi ? '#34D39988' : i === pi ? '#F59E0B' : '#334155' }} />
            ))}
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden flex-1 flex flex-col px-4 pb-4 min-h-0">
          <div className="flex border-b border-navy-surface-2 mb-3">
            <button onClick={() => setReadMobileTab('passage')}
              className="flex-1 py-2.5 text-sm font-semibold transition-colors"
              style={{
                color: readMobileTab === 'passage' ? '#F59E0B' : '#64748B',
                borderBottom: readMobileTab === 'passage' ? '2px solid #F59E0B' : '2px solid transparent',
              }}>
              📖 Нийтлэл
            </button>
            <button onClick={() => setReadMobileTab('questions')}
              className="flex-1 py-2.5 text-sm font-semibold transition-colors"
              style={{
                color: readMobileTab === 'questions' ? '#F59E0B' : '#64748B',
                borderBottom: readMobileTab === 'questions' ? '2px solid #F59E0B' : '2px solid transparent',
              }}>
              ❓ Асуулт ({answeredOnPage}/{pg?.questions.length ?? 0})
            </button>
          </div>
          <div className="flex-1 min-h-0">
            {readMobileTab === 'passage' ? PassagePane : QuestionsPane}
          </div>
        </div>

        {/* Desktop split screen */}
        <div className="hidden md:flex flex-1 gap-4 px-4 pb-4 max-w-6xl mx-auto w-full min-h-0">
          <div className="w-1/2 min-h-0">{PassagePane}</div>
          <div className="w-1/2 min-h-0">{QuestionsPane}</div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════
  // ─── Writing ───
  if (phase === 'writing' && content) {
    return (
      <div className="min-h-dvh bg-navy flex flex-col">
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
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-extrabold tabular-nums" style={{ color: task1Remaining === 0 ? '#F59E0B' : '#F8FAFC' }}>⏱ {mmss(task1Remaining)}</span>
                {task1Remaining === 0 && (
                  <span className="text-xs font-semibold" style={{ color: '#F59E0B' }}>Цаг дууслаа! Гэхдээ үргэлжлүүлж болно</span>
                )}
              </div>
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
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-extrabold tabular-nums" style={{ color: task2Remaining === 0 ? '#F59E0B' : '#F8FAFC' }}>⏱ {mmss(task2Remaining)}</span>
                {task2Remaining === 0 && (
                  <span className="text-xs font-semibold" style={{ color: '#F59E0B' }}>Цаг дууслаа! Гэхдээ үргэлжлүүлж болно</span>
                )}
              </div>
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
              <button onClick={() => setPhase('speaking')} disabled={wordCount(writingTask2) < 250}
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
  // ─── Speaking — Siri-style orb conversation (ElevenLabs) ───
  if (phase === 'speaking') {
    if (!sttSupported) {
      return (
        <div className="min-h-dvh bg-navy flex flex-col items-center justify-center p-8 text-center">
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
      speakPhase === 'thinking' ? 'thinking' :
      speakPhase === 'prep' ? 'thinking' : 'idle'

    const statusColor =
      speakPhase === 'speaking' ? '#F59E0B' :
      speakPhase === 'listening' ? '#38BDF8' :
      speakPhase === 'prep' ? '#FCD34D' :
      '#8B5CF6'

    return (
      <div className="min-h-dvh bg-navy flex flex-col" style={{ background: '#050D1A' }}>
        {/* Stop button top-right — finalizes with partial answers if any */}
        {speakPhase !== 'ready' && (
          <div className="fixed top-4 right-4 z-50">
            <button
              onClick={handleStopSpeaking}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
              style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #EF4444', color: '#FCA5A5' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)' }}>
              ⏹ Дуусгах
            </button>
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          {/* Orb */}
          <SpeakOrb state={orbState} />

          {/* Status */}
          {speakPhase === 'ready' ? (
            <div className="mt-10 flex flex-col items-center gap-6 w-full max-w-xs">
              <p className="text-sm text-center" style={{ color: '#64748B' }}>
                AI шалгагч таныг асуулт асуух болно. Автоматаар дуу бичнэ.
              </p>
              {speakNotice && <p className="text-xs" style={{ color: '#F59E0B' }}>⚠ {speakNotice}</p>}
              <button
                onClick={handleStartSpeaking}
                className="w-52 py-4 rounded-2xl font-bold text-base transition-all hover:-translate-y-1 shadow-lg"
                style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}>
                🎤 Ярианы шалгалт эхлэх
              </button>
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center gap-4 w-full max-w-md">
              {/* Status label */}
              <div className="flex items-center gap-1 text-sm font-medium" style={{ color: statusColor }}>
                {speakStatus}
                {speakPhase !== 'thinking' && speakPhase !== 'prep' && (
                  <span className="inline-flex gap-0.5 ml-1">
                    {[0, 1, 2].map(i => <span key={i} className="animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}>.</span>)}
                  </span>
                )}
              </div>

              {/* Continue prompt */}
              {speakPhase === 'listening' && speakContinue && (
                <p className="text-xs" style={{ color: '#FCD34D' }}>Үргэлжлүүлнэ үү...</p>
              )}

              {/* Error notice */}
              {speakNotice && (
                <p className="text-xs px-3 py-1.5 rounded-lg" style={{ background: '#1E293B', color: '#F59E0B', border: '1px solid #F59E0B33' }}>
                  ⚠ {speakNotice}
                </p>
              )}

              {/* Prep countdown display */}
              {speakPhase === 'prep' && speakPrepCountdown !== null && (
                <div className="text-center">
                  <div className="text-5xl font-extrabold mb-2" style={{ color: '#FCD34D', letterSpacing: '-0.03em' }}>
                    0:{String(speakPrepCountdown).padStart(2, '0')}
                  </div>
                  <p className="text-xs" style={{ color: '#94A3B8' }}>Бэлдэх хугацаа</p>
                </div>
              )}

              {/* Part 2 topic card */}
              {speakShowCard && (
                <div className="text-left px-4 py-3 rounded-2xl w-full" style={{ background: '#0F172A', border: '1px solid #F59E0B55' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-gold uppercase tracking-wide">📋 Topic Card</div>
                    {speakPart2Countdown !== null && (
                      <span className="text-sm font-extrabold tabular-nums" style={{ color: speakPart2Countdown === 0 ? '#F59E0B' : '#FCD34D' }}>
                        ⏱ {mmss(speakPart2Countdown)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-text-primary whitespace-pre-line">{speakShowCard}</p>
                </div>
              )}

              {/* Current examiner question */}
              {speakPhase === 'speaking' && speakCurrentText && !speakShowCard && (
                <div className="text-center px-4 py-3 rounded-2xl w-full" style={{ background: '#0F172A55', border: '1px solid #334155' }}>
                  <p className="text-sm leading-relaxed text-text-primary">{speakCurrentText}</p>
                </div>
              )}

              {/* Live transcript (while listening) */}
              {speakPhase === 'listening' && speakTranscript && (
                <div className="text-center px-4 py-3 rounded-2xl w-full" style={{ background: '#38BDF808', border: '1px solid #38BDF822' }}>
                  <p className="text-lg leading-relaxed text-white">{speakTranscript}</p>
                </div>
              )}

              {speakPhase === 'listening' && !speakTranscript && !speakContinue && (
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

    const listenTotal = gradeResult.rawCounts?.listeningTotal ?? 10
    const listenCorrect = gradeResult.rawCounts?.listeningCorrect ?? 0
    const readTotal = gradeResult.rawCounts?.readingTotal ?? 30
    const readCorrect = gradeResult.rawCounts?.readingCorrect ?? 0
    const writingPts = Math.round((gradeResult.writing * 6) / 9)
    const speakPts = Math.round((gradeResult.speaking * 15) / 9)
    const totalPts = listenCorrect + readCorrect + writingPts + speakPts
    const maxTotal = listenTotal + readTotal + 6 + 15
    const passThreshold = Math.round(maxTotal * 0.7)
    const passedPts = totalPts >= passThreshold
    return (
      <div className="min-h-dvh bg-navy flex flex-col">
        <NavBar lessonTitle="IELTS — Үр дүн" />
        <div className="flex-1 overflow-y-auto p-4 max-w-xl mx-auto w-full page-enter-up">
          {isPartialResult && (
            <div className="mb-4 rounded-xl border p-3 text-sm" style={{ background: '#78350F', borderColor: '#F59E0B', color: '#FEF3C7' }}>
              Шалгалт дутуу дууссан. Өгсөн хариултуудын үндсэн дээр үнэлгээ:
            </div>
          )}
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

          <div className="bg-navy-surface border border-navy-surface-2 rounded-2xl p-4 mb-4">
            <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#64748B' }}>Түүхий оноо (мэдээллийн зорилгоор)</div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: '#94A3B8' }}>🎧 Listening</span>
              <span className="text-sm font-semibold text-text-primary">{listenCorrect}/{listenTotal}</span>
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: '#94A3B8' }}>📖 Reading</span>
              <span className="text-sm font-semibold text-text-primary">{readCorrect}/{readTotal}</span>
            </div>
            <div className="h-px bg-navy-surface-2 my-2" />
            <p className="text-sm leading-relaxed text-text-primary">
              Сонсох <span className="font-semibold">{listenCorrect}</span>/{listenTotal} · Уншлага <span className="font-semibold">{readCorrect}</span>/{readTotal} · Бичих <span className="font-semibold">{writingPts}</span>/6 · Ярих <span className="font-semibold">{speakPts}</span>/15 · Нийт: <span className="font-bold" style={{ color: passedPts ? '#34D399' : '#F59E0B' }}>{totalPts}</span>/{maxTotal}
            </p>
            <p className="text-xs mt-1" style={{ color: '#64748B' }}>
              Тэнцэх оноо: {passThreshold}/{maxTotal}
            </p>
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
            <button onClick={() => { stopSpeech(); setPhase('intro'); setGradeResult(null); setIsPartialResult(false) }} className="w-full font-bold py-3 min-h-[48px] rounded-xl hover:-translate-y-0.5 transition-all" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}>Дахин өгөх</button>
            <a href="/profile" className="w-full font-semibold py-3 min-h-[48px] rounded-xl border text-center text-sm" style={{ background: '#1E293B', borderColor: '#334155', color: '#94A3B8' }}>Профайл руу буцах →</a>
          </div>
        </div>
      </div>
    )
  }

  return null
}
