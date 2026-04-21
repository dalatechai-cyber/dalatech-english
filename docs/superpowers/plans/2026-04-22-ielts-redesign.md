# IELTS Complete Redesign — TTS, STT, Real Grading, Enhanced Questions

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the IELTS mock test to feel real: Listening with Text-to-Speech (Web Speech API) for a two-speaker conversation, Reading with more question types, Writing with 4-criteria IELTS grading, Speaking with TTS examiner + STT student input, and a rich results page. All content varies per session via a timestamp seed.

**Architecture:** Two new API routes (`/api/ielts/generate` and `/api/ielts/grade`) are completely rewritten. `IELTSTest.tsx` is fully rewritten as a multi-phase component. A new helper module `src/lib/tts.ts` wraps Web Speech API. `src/lib/ielts.ts` gets enhanced types. The `/ielts` page gets a proper landing with history. Each API call receives `Date.now()` as a seed in the prompt so content differs every time.

**Tech Stack:** Next.js 14, React 18, TypeScript, Web Speech API (SpeechSynthesis + SpeechRecognition), Anthropic claude-sonnet-4-6, localStorage

**Notes:**
- SpeechRecognition requires HTTPS — works on Vercel, may not work on localhost (expected behavior, gracefully falls back to textarea).
- All new text is in Mongolian.
- The existing `src/lib/ielts.ts` types are expanded, backward compatible.

---

## File Map

| File | Change |
|---|---|
| `src/lib/ielts.ts` | Add IELTSConversationTurn, IELTSWritingFeedback types; keep existing types |
| `src/lib/tts.ts` | NEW — thin Web Speech API wrapper (speak, stop, voices) |
| `src/app/api/ielts/generate/route.ts` | Complete rewrite — timestamp seed, 2-speaker conversation, 3-passage reading |
| `src/app/api/ielts/grade/route.ts` | Complete rewrite — 4-criteria writing + speaking grading |
| `src/components/IELTSTest.tsx` | Complete rewrite — TTS listening, STT speaking, rich UI |
| `src/app/ielts/page.tsx` | Enhanced landing with IELTS history display |

---

## Task 1: Extend `src/lib/ielts.ts` with enhanced types

**Files:**
- Modify: `src/lib/ielts.ts`

Keep all existing types and functions. Add new types at the top. The full updated file:

- [ ] **Step 1: Write the full updated ielts.ts**

```typescript
const IELTS_STORAGE_KEY = 'core-english-ielts-results'

export interface IELTSResult {
  date: string
  overall: number
  listening: number
  reading: number
  writing: number
  speaking: number
  feedback: string
}

export interface IELTSQuestion {
  question: string
  options: string[]
  correct: number
}

// New: a single speaker turn in the listening conversation
export interface IELTSConversationTurn {
  speaker: 'A' | 'B'
  text: string
}

// New: 4-criteria writing feedback
export interface IELTSWritingFeedback {
  taskAchievement: number
  coherenceCohesion: number
  lexicalResource: number
  grammaticalRange: number
  band: number
  feedbackMn: string
}

export interface IELTSContent {
  listening: {
    conversation: IELTSConversationTurn[]
    questions: IELTSQuestion[]
  }
  reading: {
    passage: string
    questions: IELTSQuestion[]
  }
  writing: {
    task1Prompt: string
    task2Prompt: string
  }
  speaking: {
    part1Questions: string[]
    part2Card: string
    part3Questions: string[]
  }
}

export interface IELTSAnswers {
  listeningAnswers: (number | null)[]
  readingAnswers: (number | null)[]
  writingTask1: string
  writingTask2: string
  speakingPart1: string[]
  speakingPart2: string
  speakingPart3: string[]
}

export function loadIELTSResults(): IELTSResult[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(IELTS_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as IELTSResult[]) : []
  } catch {
    return []
  }
}

export function saveIELTSResult(result: IELTSResult): void {
  if (typeof window === 'undefined') return
  const results = loadIELTSResults()
  results.unshift(result)
  localStorage.setItem(IELTS_STORAGE_KEY, JSON.stringify(results.slice(0, 10)))
}
```

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/ielts.ts
git commit -m "feat: extend IELTS types — IELTSConversationTurn, IELTSWritingFeedback"
```

---

## Task 2: Create `src/lib/tts.ts` — Web Speech API wrapper

**Files:**
- Create: `src/lib/tts.ts`

- [ ] **Step 1: Write the file**

```typescript
export interface TTSVoiceOptions {
  pitch?: number
  rate?: number
  preferUri?: string
}

