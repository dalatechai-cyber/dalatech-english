'use client'
import { useState, useEffect, useRef } from 'react'
import { NavBar } from './NavBar'
import type { IELTSContent, IELTSAnswers, IELTSAnswer } from '@/lib/ielts'
import { saveIELTSResult } from '@/lib/ielts'
import { saveTestResult } from '@/lib/testHistory'
import {
  speakTurn,
  stopSpeech,
  isSpeechRecognitionSupported,
  getSpeechRecognition,
  selectListeningVoiceA,
} from '@/lib/tts'
import {
  generateTTS,
  playAudioURL,
  transcribeAudio,
  fetchReaction,
  clearTTSCache,
  type AudioHandle,
} from '@/lib/elevenlabs'
import {
  generateOpenAITTS,
  clearOpenAITTSCache,
  isOpenAITTSQuotaOrRateLimit,
  type OpenAISpeaker,
} from '@/lib/openaiTTS'
import { IELTSSpeakingRealtime, type RealtimeCompletionPayload } from './IELTSSpeakingRealtime'
import { BookIcon, PencilIcon, HeadphonesIcon, MicIcon } from './Icon'
import { IELTSListening } from './ielts/IELTSListening'
import { IELTSReading } from './ielts/IELTSReading'
import { IELTSWriting } from './ielts/IELTSWriting'

// Flip to false to revert to the legacy ElevenLabs + Claude speaking pipeline kept below.
const USE_REALTIME = true

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

function mmss(sec: number): string {
  const m = Math.floor(Math.max(0, sec) / 60)
  const s = Math.max(0, sec) % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const GREETING = "Hello, my name is Sarah and I'll be conducting your IELTS Speaking test today. Let's begin with some questions about yourself."
const PART2_INTRO = "Now I'd like you to talk about a topic. You have one minute to prepare. Here is your topic card."
const PART2_BEGIN = "Please begin."
const CLOSING = "Thank you very much. That's the end of the speaking test. Well done for completing it. Your detailed results will be ready in just a moment."

function answerLabel(q: IELTSContent['listening']['questions'][number], a: IELTSAnswer): string {
  if (typeof a === 'number' && q.options) return q.options[a] ?? String(a)
  if (typeof a === 'string') return a
  return '—'
}

function correctLabel(q: IELTSContent['listening']['questions'][number]): string {
  if (typeof q.correct === 'number' && q.options) return q.options[q.correct] ?? ''
  if (q.acceptedAnswers?.[0]) return q.acceptedAnswers[0]
  return ''
}

function isAnswerWrong(q: IELTSContent['listening']['questions'][number], a: IELTSAnswer): boolean {
  const type = q.type ?? 'mc'
  if (type === 'fill' || type === 'short') {
    if (typeof a !== 'string' || !a.trim()) return true
    const list = q.acceptedAnswers ?? []
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9а-яёөү\s]/g, '').replace(/\s+/g, ' ').trim()
    const s = norm(a)
    return !list.some(x => norm(x) === s)
  }
  return typeof a !== 'number' || a !== q.correct
}

