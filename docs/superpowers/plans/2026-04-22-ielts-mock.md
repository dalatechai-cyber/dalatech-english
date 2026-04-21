# IELTS Mock Test — Band Score 1–9, 4 Sections, Claude Grading

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full IELTS mock test at `/ielts` with 4 text-based sections — Listening (transcript + MCQs), Reading (passage + MCQs), Writing (Task 1 + Task 2), and Speaking (typed responses to 3-part prompts) — graded by Claude, returning an overall band score (1–9), section band scores, Mongolian feedback, and localStorage history.

**Architecture:** One generate API call produces all 4 sections' content. One grade API call accepts all student answers and returns band scores. `IELTSTest.tsx` is a multi-phase component: `intro → listening → reading → writing → speaking → grading → results`. Results and band history are saved to localStorage. NavBar gains an IELTS link.

**Tech Stack:** Next.js 14 App Router, TypeScript, React 18, Anthropic SDK (claude-sonnet-4-6), Tailwind CSS, localStorage

---

## File Map

| File | Change |
|---|---|
| `src/lib/ielts.ts` | NEW — types, localStorage save/load |
| `src/app/api/ielts/generate/route.ts` | NEW — Claude generates all 4 section contents |
| `src/app/api/ielts/grade/route.ts` | NEW — Claude grades all answers, returns band scores |
| `src/components/IELTSTest.tsx` | NEW — multi-phase test UI |
| `src/app/ielts/page.tsx` | NEW — IELTS landing page with start button + history |
| `src/components/NavBar.tsx` | Add IELTS link to desktop + mobile menu |
| `src/lib/i18n.ts` | Add IELTS-related strings |

---

## Task 1: Create `src/lib/ielts.ts` — types and storage

**Files:**
- Create: `src/lib/ielts.ts`

- [ ] **Step 1: Write the file**

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