function findVoice(preferUri: string, lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  // Try preferred URI first
  const preferred = voices.find(v => v.voiceURI.includes(preferUri))
  if (preferred) return preferred
  // Fall back to lang match
  return voices.find(v => v.lang.startsWith(lang)) ?? null
}

export function speakTurn(text: string, opts: TTSVoiceOptions = {}): Promise<void> {
  return new Promise(resolve => {
    if (typeof window === 'undefined' || !window.speechSynthesis) { resolve(); return }
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.pitch = opts.pitch ?? 1.0
    utt.rate = opts.rate ?? 0.9
    if (opts.preferUri) {
      const v = findVoice(opts.preferUri, 'en')
      if (v) utt.voice = v
    }
    utt.onend = () => resolve()
    utt.onerror = () => resolve()
    window.speechSynthesis.speak(utt)
  })
}

export function stopSpeech(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && (
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  )
}

export function getSpeechRecognition(): typeof SpeechRecognition | null {
  if (typeof window === 'undefined') return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null
}
```

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```

Expected: zero errors (SpeechSynthesisUtterance is a browser global, available in DOM types).

- [ ] **Step 3: Commit**

```bash
git add src/lib/tts.ts
git commit -m "feat: Web Speech API wrapper (TTS + STT detection)"
```

---

## Task 3: Rewrite IELTS generate API

**Files:**
- Modify: `src/app/api/ielts/generate/route.ts`

Complete rewrite. Accepts optional `seed` in body (uses `Date.now()` from client). Returns enhanced `IELTSContent` with `conversation` array instead of single `transcript`.