function collectWrongAnswers(content: IELTSContent, ans: IELTSAnswers): string[] {
  const out: string[] = []
  content.listening.questions.forEach((q, i) => {
    if (isAnswerWrong(q, ans.listeningAnswers[i] ?? null)) {
      out.push(`Listening Q${i + 1}: ${q.question} → Таны хариулт: ${answerLabel(q, ans.listeningAnswers[i] ?? null)}; Зөв: ${correctLabel(q)}`)
    }
  })
  let ri = 0
  content.reading.passages.forEach(p => {
    p.questions.forEach(q => {
      const a = ans.readingAnswers[ri] ?? null
      if (isAnswerWrong(q, a)) {
        out.push(`Reading Q${ri + 1}: ${q.question} → Таны хариулт: ${answerLabel(q, a)}; Зөв: ${correctLabel(q)}`)
      }
      ri += 1
    })
  })
  return out
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

const IELTS_SESSION_KEY = 'ielts-session'
const IELTS_SESSION_MAX_AGE_MS = 3 * 60 * 60 * 1000

type SavedPhase = 'listening' | 'reading' | 'writing' | 'speaking' | 'results'
interface SavedSession {
  phase: SavedPhase
  content: IELTSContent
  listeningAnswers: IELTSAnswer[]
  readingAnswers: IELTSAnswer[]
  writingTask1: string
  writingTask2: string
  currentPassage: 0 | 1 | 2
  timestamp: number
}

function readSavedSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(IELTS_SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as SavedSession
    if (typeof session.timestamp !== 'number') return null
    const age = Date.now() - session.timestamp
    if (age >= IELTS_SESSION_MAX_AGE_MS) {
      localStorage.removeItem(IELTS_SESSION_KEY)
      return null
    }
    return session
  } catch { return null }
}
function writeSavedSession(session: Omit<SavedSession, 'timestamp'>): void {
  try {
    localStorage.setItem(IELTS_SESSION_KEY, JSON.stringify({ ...session, timestamp: Date.now() }))
  } catch { /* quota or unavailable — ignore */ }
}
function clearSavedSession(): void {
  try { localStorage.removeItem(IELTS_SESSION_KEY) } catch { /* ignore */ }
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

export function IELTSTest() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState<IELTSContent | null>(null)
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null)
  const [isPartialResult, setIsPartialResult] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showRestorePrompt, setShowRestorePrompt] = useState(false)
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null)
  const [contentFullyLoaded, setContentFullyLoaded] = useState(false)

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
  // When true, the Realtime component asked to fall back to the legacy speaking UI.
  const [realtimeFallback, setRealtimeFallback] = useState(false)
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
  const [sttSupported, setSttSupported] = useState(true)
  useEffect(() => {
    setSttSupported(isSpeechRecognitionSupported())
    setMounted(true)
    // Check for restorable in-flight test from a prior tab/refresh.
    const session = readSavedSession()
    if (session) {
      setSavedSession(session)
      setShowRestorePrompt(true)
    }
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
    clearOpenAITTSCache()
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
  // ElevenLabs Starter plan caps at 3 concurrent requests; BATCH_SIZE=2 leaves a
  // retry buffer so overlapping retries don't trip the 429 concurrent-limit error.
  // Gate on a ref (not state) so setState inside the effect doesn't retrigger cleanup.
  const ttsAbortRef = useRef<AbortController | null>(null)
  useEffect(() => {
    if (phase !== 'listening' || !content) return
    if (listenLoadStartedRef.current) return
    listenLoadStartedRef.current = true

    let cancelled = false
    const controller = new AbortController()
    ttsAbortRef.current = controller
    const { signal } = controller
    setListenAudioLoading(true)
    setListenNotice(null)

    const turns = content.listening.conversation
    const total = turns.length
    setListenLoadProgress({ done: 0, total })

    let sawQuotaOrRateLimit = false

    ;(async () => {
      const BATCH_SIZE = 2
      const urls: (string | null)[] = new Array(total).fill(null)

      // Retry once on 502/upstream errors before giving up on this turn.
      const loadWithRetry = async (text: string, speaker: OpenAISpeaker): Promise<string> => {
        try {
          return await generateOpenAITTS(text, speaker, signal)
        } catch (err) {
          if (signal.aborted) throw err
          if (isOpenAITTSQuotaOrRateLimit(err)) sawQuotaOrRateLimit = true
          const msg = err instanceof Error ? err.message : String(err)
          if (/502|503|504/.test(msg)) {
            await new Promise(r => setTimeout(r, 1000))
            if (signal.aborted) throw err
            try {
              return await generateOpenAITTS(text, speaker, signal)
            } catch (retryErr) {
              if (isOpenAITTSQuotaOrRateLimit(retryErr)) sawQuotaOrRateLimit = true
              throw retryErr
            }
          }
          throw err
        }
      }

      for (let i = 0; i < total; i += BATCH_SIZE) {
        if (cancelled || signal.aborted) return
        const batch = turns.slice(i, i + BATCH_SIZE)
        await Promise.all(
          batch.map(async (turn, j) => {
            if (signal.aborted) return
            const idx = i + j
            try {
              const url = await loadWithRetry(turn.text, turn.speaker)
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

      if (cancelled || signal.aborted) return
      const successCount = urls.filter(u => u !== null).length
      const failedCount = total - successCount
      listenAudiosRef.current = urls.map(u => u ?? '')
      // IELTSListening already prepends "⚠" to listenNotice, so don't duplicate it here.
      const quotaNotice = 'Дуу ачааллахад алдаа гарлаа. Хэсэг хугацааны дараа дахин оролдоно уу.'
      if (successCount === 0) {
        setListenAudioError(true)
        setListenNotice(sawQuotaOrRateLimit ? quotaNotice : 'Дуу ачааллахад алдаа гарлаа')
      } else {
        if (failedCount > 0) {
          setListenNotice(sawQuotaOrRateLimit ? quotaNotice : `${failedCount} хэсэг ачаалагдсангүй`)
        }
        setListenAudioReady(true)
      }
      setListenAudioLoading(false)
    })()

    return () => {
      cancelled = true
      controller.abort()
      if (ttsAbortRef.current === controller) ttsAbortRef.current = null
    }
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

  // ── Persist session after content generates, on answer changes, on phase transitions ──
  // Writing text has its own debounced saver below to avoid thrashing localStorage.
  useEffect(() => {
    if (!contentFullyLoaded) return
    if (!content) return
    if (phase === 'intro' || phase === 'loading' || phase === 'grading') return
    // Speaking phase is not safely restorable mid-session; still persist so refresh
    // during speaking can fall back to writing per restore handler.
    const persistPhase: SavedPhase =
      phase === 'results' ? 'results' :
      phase === 'speaking' ? 'speaking' :
      phase === 'writing' ? 'writing' :
      phase === 'reading' ? 'reading' : 'listening'
    const currentPassage = (Math.min(2, Math.max(0, readPassageIdx)) as 0 | 1 | 2)
    writeSavedSession({
      phase: persistPhase,
      content,
      listeningAnswers: listenAnswers,
      readingAnswers: readAnswers,
      writingTask1,
      writingTask2,
      currentPassage,
    })
  }, [phase, content, listenAnswers, readAnswers, readPassageIdx, contentFullyLoaded])

  // Debounced writing save (2s after last keystroke). Only runs in writing phase.
  useEffect(() => {
    if (!contentFullyLoaded) return
    if (phase !== 'writing') return
    if (!content) return
    const id = setTimeout(() => {
      const currentPassage = (Math.min(2, Math.max(0, readPassageIdx)) as 0 | 1 | 2)
      writeSavedSession({
        phase: 'writing',
        content,
        listeningAnswers: listenAnswers,
        readingAnswers: readAnswers,
        writingTask1,
        writingTask2,
        currentPassage,
      })
    }, 2000)
    return () => clearTimeout(id)
  }, [writingTask1, writingTask2, phase, contentFullyLoaded])

  // ── Writing countdown timers ──
  const writingTaskViewRef = useRef<1 | 2>(1)
  useEffect(() => { writingTaskViewRef.current = writingTaskView }, [writingTaskView])
  const writingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (phase !== 'writing') return
    if (writingTimerRef.current) clearInterval(writingTimerRef.current)
    writingTimerRef.current = setInterval(() => {
      if (writingTaskViewRef.current === 1) setTask1Remaining(t => Math.max(0, t - 1))
      else setTask2Remaining(t => Math.max(0, t - 1))
    }, 1000)
    return () => {
      if (writingTimerRef.current) {
        clearInterval(writingTimerRef.current)
        writingTimerRef.current = null
      }
    }
  }, [phase])

  // ── Part 2 long-turn countdown tick ──
  useEffect(() => {
    if (speakPart2Countdown === null || speakPart2Countdown <= 0) return
    const id = setTimeout(
      () => setSpeakPart2Countdown(c => (c === null ? null : Math.max(0, c - 1))),
      1000,
    )
    return () => clearTimeout(id)
  }, [speakPart2Countdown])

  // ── Play conversation twice (OpenAI TTS — skip turns that failed to preload) ──
  const playConversationTwice = async () => {
    if (!content || isPlaying) return
    setIsPlaying(true)
    playingRef.current = true

    for (let play = 1; play <= 2; play++) {
      if (!playingRef.current) break
      setListenPlayCount(play)
      for (let i = 0; i < content.listening.conversation.length; i++) {
        if (!playingRef.current) break
        if (i > 0) { await new Promise<void>(r => setTimeout(r, 350)); if (!playingRef.current) break }
        setListenCurrentTurn(i)

        const cachedUrl = listenAudiosRef.current[i] ?? ''
        if (!cachedUrl) continue
        const handle = playAudioURL(cachedUrl)
        listenCurrentHandleRef.current = handle
        await handle.promise
        listenCurrentHandleRef.current = null
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
        if (stream) {
          stream.getTracks().forEach(t => { try { t.stop() } catch { /* ignore */ } })
          mediaStreamRef.current = null
          stream = null
        }
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
      const lTotal = content.listening.questions.length
      const rTotal = content.reading.passages.reduce((n, p) => n + p.questions.length, 0)
      const listeningBand = Number.isFinite(result.listening) ? result.listening : 0
      const readingBand = Number.isFinite(result.reading) ? result.reading : 0
      const writingBand = Number.isFinite(result.writing) ? result.writing : 0
      const speakingBand = Number.isFinite(result.speaking) ? result.speaking : 0
      const overallBand = Number.isFinite(result.overall) ? result.overall : 0
      const lCorrect = lTotal > 0 ? Math.round((listeningBand / 9) * lTotal) : 0
      const rCorrect = rTotal > 0 ? Math.round((readingBand / 9) * rTotal) : 0
      const wrongAnswers = collectWrongAnswers(content, gradePayload)
      saveIELTSResult({ date: new Date().toISOString().slice(0, 10), overall: overallBand, listening: listeningBand, reading: readingBand, writing: writingBand, speaking: speakingBand, feedback: result.writingFeedback })

      // Generate AI feedback ONCE now so profile never re-hits the API.
      let feedbackText = ''
      try {
        const fbRes = await fetch('/api/ielts/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listeningScore: lCorrect,
            readingScore: rCorrect,
            writingBand,
            speakingBand,
            overallBand,
            wrongAnswers,
          }),
        })
        if (fbRes.ok) {
          feedbackText = await fbRes.text()
        }
      } catch {
        // Swallow — empty feedback means profile shows the fallback message.
      }

      saveTestResult({
        type: 'ielts',
        ieltsBand: overallBand,
        overallBand,
        listeningScore: lCorrect,
        readingScore: rCorrect,
        writingBand,
        speakingBand,
        wrongAnswers,
        feedback: feedbackText,
      })
      clearSavedSession()
      setPhase('results')
    } catch {
      setError('Үнэлгээ хийхэд алдаа гарлаа.')
      setPhase('intro')
    }
  }

  // ── Realtime (OpenAI) handlers ────────────────────────
  // Stitches the Realtime transcript into the existing grade-submission pipeline.
  const handleRealtimeComplete = async (payload: RealtimeCompletionPayload) => {
    if (!content) return
    const p1 = content.speaking.part1Questions.length
    const p3 = content.speaking.part3Questions.length
    speakAnswersRef.current = [
      ...payload.speakingPart1.slice(0, p1),
      payload.speakingPart2,
      ...payload.speakingPart3.slice(0, p3),
    ]
    questionsAskedRef.current = p1 + 1 + p3
    await gradeAndShowResults()
  }

  const handleRealtimeStop = (partial: RealtimeCompletionPayload | null) => {
    // We're in the speaking phase here, so Listening + Reading + Writing are
    // already complete — always grade and show results, even if the student
    // answered zero speaking questions (speaking band will default low).
    if (!content) {
      setError('Шалгалт эхлээгүй байна')
      setPhase('intro')
      return
    }
    setIsPartialResult(true)
    const p1Count = content.speaking.part1Questions.length
    const p3Count = content.speaking.part3Questions.length
    const payload: RealtimeCompletionPayload = partial ?? {
      speakingPart1: Array<string>(p1Count).fill(''),
      speakingPart2: '',
      speakingPart3: Array<string>(p3Count).fill(''),
      fullTranscript: [],
    }
    void handleRealtimeComplete(payload)
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

    // Writing is already complete by the time we reach the speaking phase,
    // so always grade — speaking band just defaults low when unanswered.
    setIsPartialResult(true)
    gradeAndShowResults()
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

  // ── Resume a saved session from localStorage ──
  const resumeSavedSession = () => {
    if (!savedSession) return
    const s = savedSession
    setShowRestorePrompt(false)
    setContent(s.content)
    setContentFullyLoaded(true)
    setListenAnswers(s.listeningAnswers)
    setReadAnswers(s.readingAnswers)
    setWritingTask1(s.writingTask1)
    setWritingTask2(s.writingTask2)
    setReadPassageIdx(s.currentPassage)
    setError(null)
    // If student refreshed during speaking, speaking must restart — send them back to writing.
    if (s.phase === 'speaking') {
      setSpeakNotice('Ярианы шалгалт дахин эхлэх шаардлагатай')
      setPhase('writing')
    } else if (s.phase === 'results') {
      // If the saved session is at results with no grade data we can't reconstruct scoring,
      // so send the student back to writing where they left off their answers.
      setPhase('writing')
    } else {
      setPhase(s.phase)
    }
    setSavedSession(null)
  }

  const discardSavedSession = () => {
    clearSavedSession()
    setSavedSession(null)
    setShowRestorePrompt(false)
  }

  // ── Start test ──
  const startTest = async () => {
    clearSavedSession()
    setShowRestorePrompt(false)
    setSavedSession(null)
    setPhase('loading')
    setError(null)
    clearTTSCache()
    clearOpenAITTSCache()
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
    setRealtimeFallback(false)
    setGradeResult(null)
    setIsPartialResult(false)
    setContentFullyLoaded(false)

    const usedTopics = (() => { try { return JSON.parse(localStorage.getItem('core-ielts-used-topics') ?? '[]') as string[] } catch { return [] } })()

    try {
      const seed = Date.now()

      // Fire both endpoints in parallel via Promise.all so a failure on either
      // surfaces in one catch block. The listening TTS preload still fires on
      // phase change to 'listening' — both fetches complete before that.
      const [listenData, contentData] = await Promise.all([
        fetch('/api/ielts/generate-listening', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seed }),
        }).then(async res => {
          if (!res.ok) {
            const errBody = await res.text().catch(() => '')
            throw new Error(`Listening failed (${res.status}): ${errBody.slice(0, 200)}`)
          }
          return res.json() as Promise<{ listening: IELTSContent['listening'] }>
        }),
        fetch('/api/ielts/generate-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seed, usedTopics }),
        }).then(async res => {
          if (!res.ok) {
            const errBody = await res.text().catch(() => '')
            throw new Error(`Content failed (${res.status}): ${errBody.slice(0, 200)}`)
          }
          return res.json() as Promise<{ reading: IELTSContent['reading']; writing: IELTSContent['writing']; speaking: IELTSContent['speaking'] }>
        }),
      ])

      if (!listenData.listening?.conversation) throw new Error('Invalid listening')
      if (!contentData.reading || !contentData.writing || !contentData.speaking) throw new Error('Invalid content')

      const part2Topic = contentData.speaking.part2Card.split('\n')[0]?.slice(0, 60) ?? ''
      if (part2Topic) try { const s = JSON.parse(localStorage.getItem('core-ielts-used-topics') ?? '[]') as string[]; localStorage.setItem('core-ielts-used-topics', JSON.stringify([part2Topic, ...s].slice(0, 5))) } catch { /* ignore */ }

      setContent({
        listening: listenData.listening,
        reading: contentData.reading,
        writing: contentData.writing,
        speaking: contentData.speaking,
      })
      setListenAnswers(Array(listenData.listening.questions.length).fill(null))
      const totalReadQs = contentData.reading.passages.reduce((n, p) => n + p.questions.length, 0)
      setReadAnswers(Array(totalReadQs).fill(null))
      setContentFullyLoaded(true)
      setPhase('listening')
    } catch (err) {
      console.error('IELTS test load failed:', err)
      setError('Тест ачаалахад алдаа гарлаа. Дахин оролдоно уу.')
      setPhase('intro')
    }
  }

  // Renders the answer UI for a question based on its type.
  // Choice types (mc / tfng / matching) → option buttons.
  // Text types (fill / short) → text input; graded on submit via acceptedAnswers.
  const sectionIdx = (['listening', 'reading', 'writing', 'speaking'] as Phase[]).indexOf(phase)

  // ══════════════════════════════════════════
  // Prevent SSR/hydration flash on direct /ielts navigation
  if (!mounted) return <Spinner label="Ачаалж байна..." />
  // ─── Intro ───
  if (phase === 'intro') {
    return (
      <div className="min-h-dvh bg-navy flex flex-col">
        <NavBar lessonTitle="IELTS Mock Test" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 max-w-2xl mx-auto w-full text-center page-enter-up">
          <div
            className="text-[11px] font-semibold uppercase tracking-[0.22em] mb-4"
            style={{ color: 'var(--champagne)' }}
          >
            IELTS · Academic
          </div>
          <h1
            className="font-serif-display text-5xl sm:text-6xl font-bold leading-none mb-4"
            style={{
              background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 50%, #E4C08A 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.03em',
            }}
          >
            Mock Test
          </h1>
          <div
            className="h-px w-16 mx-auto mb-5"
            style={{ background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }}
          />
          <p
            className="text-sm sm:text-base leading-relaxed mb-10 max-w-md"
            style={{ color: 'var(--text-secondary)' }}
          >
            4 хэсэгтэй бүтэн тест. Listening, Reading, Writing, Speaking.
            Дуусгасны дараа 1–9 Band оноо авна.
          </p>
          {error && (
            <p
              className="text-sm mb-4 px-4 py-2 rounded-lg"
              style={{
                color: '#F87171',
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.25)',
              }}
            >
              {error}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 w-full mb-10">
            {[
              { num: '01', label: 'Listening', detail: '10 асуулт · Яриа 2 удаа' },
              { num: '02', label: 'Reading', detail: '30 асуулт · 3 нийтлэл' },
              { num: '03', label: 'Writing', detail: 'Task 1 + Task 2' },
              { num: '04', label: 'Speaking', detail: sttSupported ? 'AI яриа · Автомат' : 'Дуу таних боломжгүй' },
            ].map(s => (
              <div
                key={s.label}
                className="rounded-2xl p-5 text-left shadow-editorial"
                style={{
                  background: '#141C30',
                  border: '1px solid var(--hairline)',
                }}
              >
                <div
                  className="font-serif-display text-xs nums-tabular tracking-widest mb-3"
                  style={{ color: 'var(--champagne)' }}
                >
                  {s.num}
                </div>
                <div
                  className="font-serif-display text-lg font-medium mb-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {s.label}
                </div>
                <div
                  className="text-[11px] leading-relaxed uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {s.detail}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={startTest}
            className="w-full sm:w-auto sm:px-10 font-semibold py-3.5 min-h-[48px] rounded-xl transition-all hover:-translate-y-0.5 text-sm uppercase tracking-[0.18em]"
            style={{
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#0B1222',
              boxShadow: '0 6px 20px rgba(245,158,11,0.28)',
            }}
          >
            Шинэ шалгалт эхлэх
          </button>
        </div>

        {showRestorePrompt && savedSession && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(7,12,24,0.88)', backdropFilter: 'blur(4px)' }}
          >
            <div
              className="max-w-sm w-full rounded-2xl p-6 shadow-editorial"
              style={{
                background: '#141C30',
                border: '1px solid var(--hairline)',
                borderLeftWidth: '3px',
                borderLeftColor: 'var(--gold)',
              }}
            >
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-2"
                style={{ color: 'var(--champagne)' }}
              >
                Session · Restore
              </div>
              <h2
                className="font-serif-display text-xl font-medium mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Тест үргэлжлүүлэх үү?
              </h2>
              <p
                className="text-sm leading-relaxed mb-5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Таны өмнөх тест хадгалагдсан байна. Үргэлжлүүлэх үү?
              </p>
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={resumeSavedSession}
                  className="w-full font-semibold py-3 min-h-[48px] rounded-xl text-sm uppercase tracking-[0.18em]"
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: '#0B1222',
                    boxShadow: '0 4px 14px rgba(245,158,11,0.25)',
                  }}
                >
                  Үргэлжлүүлэх
                </button>
                <button
                  onClick={discardSavedSession}
                  className="w-full font-medium py-3 min-h-[48px] rounded-xl text-sm uppercase tracking-[0.18em]"
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--hairline)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Шинэ тест эхлэх
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (phase === 'loading') return <Spinner label="Шалгалт бэлдэж байна..." />
  if (phase === 'grading') return <Spinner label="Үнэлж байна... (30–60 секунд)" />

  // ══════════════════════════════════════════
  // ─── Listening — ElevenLabs with fallback ───
  if (phase === 'listening' && content) {
    return (
      <IELTSListening
        content={content}
        sectionIdx={sectionIdx}
        listenAnswers={listenAnswers}
        setListenAnswers={setListenAnswers}
        listenSubmitted={listenSubmitted}
        setListenSubmitted={setListenSubmitted}
        listenPlayCount={listenPlayCount}
        listenAudioReady={listenAudioReady}
        listenAudioError={listenAudioError}
        listenAudioLoading={listenAudioLoading}
        listenLoadProgress={listenLoadProgress}
        listenNotice={listenNotice}
        listenCurrentTurn={listenCurrentTurn}
        isPlaying={isPlaying}
        showTranscript={showTranscript}
        setShowTranscript={setShowTranscript}
        playConversationTwice={playConversationTwice}
        listenCurrentHandleRef={listenCurrentHandleRef}
        onAdvance={() => setPhase('reading')}
      />
    )
  }

  // ══════════════════════════════════════════
  // ─── Reading ───
  if (phase === 'reading' && content) {
    return (
      <IELTSReading
        content={content}
        sectionIdx={sectionIdx}
        readAnswers={readAnswers}
        setReadAnswers={setReadAnswers}
        readSubmitted={readSubmitted}
        setReadSubmitted={setReadSubmitted}
        readPassageIdx={readPassageIdx}
        setReadPassageIdx={setReadPassageIdx}
        readMobileTab={readMobileTab}
        setReadMobileTab={setReadMobileTab}
        onAdvance={() => setPhase('writing')}
      />
    )
  }

  // ══════════════════════════════════════════
  // ─── Writing ───
  if (phase === 'writing' && content) {
    return (
      <IELTSWriting
        content={content}
        sectionIdx={sectionIdx}
        writingTask1={writingTask1}
        setWritingTask1={setWritingTask1}
        writingTask2={writingTask2}
        setWritingTask2={setWritingTask2}
        writingTaskView={writingTaskView}
        setWritingTaskView={setWritingTaskView}
        task1Remaining={task1Remaining}
        task2Remaining={task2Remaining}
        onAdvance={() => setPhase('speaking')}
      />
    )
  }

  // ══════════════════════════════════════════
  // ─── Speaking — OpenAI Realtime (default) or legacy ElevenLabs fallback ───
  if (phase === 'speaking' && USE_REALTIME && !realtimeFallback && content) {
    return (
      <IELTSSpeakingRealtime
        content={content}
        onComplete={handleRealtimeComplete}
        onStop={handleRealtimeStop}
        onFallback={() => setRealtimeFallback(true)}
      />
    )
  }

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
        {/* Stop button — mobile: fixed bottom-center (clears hamburger); desktop: top-right */}
        {speakPhase !== 'ready' && (
          <>
            <div className="hidden md:block fixed top-4 right-4 z-50">
              <button
                onClick={handleStopSpeaking}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #EF4444', color: '#FCA5A5' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)' }}>
                ⏹ Дуусгах
              </button>
            </div>
            <div className="md:hidden fixed z-50" style={{ bottom: 24, left: '50%', transform: 'translateX(-50%)' }}>
              <button
                onClick={handleStopSpeaking}
                className="rounded-xl font-semibold text-sm"
                style={{ minWidth: 160, minHeight: 48, padding: '14px 32px', background: 'rgba(239, 68, 68, 0.9)', border: '1px solid #EF4444', color: '#FFF5F5', boxShadow: '0 8px 24px rgba(239,68,68,0.4)' }}>
                ⏹ Дуусгах
              </button>
            </div>
          </>
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

    const listenTotal = content?.listening.questions.length ?? 10
    const readTotal = content?.reading.passages.reduce((n, p) => n + p.questions.length, 0) ?? 30
    const listenCorrect = Math.round((gradeResult.listening / 9) * listenTotal)
    const readCorrect = Math.round((gradeResult.reading / 9) * readTotal)
    const writingPts = Math.round((gradeResult.writing * 6) / 9)
    const speakPts = Math.round((gradeResult.speaking * 15) / 9)
    const totalPts = listenCorrect + readCorrect + writingPts + speakPts
    const maxTotal = listenTotal + readTotal + 6 + 15
    const passThreshold = Math.round(maxTotal * 0.7)
    const passedPts = totalPts >= passThreshold
    return (
      <div className="min-h-dvh flex flex-col" style={{ background: 'var(--navy-deep)' }}>
        <NavBar lessonTitle="IELTS — Үр дүн" />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-2xl mx-auto w-full page-enter-up">
          {isPartialResult && (
            <div
              className="mb-5 rounded-xl p-4 text-sm shadow-editorial"
              style={{
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid var(--hairline)',
                borderLeftWidth: '3px',
                borderLeftColor: 'var(--gold)',
                color: 'var(--text-primary)',
              }}
            >
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-1"
                style={{ color: 'var(--champagne)' }}
              >
                Partial · Assessment
              </div>
              Шалгалт дутуу дууссан. Өгсөн хариултуудын үндсэн дээр үнэлгээ:
            </div>
          )}

          <div className="text-center mb-8 py-8">
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.28em] mb-3"
              style={{ color: 'var(--champagne)' }}
            >
              Overall · Band
            </div>
            <div
              className="font-serif-display font-medium leading-none nums-tabular mb-3"
              style={{
                fontSize: 'clamp(5rem, 18vw, 8rem)',
                background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 50%, #E4C08A 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.04em',
              }}
            >
              {gradeResult.overall}
            </div>
            <div
              className="h-px w-16 mx-auto mb-3"
              style={{ background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }}
            />
            <div
              className="text-[11px] font-semibold uppercase tracking-[0.24em]"
              style={{ color: bandColor(gradeResult.overall) }}
            >
              {bandLabel(gradeResult.overall)}
            </div>
          </div>

          <div
            className="rounded-2xl p-5 mb-4 shadow-editorial"
            style={{
              background: '#141C30',
              border: '1px solid var(--hairline)',
            }}
          >
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-4"
              style={{ color: 'var(--champagne)' }}
            >
              Section · Scores
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Listening', value: gradeResult.listening, Icon: HeadphonesIcon },
                { label: 'Reading', value: gradeResult.reading, Icon: BookIcon },
                { label: 'Writing', value: gradeResult.writing, Icon: PencilIcon },
                { label: 'Speaking', value: gradeResult.speaking, Icon: MicIcon },
              ].map(s => (
                <div
                  key={s.label}
                  className="rounded-xl p-4 text-center"
                  style={{
                    background: '#0F1729',
                    border: '1px solid var(--hairline)',
                  }}
                >
                  <span
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full mb-2"
                    style={{
                      background: 'rgba(245,158,11,0.10)',
                      color: 'var(--gold)',
                      border: '1px solid rgba(245,158,11,0.22)',
                    }}
                  >
                    <s.Icon size={18} />
                  </span>
                  <div
                    className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-1.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {s.label}
                  </div>
                  <div
                    className="font-sans text-3xl font-semibold nums-tabular leading-none"
                    style={{ color: bandColor(s.value) }}
                  >
                    {s.value}
                  </div>
                  <div
                    className="text-[9px] font-semibold uppercase tracking-[0.18em] mt-1.5"
                    style={{ color: bandColor(s.value), opacity: 0.85 }}
                  >
                    {bandLabel(s.value)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-2xl p-5 mb-4 shadow-editorial"
            style={{
              background: '#141C30',
              border: '1px solid var(--hairline)',
            }}
          >
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-3"
              style={{ color: 'var(--champagne)' }}
            >
              Raw · Scores
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <HeadphonesIcon size={14} />
                Listening
              </span>
              <span
                className="text-sm font-semibold nums-tabular"
                style={{ color: 'var(--text-primary)' }}
              >
                {listenCorrect}<span style={{ color: 'var(--text-muted)' }}>/{listenTotal}</span>
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <BookIcon size={14} />
                Reading
              </span>
              <span
                className="text-sm font-semibold nums-tabular"
                style={{ color: 'var(--text-primary)' }}
              >
                {readCorrect}<span style={{ color: 'var(--text-muted)' }}>/{readTotal}</span>
              </span>
            </div>
            <div className="h-px my-3" style={{ background: 'var(--hairline)' }} />
            <p
              className="font-sans text-sm leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              Сонсох <span className="font-semibold not-italic nums-tabular" style={{ color: 'var(--text-primary)' }}>{listenCorrect}</span>/{listenTotal} · Уншлага <span className="font-semibold not-italic nums-tabular" style={{ color: 'var(--text-primary)' }}>{readCorrect}</span>/{readTotal} · Бичих <span className="font-semibold not-italic nums-tabular" style={{ color: 'var(--text-primary)' }}>{writingPts}</span>/6 · Ярих <span className="font-semibold not-italic nums-tabular" style={{ color: 'var(--text-primary)' }}>{speakPts}</span>/15 · Нийт: <span className="font-bold not-italic nums-tabular" style={{ color: passedPts ? '#34D399' : 'var(--gold)' }}>{totalPts}</span>/{maxTotal}
            </p>
            <p
              className="text-[11px] mt-2 uppercase tracking-[0.18em] font-semibold"
              style={{ color: 'var(--text-muted)' }}
            >
              Pass · {passThreshold}/{maxTotal}
            </p>
          </div>

          {criteriaRows.length > 0 && (
            <div
              className="rounded-2xl p-5 mb-4 shadow-editorial"
              style={{
                background: '#141C30',
                border: '1px solid var(--hairline)',
                borderLeftWidth: '3px',
                borderLeftColor: 'var(--gold)',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span style={{ color: 'var(--gold)' }}><PencilIcon size={16} /></span>
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.22em]"
                  style={{ color: 'var(--champagne)' }}
                >
                  Writing · Criteria
                </div>
              </div>
              <div className="space-y-2.5">
                {criteriaRows.map(r => (
                  <div key={r.label} className="flex items-center justify-between">
                    <span
                      className="font-sans text-[13px]"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {r.label}
                    </span>
                    <span
                      className="font-sans text-lg font-semibold nums-tabular"
                      style={{ color: bandColor(r.value) }}
                    >
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>
              {gradeResult.writingFeedback && (
                <p
                  className="font-sans text-[13px] mt-4 pt-4 leading-relaxed"
                  style={{ color: 'var(--text-secondary)', borderTop: '1px solid var(--hairline)' }}
                >
                  {gradeResult.writingFeedback}
                </p>
              )}
            </div>
          )}

          {speakRows.length > 0 && (
            <div
              className="rounded-2xl p-5 mb-6 shadow-editorial"
              style={{
                background: '#141C30',
                border: '1px solid var(--hairline)',
                borderLeftWidth: '3px',
                borderLeftColor: 'var(--gold)',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span style={{ color: 'var(--gold)' }}><MicIcon size={16} /></span>
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.22em]"
                  style={{ color: 'var(--champagne)' }}
                >
                  Speaking · Criteria
                </div>
              </div>
              <div className="space-y-2.5">
                {speakRows.map(r => (
                  <div key={r.label} className="flex items-center justify-between">
                    <span
                      className="font-sans text-[13px]"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {r.label}
                    </span>
                    <span
                      className="font-sans text-lg font-semibold nums-tabular"
                      style={{ color: bandColor(r.value) }}
                    >
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>
              {gradeResult.speakingFeedback && (
                <p
                  className="font-sans text-[13px] mt-4 pt-4 leading-relaxed"
                  style={{ color: 'var(--text-secondary)', borderTop: '1px solid var(--hairline)' }}
                >
                  {gradeResult.speakingFeedback}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={() => { stopSpeech(); setPhase('intro'); setGradeResult(null); setIsPartialResult(false) }}
              className="w-full font-semibold py-3 min-h-[48px] rounded-xl transition-all text-sm uppercase tracking-[0.18em]"
              style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#0B1222',
                boxShadow: '0 6px 20px rgba(245,158,11,0.28)',
              }}
            >
              Дахин өгөх
            </button>
            <a
              href="/profile"
              className="w-full py-3 min-h-[48px] rounded-xl text-center text-[13px] uppercase tracking-[0.18em] font-semibold transition-colors"
              style={{
                background: 'transparent',
                border: '1px solid var(--hairline)',
                color: 'var(--text-secondary)',
              }}
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