export interface IELTSContent {
  listening: {
    transcript: string
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
git commit -m "feat: IELTS types and localStorage helpers"
```

---

## Task 2: Create IELTS content generation API

**Files:**
- Create: `src/app/api/ielts/generate/route.ts`

- [ ] **Step 1: Create the directory and file**

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are an IELTS test generator for Mongolian English learners (B1-C1 level).

Generate a complete IELTS-style mock test with these exact sections:

LISTENING: A short monologue or dialogue transcript (8-10 sentences). Then 6 multiple-choice questions about it. Each question has 4 options; "correct" is 0-based index.

READING: An academic-style passage (150-200 words) on a general interest topic. Then 8 multiple-choice questions. Same format as listening.

WRITING:
- Task 1: Ask the student to write at least 150 words describing a chart, graph, or process. Describe it in text (e.g. "The bar chart below shows...")
- Task 2: An essay question asking for opinion or discussion (e.g. "Some people believe... To what extent do you agree?"), write at least 250 words.

SPEAKING:
- Part 1: 3 personal questions (work, study, hobbies)
- Part 2: A topic card with a main prompt and 3 bullet points to cover in 1-2 minutes
- Part 3: 3 abstract discussion questions related to Part 2 topic

Return ONLY valid JSON, no extra text:
{
  "listening": {
    "transcript": "...",
    "questions": [{"question":"...","options":["A","B","C","D"],"correct":0}]
  },
  "reading": {
    "passage": "...",
    "questions": [{"question":"...","options":["A","B","C","D"],"correct":0}]
  },
  "writing": {
    "task1Prompt": "The bar chart below shows...",
    "task2Prompt": "Some people believe that..."
  },
  "speaking": {
    "part1Questions": ["Do you work or study?","What do you enjoy doing in your free time?","Do you prefer the city or the countryside?"],
    "part2Card": "Describe a memorable journey you have taken.\\nYou should say:\\n- where you went\\n- who you went with\\n- what you did there\\nand explain why it was memorable.",
    "part3Questions": ["Why do people travel?","How has tourism changed in recent years?","What are the negative effects of mass tourism?"]
  }
}`

export async function POST() {
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: 'Generate the IELTS mock test now.' }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Invalid response format' }, { status: 500 })

    const parsed = JSON.parse(jsonMatch[0])
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
git commit -m "feat: IELTS generate API — 4-section test content from Claude"
```

---

## Task 3: Create IELTS grading API

**Files:**
- Create: `src/app/api/ielts/grade/route.ts`

- [ ] **Step 1: Write the file**

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import type { IELTSContent, IELTSAnswers } from '@/lib/ielts'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function scoreListeningReading(answers: (number | null)[], questions: { correct: number }[]): number {
  const correct = answers.filter((a, i) => a === questions[i]?.correct).length
  const total = questions.length
  const pct = correct / total
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
  const { content, answers } = await req.json() as { content: IELTSContent; answers: IELTSAnswers }

  const listeningBand = scoreListeningReading(answers.listeningAnswers, content.listening.questions)
  const readingBand = scoreListeningReading(answers.readingAnswers, content.reading.questions)

  const speakingText = [
    'PART 1:\n' + answers.speakingPart1.filter(Boolean).join('\n'),
    'PART 2:\n' + (answers.speakingPart2 || '(no answer)'),
    'PART 3:\n' + answers.speakingPart3.filter(Boolean).join('\n'),
  ].join('\n\n')

  const gradingPrompt = `You are an IELTS examiner. Grade the following writing and speaking responses.

WRITING TASK 1 PROMPT: ${content.writing.task1Prompt}
WRITING TASK 1 ANSWER: ${answers.writingTask1 || '(no answer)'}

WRITING TASK 2 PROMPT: ${content.writing.task2Prompt}
WRITING TASK 2 ANSWER: ${answers.writingTask2 || '(no answer)'}

SPEAKING PROMPTS AND ANSWERS:
${speakingText}

Give a band score (1-9) for Writing and Speaking separately based on IELTS criteria.
Then write 2-3 sentences of feedback in Mongolian (Cyrillic) for each.

Return ONLY valid JSON:
{
  "writingBand": 6,
  "speakingBand": 6,
  "writingFeedback": "Монгол хэлээр тайлбар.",
  "speakingFeedback": "Монгол хэлээр тайлбар."
}`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: 'You are an IELTS examiner. Return only valid JSON.',
      messages: [{ role: 'user', content: gradingPrompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    let writingBand = 5
    let speakingBand = 5
    let writingFeedback = ''
    let speakingFeedback = ''

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        writingBand: number
        speakingBand: number
        writingFeedback: string
        speakingFeedback: string
      }
      writingBand = Math.min(9, Math.max(1, parsed.writingBand))
      speakingBand = Math.min(9, Math.max(1, parsed.speakingBand))
      writingFeedback = parsed.writingFeedback
      speakingFeedback = parsed.speakingFeedback
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
git commit -m "feat: IELTS grading API — band scores 1-9 for all 4 sections"
```

---

## Task 4: Create `IELTSTest` component

**Files:**
- Create: `src/components/IELTSTest.tsx`

Phases: `intro → listening → reading → writing → speaking → grading → results`

- [ ] **Step 1: Write the file**

```typescript
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
```

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/IELTSTest.tsx
git commit -m "feat: IELTSTest component — 4-section test UI, band score results"
```

---

## Task 5: Create IELTS page

**Files:**
- Create: `src/app/ielts/page.tsx`

- [ ] **Step 1: Write the file**

```typescript
import { IELTSTest } from '@/components/IELTSTest'

export default function IELTSPage() {
  return <IELTSTest />
}
```

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/ielts/page.tsx
git commit -m "feat: /ielts page"
```

---

## Task 6: Add IELTS link to NavBar

**Files:**
- Modify: `src/components/NavBar.tsx`

- [ ] **Step 1: Add desktop IELTS link**

Find the desktop nav links block:
```tsx
          {/* Desktop nav links */}
          <Link href="/mistakes" className="text-text-secondary hover:text-text-primary text-xs transition-colors hidden sm:block">
            {t('mistakes')}
          </Link>
          <Link href="/profile" className="text-text-secondary hover:text-text-primary text-xs transition-colors hidden sm:block">
            {t('profile')}
          </Link>
```

Replace with:
```tsx
          {/* Desktop nav links */}
          <Link href="/ielts" className="text-text-secondary hover:text-text-primary text-xs transition-colors hidden sm:block">
            IELTS
          </Link>
          <Link href="/mistakes" className="text-text-secondary hover:text-text-primary text-xs transition-colors hidden sm:block">
            {t('mistakes')}
          </Link>
          <Link href="/profile" className="text-text-secondary hover:text-text-primary text-xs transition-colors hidden sm:block">
            {t('profile')}
          </Link>
```

- [ ] **Step 2: Add mobile menu IELTS link**

Find the mobile dropdown, before the mistakes link:
```tsx
          <Link
            href="/mistakes"
            className="flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-text-primary hover:bg-navy-surface-2/30 transition-colors text-sm"
            onClick={() => setMenuOpen(false)}
          >
            📓 {t('mistakes')}
          </Link>
```

Replace with:
```tsx
          <Link
            href="/ielts"
            className="flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-text-primary hover:bg-navy-surface-2/30 transition-colors text-sm"
            onClick={() => setMenuOpen(false)}
          >
            📝 IELTS
          </Link>
          <Link
            href="/mistakes"
            className="flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-text-primary hover:bg-navy-surface-2/30 transition-colors text-sm"
            onClick={() => setMenuOpen(false)}
          >
            📓 {t('mistakes')}
          </Link>
```

- [ ] **Step 3: Run type check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/NavBar.tsx
git commit -m "feat: add IELTS nav link to desktop and mobile menu"
```

---

## Task 7: Build verification

- [ ] **Step 1: Run build**

```bash
npm run build
```

Expected: `✓ Compiled successfully` with no errors.

- [ ] **Step 2: Commit if any fixes needed, else done**