- [ ] **Step 1: Write the file**

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as { seed?: number }
    const seed = body.seed ?? Date.now()

    const systemPrompt = `You are an IELTS Academic test generator. Seed: ${seed}.
Use a fresh, unique topic every time.

Generate a complete IELTS-style mock test. Return ONLY valid JSON matching this exact structure:

{
  "listening": {
    "conversation": [
      {"speaker": "A", "text": "..."},
      {"speaker": "B", "text": "..."}
    ],
    "questions": [
      {"question": "...", "options": ["A","B","C","D"], "correct": 0}
    ]
  },
  "reading": {
    "passage": "...",
    "questions": [
      {"question": "...", "options": ["A","B","C","D"], "correct": 0}
    ]
  },
  "writing": {
    "task1Prompt": "...",
    "task2Prompt": "..."
  },
  "speaking": {
    "part1Questions": ["...", "...", "..."],
    "part2Card": "...",
    "part3Questions": ["...", "...", "..."]
  }
}

LISTENING section rules:
- 2 speakers: Speaker A and Speaker B
- Academic context: university enrollment office, library orientation, student services, accommodation office, or study group
- 14-18 exchanges total, each 1-3 sentences
- 6 multiple-choice questions testing key information from the conversation
- "correct" is 0-based index

READING section rules:
- Academic passage, 200-250 words, topic varies per seed (science, environment, history, technology, social sciences)
- 8 multiple-choice questions
- "correct" is 0-based index

WRITING section rules:
- task1Prompt: describe a chart/table/graph in text form. Include the actual data as a text table. Example: "The table below shows the number of visitors to three museums in London between 2018 and 2022.\\n\\nMuseum | 2018 | 2019 | 2020\\nNatural History | 4.2m | 4.5m | 1.1m\\nScience | 3.3m | 3.6m | 0.9m\\nV&A | 2.9m | 3.1m | 0.8m\\n\\nSummarise the information, selecting and reporting the main features. Write at least 150 words."
- task2Prompt: opinion/discussion essay question requiring at least 250 words. Vary the topic (education, environment, technology, society).

SPEAKING section rules:
- part1Questions: 3 personal questions (work, study, hobbies) — short, direct
- part2Card: topic cue card with main prompt + 3 bullet points, newline-separated
- part3Questions: 3 abstract discussion questions extending the Part 2 topic`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Generate the IELTS test now.' }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Invalid response format' }, { status: 500 })

    const parsed = JSON.parse(jsonMatch[0])
    if (!parsed.listening?.conversation || !Array.isArray(parsed.listening.conversation)) {
      return NextResponse.json({ error: 'Invalid listening structure' }, { status: 500 })
    }
    return NextResponse.json(parsed)
  } catch (e) {
    console.error('IELTS generate error:', e)
    return NextResponse.json({ error: 'Failed to generate test' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/ielts/generate/route.ts
git commit -m "feat: rewrite IELTS generate API — conversation format, timestamp seed, data tables"
```

---

## Task 4: Rewrite IELTS grade API

**Files:**
- Modify: `src/app/api/ielts/grade/route.ts`

Complete rewrite with 4-criteria writing + speaking grading. Returns `IELTSWritingFeedback` per section.

- [ ] **Step 1: Write the file**

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import type { IELTSContent, IELTSAnswers } from '@/lib/ielts'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function scoreObjective(answers: (number | null)[], questions: { correct: number }[]): number {
  const correct = answers.filter((a, i) => a === questions[i]?.correct).length
  const pct = correct / questions.length
  if (pct >= 0.9) return 9
  if (pct >= 0.8) return 8
  if (pct >= 0.7) return 7
  if (pct >= 0.6) return 6
  if (pct >= 0.5) return 5
  if (pct >= 0.4) return 4
  if (pct >= 0.3) return 3
  if (pct >= 0.2) return 2
  return 1
}

export async function POST(req: NextRequest) {
  try {
    const { content, answers } = await req.json() as { content: IELTSContent; answers: IELTSAnswers }

    const listeningBand = scoreObjective(answers.listeningAnswers, content.listening.questions)
    const readingBand = scoreObjective(answers.readingAnswers, content.reading.questions)

    const speakingText = [
      'PART 1 QUESTIONS AND ANSWERS:\n' + content.speaking.part1Questions.map((q, i) =>
        `Q: ${q}\nA: ${answers.speakingPart1[i] || '(no answer)'}`
      ).join('\n\n'),
      `PART 2 TOPIC CARD:\n${content.speaking.part2Card}\nSTUDENT ANSWER:\n${answers.speakingPart2 || '(no answer)'}`,
      'PART 3 QUESTIONS AND ANSWERS:\n' + content.speaking.part3Questions.map((q, i) =>
        `Q: ${q}\nA: ${answers.speakingPart3[i] || '(no answer)'}`
      ).join('\n\n'),
    ].join('\n\n---\n\n')

    const gradingPrompt = `You are a certified IELTS examiner. Grade the Writing and Speaking sections using official IELTS criteria. Return ONLY valid JSON.

=== WRITING TASK 1 ===
Prompt: ${content.writing.task1Prompt}
Answer: ${answers.writingTask1 || '(no answer provided)'}

=== WRITING TASK 2 ===
Prompt: ${content.writing.task2Prompt}
Answer: ${answers.writingTask2 || '(no answer provided)'}

=== SPEAKING ===
${speakingText}

Score each criterion 1-9. Return this JSON:
{
  "writing": {
    "taskAchievement": 6,
    "coherenceCohesion": 6,
    "lexicalResource": 6,
    "grammaticalRange": 6,
    "band": 6,
    "feedbackMn": "Монгол хэлээр 2-3 өгүүлбэр тайлбар."
  },
  "speaking": {
    "fluencyCohesion": 6,
    "lexicalResource": 6,
    "grammaticalRange": 6,
    "pronunciation": 6,
    "band": 6,
    "feedbackMn": "Монгол хэлээр 2-3 өгүүлбэр тайлбар."
  }
}`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: 'You are a certified IELTS examiner. Return only valid JSON.',
      messages: [{ role: 'user', content: gradingPrompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)

    let writingBand = 5
    let speakingBand = 5
    let writingFeedback = ''
    let speakingFeedback = ''
    let writingCriteria = { taskAchievement: 5, coherenceCohesion: 5, lexicalResource: 5, grammaticalRange: 5 }
    let speakingCriteria = { fluencyCohesion: 5, lexicalResource: 5, grammaticalRange: 5, pronunciation: 5 }

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        writing: { taskAchievement: number; coherenceCohesion: number; lexicalResource: number; grammaticalRange: number; band: number; feedbackMn: string }
        speaking: { fluencyCohesion: number; lexicalResource: number; grammaticalRange: number; pronunciation: number; band: number; feedbackMn: string }
      }
      writingBand = Math.min(9, Math.max(1, parsed.writing.band))
      speakingBand = Math.min(9, Math.max(1, parsed.speaking.band))
      writingFeedback = parsed.writing.feedbackMn
      speakingFeedback = parsed.speaking.feedbackMn
      writingCriteria = {
        taskAchievement: Math.min(9, Math.max(1, parsed.writing.taskAchievement)),
        coherenceCohesion: Math.min(9, Math.max(1, parsed.writing.coherenceCohesion)),
        lexicalResource: Math.min(9, Math.max(1, parsed.writing.lexicalResource)),
        grammaticalRange: Math.min(9, Math.max(1, parsed.writing.grammaticalRange)),
      }
      speakingCriteria = {
        fluencyCohesion: Math.min(9, Math.max(1, parsed.speaking.fluencyCohesion)),
        lexicalResource: Math.min(9, Math.max(1, parsed.speaking.lexicalResource)),
        grammaticalRange: Math.min(9, Math.max(1, parsed.speaking.grammaticalRange)),
        pronunciation: Math.min(9, Math.max(1, parsed.speaking.pronunciation)),
      }
    }

    const overall = Math.round((listeningBand + readingBand + writingBand + speakingBand) / 4 * 2) / 2

    return NextResponse.json({
      overall,
      listening: listeningBand,
      reading: readingBand,
      writing: writingBand,
      speaking: speakingBand,
      writingFeedback,
      speakingFeedback,
      writingCriteria,
      speakingCriteria,
    })
  } catch (e) {
    console.error('IELTS grade error:', e)
    return NextResponse.json({ error: 'Failed to grade test' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/ielts/grade/route.ts
git commit -m "feat: rewrite IELTS grade API — 4-criteria writing/speaking, detailed feedback"
```

---

## Task 5: Rewrite `IELTSTest.tsx` with TTS listening and STT speaking

**Files:**
- Modify: `src/components/IELTSTest.tsx`

Complete rewrite. This is the largest task. Phases: `intro → loading → listening → reading → writing → speaking → grading → results`.

Key behaviors:
- **Listening**: Play button reads the conversation aloud using Web Speech API. Speaker A: Google US English or first en-US voice, pitch 1.0, rate 0.9. Speaker B: Google UK English Female or second available voice, pitch 1.2, rate 0.85. If only one voice, B uses pitch 1.3. Visual indicator highlights current speaker while playing. Pause/resume. Speed control 0.75x/1x/1.25x. Student answers 6 MCQ.
- **Reading**: Passage + 8 MCQ questions.
- **Writing**: Task 1 + Task 2 with word count (tab switcher). Task 2 requires ≥10 words to submit.
- **Speaking**: TTS speaks examiner questions aloud (en-GB voice, rate 0.85). STT records student (webkitSpeechRecognition with en-US). Fallback to textarea if STT unavailable. 1 min prep timer for Part 2.
- **Results**: Band color coded, 4-criteria breakdown tables for writing + speaking, improvement advice in Mongolian.

- [ ] **Step 1: Write the complete file**

```typescript
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
} from '@/lib/tts'

type Phase = 'intro' | 'loading' | 'listening' | 'reading' | 'writing' | 'speaking' | 'grading' | 'results'

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
  const [speakPart1, setSpeakPart1] = useState<string[]>(['', '', ''])
  const [speakPart2, setSpeakPart2] = useState('')
  const [speakPart3, setSpeakPart3] = useState<string[]>(['', '', ''])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTarget, setRecordingTarget] = useState<{ part: number; idx?: number } | null>(null)
  const [prepCountdown, setPrepCountdown] = useState<number | null>(null)
  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null)

  const ttsSupported = isSpeechSupported()
  const sttSupported = isSpeechRecognitionSupported()

  // Play full conversation with alternating speakers
  const playConversation = useCallback(async () => {
    if (!content || isPlaying) return
    setIsPlaying(true)
    playingRef.current = true
    const voices = ttsSupported ? window.speechSynthesis.getVoices() : []
    const voiceA = voices.find(v => v.voiceURI.includes('Google US English')) ?? voices.find(v => v.lang.startsWith('en-US')) ?? voices[0] ?? null
    const voiceB = voices.find(v => v.voiceURI.includes('Google UK English Female')) ?? voices.find((v, i) => v.lang.startsWith('en') && i !== voices.indexOf(voiceA!)) ?? voiceA

    for (const turn of content.listening.conversation) {
      if (!playingRef.current) break
      setActiveSpeaker(turn.speaker)
      const pitchA = 1.0
      const pitchB = voiceA === voiceB ? 1.3 : 1.2
      await speakTurn(turn.text, {
        pitch: turn.speaker === 'A' ? pitchA : pitchB,
        rate: (turn.speaker === 'A' ? 0.9 : 0.85) * playSpeed,
        preferUri: turn.speaker === 'A' ? 'Google US English' : 'Google UK English Female',
      })
    }
    setActiveSpeaker(null)
    setIsPlaying(false)
    playingRef.current = false
  }, [content, isPlaying, ttsSupported, playSpeed])

  const pauseConversation = () => {
    playingRef.current = false
    stopSpeech()
    setIsPlaying(false)
    setActiveSpeaker(null)
  }

  // Speak examiner question aloud
  const speakQuestion = (text: string) => {
    speakTurn(text, { preferUri: 'Google UK English', pitch: 1.0, rate: 0.85 })
  }

  // Start STT recording
  const startRecording = (part: number, idx?: number) => {
    const SpeechRecognition = getSpeechRecognition()
    if (!SpeechRecognition) return
    if (recognitionRef.current) { recognitionRef.current.abort(); recognitionRef.current = null }
    const rec = new SpeechRecognition()
    rec.lang = 'en-US'
    rec.continuous = true
    rec.interimResults = false
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join(' ')
      if (part === 1 && idx !== undefined) {
        setSpeakPart1(prev => { const a = [...prev]; a[idx] = transcript; return a })
      } else if (part === 2) {
        setSpeakPart2(transcript)
      } else if (part === 3 && idx !== undefined) {
        setSpeakPart3(prev => { const a = [...prev]; a[idx] = transcript; return a })
      }
    }
    rec.onend = () => { setIsRecording(false); setRecordingTarget(null) }
    rec.start()
    recognitionRef.current = rec
    setIsRecording(true)
    setRecordingTarget({ part, idx })
  }

  const stopRecording = () => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setIsRecording(false)
    setRecordingTarget(null)
  }

  // Part 2 prep countdown
  const startPrepTimer = () => {
    setPrepCountdown(60)
  }
  useEffect(() => {
    if (prepCountdown === null || prepCountdown <= 0) return
    const t = setTimeout(() => setPrepCountdown(c => (c ?? 1) - 1), 1000)
    return () => clearTimeout(t)
  }, [prepCountdown])

  const startTest = async () => {
    setPhase('loading')
    setError(null)
    setListenIndex(0)
    setListenAnswers(Array(6).fill(null))
    setListenSelected(null)
    setListenAnswered(false)
    setReadIndex(0)
    setReadAnswers(Array(8).fill(null))
    setReadSelected(null)
    setReadAnswered(false)
    setWritingTask1('')
    setWritingTask2('')
    setWritingTaskView(1)
    setSpeakPart(1)
    setSpeakPart1(['', '', ''])
    setSpeakPart2('')
    setSpeakPart3(['', '', ''])
    setGradeResult(null)

    try {
      const res = await fetch('/api/ielts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed: Date.now() }),
      })
      if (!res.ok) throw new Error('Failed to generate test')
      const data = await res.json() as IELTSContent
      if (!data.listening?.conversation || !data.reading || !data.writing || !data.speaking) {
        throw new Error('Invalid test data')
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
    const answers: IELTSAnswers = {
      listeningAnswers: listenAnswers,
      readingAnswers: readAnswers,
      writingTask1,
      writingTask2,
      speakingPart1: speakPart1,
      speakingPart2,
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
      saveTestResult({ type: 'ielts', ieltsBand: result.overall })
    } catch {
      setError('Үнэлгээ хийхэд алдаа гарлаа.')
    }
    setPhase('results')
  }

  // ─── Shared loading spinner ───
  const Spinner = ({ label }: { label: string }) => (
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

  // ─── Progress bar across sections ───
  const sectionOrder: Phase[] = ['listening', 'reading', 'writing', 'speaking']
  const sectionIdx = sectionOrder.indexOf(phase)

  const SectionProgress = () => (
    <div className="flex gap-1 mb-4">
      {sectionOrder.map((s, i) => (
        <div key={s} className="flex-1 h-1.5 rounded-full" style={{
          background: i < sectionIdx ? '#F59E0B' : i === sectionIdx ? '#F59E0B88' : '#334155'
        }} />
      ))}
    </div>
  )

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

  // ─── Listening ───
  if (phase === 'listening' && content) {
    const q = content.listening.questions[listenIndex]
    const conv = content.listening.conversation
    return (
      <div className="min-h-screen bg-navy flex flex-col">
        <NavBar lessonTitle={`Listening — ${listenIndex + 1}/${content.listening.questions.length}`} />
        <div className="flex-1 overflow-y-auto p-4 max-w-xl mx-auto w-full">
          <SectionProgress />

          {/* Conversation player */}
          <div className="bg-navy-surface border border-navy-surface-2 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-gold uppercase tracking-wide">🎧 Яриа сонсох</div>
              {/* Speed control */}
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

            {/* Conversation lines */}
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
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

            {/* Play controls */}
            {ttsSupported ? (
              <div className="flex gap-2">
                <button
                  onClick={isPlaying ? pauseConversation : playConversation}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: isPlaying ? '#334155' : 'linear-gradient(135deg, #F59E0B, #D97706)', color: isPlaying ? '#F8FAFC' : '#0F172A' }}
                >
                  {isPlaying ? '⏸ Зогсоох' : '▶ Тоглуулах'}
                </button>
              </div>
            ) : (
              <p className="text-xs text-center" style={{ color: '#64748B' }}>Та дээрх текстийг уншаад асуултуудад хариулна уу.</p>
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
          <SectionProgress />

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

  // ─── Writing ───
  if (phase === 'writing' && content) {
    return (
      <div className="min-h-screen bg-navy flex flex-col">
        <NavBar lessonTitle={`Writing — Task ${writingTaskView}/2`} />
        <div className="flex-1 overflow-y-auto p-4 max-w-xl mx-auto w-full">
          <SectionProgress />

          {/* Tabs */}
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
                <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">{content.writing.task1Prompt}</p>
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

  // ─── Speaking ───
  if (phase === 'speaking' && content) {
    const isRec = (part: number, idx?: number) =>
      isRecording && recordingTarget?.part === part && recordingTarget?.idx === idx

    const RecordButton = ({ part, idx }: { part: number; idx?: number }) => (
      sttSupported ? (
        <button
          onClick={() => isRec(part, idx) ? stopRecording() : startRecording(part, idx)}
          className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5"
          style={isRec(part, idx)
            ? { background: '#F87171', color: '#fff' }
            : { background: '#1E293B', border: '1px solid #334155', color: '#94A3B8' }}
        >
          {isRec(part, idx) ? (
            <><span className="w-2 h-2 rounded-full bg-white animate-pulse inline-block" />⏹ Зогсоох</>
          ) : '🎤 Хариулах'}
        </button>
      ) : null
    )

    return (
      <div className="min-h-screen bg-navy flex flex-col">
        <NavBar lessonTitle={`Speaking — Part ${speakPart}/3`} />
        <div className="flex-1 overflow-y-auto p-4 max-w-xl mx-auto w-full">
          <SectionProgress />

          {/* STT notice */}
          {!sttSupported && (
            <div className="bg-navy-surface border border-gold/20 rounded-xl p-3 mb-4 text-xs" style={{ color: '#94A3B8' }}>
              ⚠️ Таны браузер дуу таних боломжгүй тул бичгээр хариулна уу
            </div>
          )}

          {/* Part tabs */}
          <div className="flex gap-2 mb-5">
            {([1, 2, 3] as const).map(part => (
              <button
                key={part}
                onClick={() => setSpeakPart(part)}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-colors border"
                style={speakPart === part
                  ? { background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A', borderColor: 'transparent' }
                  : { background: '#1E293B', color: '#94A3B8', borderColor: '#334155' }}
              >
                Part {part}
              </button>
            ))}
          </div>

          {speakPart === 1 && (
            <>
              <div className="text-xs font-semibold text-gold uppercase tracking-wide mb-3">🗣️ Part 1 — Хувийн асуулт</div>
              <div className="space-y-5 mb-6">
                {content.speaking.part1Questions.map((q, i) => (
                  <div key={i}>
                    <div className="flex items-start gap-2 mb-2">
                      <p className="text-sm text-text-primary flex-1">{q}</p>
                      <div className="flex gap-1.5 flex-shrink-0">
                        {ttsSupported && (
                          <button onClick={() => speakQuestion(q)} className="text-xs px-2 py-1.5 rounded-lg bg-navy-surface-2 text-gold">🔊</button>
                        )}
                        <RecordButton part={1} idx={i} />
                      </div>
                    </div>
                    <textarea
                      value={speakPart1[i] || ''}
                      onChange={e => { const a = [...speakPart1]; a[i] = e.target.value; setSpeakPart1(a) }}
                      placeholder="Хариулт бичнэ үү..."
                      rows={2}
                      className="w-full rounded-xl p-3 text-sm resize-none outline-none"
                      style={{ background: '#1E293B', border: '1px solid #334155', color: '#F8FAFC' }}
                    />
                  </div>
                ))}
              </div>
              <button onClick={() => setSpeakPart(2)} className="w-full font-bold py-3 min-h-[48px] rounded-xl transition-all hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}>
                Part 2 →
              </button>
            </>
          )}

          {speakPart === 2 && (
            <>
              <div className="bg-navy-surface rounded-2xl p-4 mb-4" style={{ border: '1px solid rgba(245,158,11,0.3)' }}>
                <div className="text-xs font-semibold text-gold uppercase tracking-wide mb-2">🗣️ Part 2 — Сэдвийн карт</div>
                <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">{content.speaking.part2Card}</p>
                {ttsSupported && (
                  <button onClick={() => speakQuestion(content.speaking.part2Card)} className="mt-3 text-xs px-3 py-1.5 rounded-lg bg-navy-surface-2 text-gold">🔊 Уншуулах</button>
                )}
              </div>

              {/* Prep timer */}
              {prepCountdown === null ? (
                <button onClick={startPrepTimer} className="w-full mb-4 py-2 rounded-xl text-sm font-semibold bg-navy-surface border border-navy-surface-2 text-text-secondary hover:border-gold/30 transition-colors">
                  ⏱ 1 минут бэлтгэх
                </button>
              ) : (
                <div className="w-full mb-4 py-2 rounded-xl text-center text-sm font-bold bg-navy-surface border border-gold/20" style={{ color: prepCountdown > 0 ? '#F59E0B' : '#34D399' }}>
                  {prepCountdown > 0 ? `Бэлтгэх: ${prepCountdown}с` : '✓ Бэлтгэл дууслаа'}
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs flex-1" style={{ color: '#64748B' }}>1-2 минут ярьсан бичнэ үү</p>
                <RecordButton part={2} />
              </div>
              <textarea
                value={speakPart2}
                onChange={e => setSpeakPart2(e.target.value)}
                placeholder="Монолог бичнэ үү..."
                rows={6}
                className="w-full rounded-xl p-3 text-sm resize-none outline-none mb-4"
                style={{ background: '#1E293B', border: '1px solid #334155', color: '#F8FAFC' }}
              />
              <button onClick={() => setSpeakPart(3)} className="w-full font-bold py-3 min-h-[48px] rounded-xl transition-all hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}>
                Part 3 →
              </button>
            </>
          )}

          {speakPart === 3 && (
            <>
              <div className="text-xs font-semibold text-gold uppercase tracking-wide mb-3">🗣️ Part 3 — Хэлэлцүүлэг</div>
              <div className="space-y-5 mb-6">
                {content.speaking.part3Questions.map((q, i) => (
                  <div key={i}>
                    <div className="flex items-start gap-2 mb-2">
                      <p className="text-sm text-text-primary flex-1">{q}</p>
                      <div className="flex gap-1.5 flex-shrink-0">
                        {ttsSupported && (
                          <button onClick={() => speakQuestion(q)} className="text-xs px-2 py-1.5 rounded-lg bg-navy-surface-2 text-gold">🔊</button>
                        )}
                        <RecordButton part={3} idx={i} />
                      </div>
                    </div>
                    <textarea
                      value={speakPart3[i] || ''}
                      onChange={e => { const a = [...speakPart3]; a[i] = e.target.value; setSpeakPart3(a) }}
                      placeholder="Хариулт бичнэ үү..."
                      rows={3}
                      className="w-full rounded-xl p-3 text-sm resize-none outline-none"
                      style={{ background: '#1E293B', border: '1px solid #334155', color: '#F8FAFC' }}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={submitTest}
                className="w-full font-bold py-3 min-h-[48px] rounded-xl transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0F172A' }}
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

          {/* Overall band */}
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

          {/* Section scores grid */}
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

          {/* Writing criteria */}
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

          {/* Speaking criteria */}
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
```

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```

If you get errors about `SpeechRecognitionEvent` not found, add to `tsconfig.json`'s `lib`:
```json
"lib": ["dom", "dom.iterable", "esnext"]
```
This is usually already present in Next.js projects.

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/IELTSTest.tsx
git commit -m "feat: rewrite IELTSTest — TTS listening, STT speaking, 4-criteria results"
```

---

## Task 6: Update IELTS landing page with history

**Files:**
- Modify: `src/app/ielts/page.tsx`

The current page is just `<IELTSTest />`. Replace with a real landing that shows IELTS history before starting, with a "Шинэ шалгалт эхлэх" button that passes a seed to start fresh.

- [ ] **Step 1: Replace src/app/ielts/page.tsx**

Since IELTSTest manages its own intro/history state, the minimal page wrapper is fine. But we want the `/ielts` URL to show `IELTSTest` which already has an intro screen. The intro screen in the new IELTSTest handles everything. No change needed unless we want a separate server page.

To add a static metadata title:

```typescript
import { IELTSTest } from '@/components/IELTSTest'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'IELTS Mock Test — Core English',
}

export default function IELTSPage() {
  return <IELTSTest />
}
```

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Run full build**

```bash
npm run build
```

Expected: `✓ Compiled successfully`, zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/ielts/page.tsx src/lib/tts.ts
git commit -m "feat: IELTS page metadata + tts.ts committed"
```

---

## Task 7: Final build verification

- [ ] **Step 1: Run full build**

```bash
npm run build
```

Expected: `✓ Compiled successfully` with zero TypeScript and lint errors.

- [ ] **Step 2: Verify all routes render**

Expected routes in build output:
- `/ielts` ○ or ƒ
- `/api/ielts/generate` ƒ
- `/api/ielts/grade` ƒ

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: build verification after IELTS redesign"
```
