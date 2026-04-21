# Extended Quiz Mode — 18 Questions, 25 Points, Writing Grader

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing 10-question MC quiz with an 18-question mixed format: 15 multiple-choice + 2 reading comprehension + 1 Claude-graded writing task, scored out of 25 points with pass threshold of 18.

**Architecture:** The quiz API returns all content in one JSON payload (15 MC questions + reading passage with 2 questions + 1 writing prompt). The client shuffles MC answer options using Fisher-Yates (so the correct answer isn't always at position 0). A new `/api/quiz/grade-writing` endpoint sends the student's writing to Claude and returns a 0–6 integer score plus Mongolian feedback. `QuizMode` is rewritten as a multi-phase state machine: `loading → mc → reading → writing → grading → results`.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Anthropic SDK (claude-sonnet-4-6), Tailwind CSS

---

## File Map

| File | Change |
|---|---|
| `src/lib/prompts.ts` | Replace `getQuizSystemPrompt` with new 18-question format |
| `src/app/api/quiz/route.ts` | Update request message; parse new JSON shape |
| `src/app/api/quiz/grade-writing/route.ts` | NEW — Claude writing grader, returns 0-6 score |
| `src/components/QuizMode.tsx` | Full rewrite — phases, Fisher-Yates shuffle, writing submission |
| `src/lib/i18n.ts` | Add new quiz result strings |

---

## Task 1: Update `getQuizSystemPrompt` in prompts.ts

**Files:**
- Modify: `src/lib/prompts.ts`

- [ ] **Step 1: Replace `getQuizSystemPrompt`**

Find and replace the entire `getQuizSystemPrompt` function (lines 263–297) with:

```typescript
export function getQuizSystemPrompt(level: LevelCode): string {
  const GRAMMAR_TOPICS: Record<LevelCode, string> = {
    A1: 'To Be (am/is/are), articles (a/an/the), possessives, plurals, Present Simple, prepositions of time (at/on/in), Wh-questions, countable nouns, Can/Cannot',
    A2: 'Present Continuous, Was/Were, Past Simple, Future (will/going to), Comparatives/Superlatives, adverbs of frequency, prepositions of place, modal verbs (should/must), object pronouns',
    B1: 'Present Perfect vs Past Simple, Past Continuous, First Conditional, Second Conditional, Passive Voice, Used To, Relative Clauses (who/which/where), Modals of Deduction (must/might/can\'t), Gerunds & Infinitives',
    B2: 'Present Perfect Continuous, Past Perfect, Third Conditional, Causative Have/Get, Reported Speech, Past Modals (must have/should have/can\'t have), Linking words (despite/although/in spite of), Wishes & Regrets, Phrasal Verbs',
    C1: 'Inversion (negative adverbs), Mixed Conditionals, Cleft Sentences, Participle Clauses, Advanced Passive (said/believed/thought + to-inf), Subjunctive Mood, Nuanced Modals, Academic Linking (albeit/notwithstanding), C1 Collocations',
  }

  return `You are an English grammar quiz generator for Mongolian learners at ${level} level.

Generate a quiz with EXACTLY this structure:
- 15 multiple-choice questions (each tests ONE grammar point from: ${GRAMMAR_TOPICS[level]})
- 1 reading comprehension passage (3-4 sentences, ${level}-appropriate vocabulary) with 2 questions
- 1 writing task prompt

Rules for MC questions:
- 4 options per question (strings only, not labelled A/B/C/D)
- Only one correct answer; "correct" is the 0-based index in the options array
- All explanations MUST be in Mongolian (Cyrillic script)
- Cover different grammar topics; difficulty matches ${level} exactly

Rules for reading section:
- Passage: 3-4 sentences, natural English, ${level} vocabulary
- 2 comprehension questions with 4 options each; same "correct" index convention
- Explanations in Mongolian

Rules for writing task:
- One clear prompt in Mongolian asking the student to write 2-3 sentences (${level === 'A1' || level === 'A2' ? '2-3' : '3-5'} sentences) using specific grammar from this level
- Field "grammar_focus": one short English phrase naming the key grammar point (e.g. "Past Simple", "Third Conditional")

Return ONLY valid JSON, no extra text:
{
  "mc_questions": [
    {
      "question": "I ___ a student.",
      "options": ["am", "is", "are", "be"],
      "correct": 0,
      "explanation": "'I'-тай хамт 'am' хэрэглэнэ."
    }
  ],
  "reading": {
    "passage": "Sarah works at a hospital. She starts at 7 am every day.",
    "questions": [
      {
        "question": "Where does Sarah work?",
        "options": ["A hospital", "A school", "A bank", "A restaurant"],
        "correct": 0,
        "explanation": "Уншлагаас 'works at a hospital' гэж байна."
      }
    ]
  },
  "writing": {
    "prompt": "Өнгөрсөн амралтынхаа талаар 3 өгүүлбэр бич. Past Simple цаг ашигла.",
    "grammar_focus": "Past Simple"
  }
}`
}
```

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/prompts.ts
git commit -m "feat: update quiz prompt — 15 MC + reading passage + writing task format"
```

---

## Task 2: Update quiz API route

**Files:**
- Modify: `src/app/api/quiz/route.ts`

- [ ] **Step 1: Read the file to confirm current state**

Read `src/app/api/quiz/route.ts`.

- [ ] **Step 2: Rewrite the route**

Replace the entire file with:

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import type { LevelCode } from '@/lib/types'
import { getQuizSystemPrompt } from '@/lib/prompts'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { level } = await req.json() as { level: LevelCode }
  const systemPrompt = getQuizSystemPrompt(level)

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Generate the full quiz for ${level} level.` }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Invalid response format' }, { status: 500 })

    const parsed = JSON.parse(jsonMatch[0]) as {
      mc_questions: unknown[]
      reading: { passage: string; questions: unknown[] }
      writing: { prompt: string; grammar_focus: string }
    }

    if (!parsed.mc_questions || !Array.isArray(parsed.mc_questions) || parsed.mc_questions.length < 10) {
      return NextResponse.json({ error: 'Invalid quiz structure' }, { status: 500 })
    }

    return NextResponse.json(parsed)
  } catch (e) {
    console.error('Quiz generation error:', e)
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Run type check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/quiz/route.ts
git commit -m "feat: quiz API returns 15 MC + reading + writing payload"
```

---

## Task 3: Create writing grader API

**Files:**
- Create: `src/app/api/quiz/grade-writing/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import type { LevelCode } from '@/lib/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { level, prompt, answer, grammarFocus } = await req.json() as {
    level: LevelCode
    prompt: string
    answer: string
    grammarFocus: string
  }

  const systemPrompt = `You are an English writing evaluator for Mongolian learners at ${level} level.

The student was asked: "${prompt}"
The target grammar: ${grammarFocus}

Score the student's response from 0 to 6:
- 6: Perfect use of target grammar, no errors, natural sentences
- 5: Correct target grammar, 1 minor error
- 4: Mostly correct, 1-2 small grammar errors not involving the target
- 3: Target grammar attempted but with errors
- 2: Major errors, target grammar mostly wrong
- 1: Very poor, barely comprehensible
- 0: Off-topic, blank, or not in English

Return ONLY valid JSON, no extra text:
{
  "score": 4,
  "feedback": "Монгол хэлээр 1-2 өгүүлбэрт хариу үнэлгээ."
}`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      system: systemPrompt,
      messages: [{ role: 'user', content: answer || '(no answer provided)' }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ score: 0, feedback: 'Үнэлгээ хийхэд алдаа гарлаа.' })

    const parsed = JSON.parse(jsonMatch[0]) as { score: number; feedback: string }
    return NextResponse.json({ score: Math.min(6, Math.max(0, parsed.score)), feedback: parsed.feedback })
  } catch (e) {
    console.error('Writing grader error:', e)
    return NextResponse.json({ score: 0, feedback: 'Үнэлгээ хийхэд алдаа гарлаа.' })
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
git add src/app/api/quiz/grade-writing/route.ts
git commit -m "feat: writing grader API — 0-6 score, Mongolian feedback from Claude"
```

---

## Task 4: Add new i18n strings

**Files:**
- Modify: `src/lib/i18n.ts`

- [ ] **Step 1: Read `src/lib/i18n.ts`**

Read the file to see current keys.

- [ ] **Step 2: Add new keys to the `UI` object**

Find the closing `}` of the `UI` object and insert before it (after the last entry):

```typescript
  quizReading: 'Уншлага',
  quizWriting: 'Бичих',
  quizGrading: 'Үнэлж байна...',
  quizMC: 'Тест',
  quizWritingPlaceholder: 'Энд бичнэ үү...',
  quizSubmitWriting: 'Хариулт илгээх',
  quizScoreMC: 'Тест',
  quizScoreReading: 'Уншлага',
  quizScoreWriting: 'Бичих',
  quizScoreTotal: 'Нийт',
  quizWritingFeedback: 'Бичлэгийн үнэлгээ',
```

- [ ] **Step 3: Run type check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/i18n.ts
git commit -m "feat: add extended quiz i18n strings"
```

---

## Task 5: Rewrite QuizMode component

**Files:**
- Modify: `src/components/QuizMode.tsx`

This is a full rewrite. The component has 5 phases: `loading → mc → reading → writing → grading → results`.

Scoring:
- MC: 1 point each, max 15
- Reading: 2 points each (2 questions), max 4
- Writing: 0-6 points from grader API
- Total: max 25, pass = 18

Fisher-Yates shuffle: for each question, shuffle its `options` array and track where the originally-correct option ends up.

- [ ] **Step 1: Write the new `src/components/QuizMode.tsx`**

```typescript
'use client'
import { useState, useEffect } from 'react'
import type { LevelCode } from '@/lib/types'
import { NavBar } from './NavBar'
import { CertificateModal } from './CertificateModal'
import { StreakPopup } from './StreakPopup'
import { recordStudySession } from '@/lib/streak'
import { hasEverPassedLevel } from '@/lib/certificates'
import { t } from '@/lib/i18n'

interface MCQuestion {
  question: string
  options: string[]
  correct: number
  explanation: string
}

interface ReadingSection {
  passage: string
  questions: MCQuestion[]
}

interface WritingSection {
  prompt: string
  grammar_focus: string
}

interface QuizData {
  mc_questions: MCQuestion[]
  reading: ReadingSection
  writing: WritingSection
}

// Shuffled question: options reordered, correctIndex updated
interface ShuffledQuestion extends Omit<MCQuestion, 'correct'> {
  correctIndex: number
}

type QuizPhase = 'loading' | 'mc' | 'reading' | 'writing' | 'grading' | 'results'

interface QuizModeProps {
  level: LevelCode
}

function shuffleQuestion(q: MCQuestion): ShuffledQuestion {
  const indices = q.options.map((_, i) => i)
  // Fisher-Yates
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  const shuffledOptions = indices.map(i => q.options[i])
  const newCorrect = indices.indexOf(q.correct)
  return { question: q.question, options: shuffledOptions, correctIndex: newCorrect, explanation: q.explanation }
}

export function QuizMode({ level }: QuizModeProps) {
  const [phase, setPhase] = useState<QuizPhase>('loading')
  const [error, setError] = useState<string | null>(null)
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [mcQuestions, setMcQuestions] = useState<ShuffledQuestion[]>([])
  const [readingQuestions, setReadingQuestions] = useState<ShuffledQuestion[]>([])

  // MC phase state
  const [mcIndex, setMcIndex] = useState(0)
  const [mcAnswers, setMcAnswers] = useState<(number | null)[]>(Array(15).fill(null))
  const [mcSelected, setMcSelected] = useState<number | null>(null)
  const [mcAnswered, setMcAnswered] = useState(false)

  // Reading phase state
  const [readingIndex, setReadingIndex] = useState(0)
  const [readingAnswers, setReadingAnswers] = useState<(number | null)[]>([null, null])
  const [readingSelected, setReadingSelected] = useState<number | null>(null)
  const [readingAnswered, setReadingAnswered] = useState(false)

  // Writing phase state
  const [writingAnswer, setWritingAnswer] = useState('')

  // Results state
  const [writingScore, setWritingScore] = useState(0)
  const [writingFeedback, setWritingFeedback] = useState('')
  const [showCertificate, setShowCertificate] = useState(false)
  const [alreadyHasCert, setAlreadyHasCert] = useState(false)
  const [streakData, setStreakData] = useState<{ current: number; isNewDay: boolean } | null>(null)

  const loadQuiz = async () => {
    setPhase('loading')
    setError(null)
    setMcIndex(0)
    setMcAnswers(Array(15).fill(null))
    setMcSelected(null)
    setMcAnswered(false)
    setReadingIndex(0)
    setReadingAnswers([null, null])
    setReadingSelected(null)
    setReadingAnswered(false)
    setWritingAnswer('')
    setWritingScore(0)
    setWritingFeedback('')
    setShowCertificate(false)

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level }),
      })
      if (!res.ok) throw new Error('Failed to generate quiz')
      const data = await res.json() as QuizData
      if (!data.mc_questions || data.mc_questions.length < 10) throw new Error('Invalid quiz data')

      setQuizData(data)
      setMcQuestions(data.mc_questions.map(shuffleQuestion))
      setReadingQuestions(data.reading.questions.map(shuffleQuestion))
      setPhase('mc')
    } catch {
      setError('Тест ачаалахад алдаа гарлаа. Дахин оролдоно уу.')
      setPhase('loading')
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadQuiz() }, [level])

  const handleMCSelect = (idx: number) => {
    if (mcAnswered) return
    setMcSelected(idx)
    const newAnswers = [...mcAnswers]
    newAnswers[mcIndex] = idx
    setMcAnswers(newAnswers)
    setMcAnswered(true)
  }

  const handleMCNext = () => {
    if (mcIndex < mcQuestions.length - 1) {
      setMcIndex(prev => prev + 1)
      setMcSelected(null)
      setMcAnswered(false)
    } else {
      setPhase('reading')
      setReadingIndex(0)
      setReadingSelected(null)
      setReadingAnswered(false)
    }
  }

  const handleReadingSelect = (idx: number) => {
    if (readingAnswered) return
    setReadingSelected(idx)
    const newAnswers = [...readingAnswers]
    newAnswers[readingIndex] = idx
    setReadingAnswers(newAnswers)
    setReadingAnswered(true)
  }

  const handleReadingNext = () => {
    if (readingIndex < readingQuestions.length - 1) {
      setReadingIndex(prev => prev + 1)
      setReadingSelected(null)
      setReadingAnswered(false)
    } else {
      setPhase('writing')
    }
  }

  const handleSubmitWriting = async () => {
    if (!quizData) return
    setPhase('grading')
    const data = recordStudySession()
    setStreakData({ current: data.current, isNewDay: data.isNewDay })
    setAlreadyHasCert(hasEverPassedLevel(level))

    try {
      const res = await fetch('/api/quiz/grade-writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level,
          prompt: quizData.writing.prompt,
          answer: writingAnswer,
          grammarFocus: quizData.writing.grammar_focus,
        }),
      })
      const result = await res.json() as { score: number; feedback: string }
      setWritingScore(result.score)
      setWritingFeedback(result.feedback)
    } catch {
      setWritingScore(0)
      setWritingFeedback('Үнэлгээ хийхэд алдаа гарлаа.')
    }
    setPhase('results')
  }

  const mcScore = mcAnswers.filter((a, i) => a === mcQuestions[i]?.correctIndex).length
  const readingScore = readingAnswers.filter((a, i) => a === readingQuestions[i]?.correctIndex).length * 2
  const totalScore = mcScore + readingScore + writingScore
  const passed = totalScore >= 18

  // ─── Error ───
  if (error) {
    return (
      <div className="min-h-screen bg-navy flex flex-col">
        <NavBar levelCode={level} lessonTitle="Тест" />
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <p className="text-rose-400 mb-4">{error}</p>
            <button onClick={loadQuiz} className="bg-gold text-navy font-semibold px-6 py-2.5 rounded-xl">
              {t('retry')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Loading ───
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-navy flex flex-col">
        <NavBar levelCode={level} lessonTitle="Тест" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="flex gap-1 justify-center mb-4">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-3 h-3 bg-gold rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <p className="text-text-secondary text-sm">{t('quizLoading')}</p>
          </div>
        </div>
      </div>
    )
  }

  // ─── Grading ───
  if (phase === 'grading') {
    return (
      <div className="min-h-screen bg-navy flex flex-col">
        <NavBar levelCode={level} lessonTitle="Тест — үнэлж байна" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="flex gap-1 justify-center mb-4">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-3 h-3 bg-gold rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <p className="text-text-secondary text-sm">{t('quizGrading')}</p>
          </div>
        </div>
      </div>
    )
  }

  // ─── MC Phase ───
  if (phase === 'mc') {
    const q = mcQuestions[mcIndex]
    return (
      <div className="min-h-screen bg-navy flex flex-col">
        <NavBar levelCode={level} lessonTitle={`${t('quizMC')} — ${mcIndex + 1}/15`} />
        <div className="flex-1 overflow-y-auto p-6 max-w-lg mx-auto w-full">
          {/* Progress bar */}
          <div className="flex gap-1 mb-2">
            {mcQuestions.map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  i < mcIndex
                    ? mcAnswers[i] === mcQuestions[i].correctIndex ? 'bg-emerald-500' : 'bg-rose-500'
                    : i === mcIndex ? 'bg-gold' : 'bg-navy-surface-2'
                }`}
              />
            ))}
          </div>
          {/* Section indicators */}
          <div className="flex gap-2 text-xs text-text-secondary mb-5">
            <span className="text-gold font-semibold">{t('quizMC')} 15</span>
            <span>·</span>
            <span>{t('quizReading')} 4</span>
            <span>·</span>
            <span>{t('quizWriting')} 6</span>
            <span className="ml-auto">{t('quizScoreTotal')}: 25</span>
          </div>

          <div className="text-xs text-text-secondary mb-3">{level} · {mcIndex + 1}/{mcQuestions.length}</div>
          {q && (
            <>
              <h2 className="text-lg font-semibold text-text-primary mb-6">{q.question}</h2>
              <div className="space-y-3 mb-6">
                {q.options.map((opt, i) => {
                  let style = 'border-navy-surface-2 text-text-primary hover:border-gold/40 cursor-pointer'
                  if (mcAnswered) {
                    if (i === q.correctIndex) style = 'border-emerald-500 bg-emerald-500/10 text-emerald-400 cursor-default'
                    else if (i === mcSelected) style = 'border-rose-500 bg-rose-500/10 text-rose-400 cursor-default'
                    else style = 'border-navy-surface-2 text-text-secondary opacity-50 cursor-default'
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => handleMCSelect(i)}
                      disabled={mcAnswered}
                      className={`w-full text-left px-4 py-3 min-h-[48px] flex items-center rounded-xl border transition-all text-sm ${style}`}
                    >
                      <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </button>
                  )
                })}
              </div>
              {mcAnswered && (
                <>
                  <div className={`rounded-xl p-4 mb-6 text-sm ${mcSelected === q.correctIndex ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-rose-500/10 border border-rose-500/30'}`}>
                    <div className={`font-semibold mb-1 ${mcSelected === q.correctIndex ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {mcSelected === q.correctIndex ? '✅ Зөв!' : '❌ Буруу.'}
                    </div>
                    <p className="text-text-secondary text-xs">{q.explanation}</p>
                  </div>
                  <button
                    onClick={handleMCNext}
                    className="w-full bg-gold hover:bg-gold-dark text-navy font-bold py-3 min-h-[48px] rounded-xl transition-colors"
                  >
                    {mcIndex < mcQuestions.length - 1 ? `${t('next')} →` : `${t('quizReading')} →`}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // ─── Reading Phase ───
  if (phase === 'reading' && quizData) {
    const q = readingQuestions[readingIndex]
    return (
      <div className="min-h-screen bg-navy flex flex-col">
        <NavBar levelCode={level} lessonTitle={`${t('quizReading')} — ${readingIndex + 1}/2`} />
        <div className="flex-1 overflow-y-auto p-6 max-w-lg mx-auto w-full">
          {/* Passage */}
          <div className="bg-navy-surface border border-navy-surface-2 rounded-xl p-4 mb-6">
            <div className="text-xs text-gold font-semibold mb-2 uppercase tracking-wide">{t('quizReading')}</div>
            <p className="text-text-primary text-sm leading-relaxed">{quizData.reading.passage}</p>
          </div>

          <div className="text-xs text-text-secondary mb-3">Асуулт {readingIndex + 1}/2</div>
          {q && (
            <>
              <h2 className="text-base font-semibold text-text-primary mb-5">{q.question}</h2>
              <div className="space-y-3 mb-6">
                {q.options.map((opt, i) => {
                  let style = 'border-navy-surface-2 text-text-primary hover:border-gold/40 cursor-pointer'
                  if (readingAnswered) {
                    if (i === q.correctIndex) style = 'border-emerald-500 bg-emerald-500/10 text-emerald-400 cursor-default'
                    else if (i === readingSelected) style = 'border-rose-500 bg-rose-500/10 text-rose-400 cursor-default'
                    else style = 'border-navy-surface-2 text-text-secondary opacity-50 cursor-default'
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => handleReadingSelect(i)}
                      disabled={readingAnswered}
                      className={`w-full text-left px-4 py-3 min-h-[48px] flex items-center rounded-xl border transition-all text-sm ${style}`}
                    >
                      <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </button>
                  )
                })}
              </div>
              {readingAnswered && (
                <>
                  <div className={`rounded-xl p-4 mb-6 text-sm ${readingSelected === q.correctIndex ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-rose-500/10 border border-rose-500/30'}`}>
                    <div className={`font-semibold mb-1 ${readingSelected === q.correctIndex ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {readingSelected === q.correctIndex ? '✅ Зөв!' : '❌ Буруу.'}
                    </div>
                    <p className="text-text-secondary text-xs">{q.explanation}</p>
                  </div>
                  <button
                    onClick={handleReadingNext}
                    className="w-full bg-gold hover:bg-gold-dark text-navy font-bold py-3 min-h-[48px] rounded-xl transition-colors"
                  >
                    {readingIndex < readingQuestions.length - 1 ? `${t('next')} →` : `${t('quizWriting')} →`}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // ─── Writing Phase ───
  if (phase === 'writing' && quizData) {
    return (
      <div className="min-h-screen bg-navy flex flex-col">
        <NavBar levelCode={level} lessonTitle={t('quizWriting')} />
        <div className="flex-1 overflow-y-auto p-6 max-w-lg mx-auto w-full">
          <div className="bg-navy-surface border border-gold/30 rounded-xl p-4 mb-5">
            <div className="text-xs text-gold font-semibold mb-2 uppercase tracking-wide">{t('quizWriting')}</div>
            <p className="text-text-primary text-sm leading-relaxed">{quizData.writing.prompt}</p>
            <div className="mt-2 text-xs text-text-secondary">Граммар: <span className="text-gold/80">{quizData.writing.grammar_focus}</span></div>
          </div>

          <textarea
            value={writingAnswer}
            onChange={e => setWritingAnswer(e.target.value)}
            placeholder={t('quizWritingPlaceholder')}
            rows={6}
            className="w-full bg-navy-surface border border-navy-surface-2 rounded-xl p-4 text-text-primary text-sm resize-none focus:outline-none focus:border-gold/50 mb-4"
          />

          <button
            onClick={handleSubmitWriting}
            disabled={writingAnswer.trim().length < 5}
            className="w-full bg-gold hover:bg-gold-dark disabled:opacity-40 disabled:cursor-not-allowed text-navy font-bold py-3 min-h-[48px] rounded-xl transition-colors"
          >
            {t('quizSubmitWriting')} →
          </button>
        </div>
      </div>
    )
  }

  // ─── Results ───
  if (phase === 'results') {
    return (
      <div className="min-h-screen bg-navy flex flex-col">
        <NavBar levelCode={level} lessonTitle="Тест — үр дүн" />
        <div className="flex-1 overflow-y-auto p-6 max-w-lg mx-auto w-full">
          {/* Score summary */}
          <div className="text-center mb-6">
            <div className="text-6xl font-extrabold text-gold mb-2">{totalScore}/25</div>
            <div className={`text-xl font-bold mb-2 ${passed ? 'text-emerald-400' : 'text-rose-400'}`}>
              {passed ? t('quizPassed') : t('quizFailed')}
            </div>
            <p className="text-text-secondary text-sm">
              {passed ? t('quizPassMsg') : t('quizFailMsg')}
            </p>
          </div>

          {/* Score bar */}
          <div className="w-full h-3 bg-navy-surface-2 rounded-full overflow-hidden mb-6">
            <div
              className={`h-full rounded-full transition-all duration-700 ${passed ? 'bg-emerald-500' : 'bg-rose-500'}`}
              style={{ width: `${(totalScore / 25) * 100}%` }}
            />
          </div>

          {/* Score breakdown */}
          <div className="bg-navy-surface border border-navy-surface-2 rounded-xl p-4 mb-5">
            <div className="text-sm font-semibold text-text-primary mb-3">Оноог задлал</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">{t('quizScoreMC')} (×1)</span>
                <span className="text-text-primary font-medium">{mcScore}/15</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">{t('quizScoreReading')} (×2)</span>
                <span className="text-text-primary font-medium">{readingScore}/4</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">{t('quizScoreWriting')}</span>
                <span className="text-text-primary font-medium">{writingScore}/6</span>
              </div>
              <div className="h-px bg-navy-surface-2 my-1" />
              <div className="flex justify-between text-sm font-bold">
                <span className="text-text-primary">{t('quizScoreTotal')}</span>
                <span className={passed ? 'text-emerald-400' : 'text-rose-400'}>{totalScore}/25</span>
              </div>
            </div>
          </div>

          {/* Writing feedback */}
          {writingFeedback && (
            <div className="bg-navy-surface border border-navy-surface-2 rounded-xl p-4 mb-5">
              <div className="text-sm font-semibold text-text-primary mb-2">{t('quizWritingFeedback')}</div>
              <p className="text-text-secondary text-xs leading-relaxed">{writingFeedback}</p>
            </div>
          )}

          {/* Certificate / repeat message */}
          <div className="flex flex-col gap-3">
            {passed && !alreadyHasCert && (
              <button
                onClick={() => setShowCertificate(true)}
                className="w-full bg-gold hover:bg-gold-dark text-navy font-bold py-3 min-h-[48px] rounded-xl transition-colors"
              >
                🎓 Гэрчилгээ авах
              </button>
            )}
            {passed && alreadyHasCert && (
              <div className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-xl py-4 px-4 text-center">
                <div className="text-emerald-400 font-semibold text-sm mb-1">🏆 Амжилттай давлаа!</div>
                <div className="text-text-secondary text-xs">Та өмнө нь энэ түвшний гэрчилгээ авсан байна.</div>
              </div>
            )}
            <button
              onClick={loadQuiz}
              className="w-full bg-navy-surface hover:bg-navy-surface-2 border border-navy-surface-2 text-text-primary font-semibold py-3 min-h-[48px] rounded-xl transition-colors"
            >
              {t('quizRetry')}
            </button>
          </div>
        </div>

        {showCertificate && (
          <CertificateModal
            level={level}
            score={totalScore}
            total={25}
            onClose={() => setShowCertificate(false)}
          />
        )}
        {streakData && streakData.isNewDay && (
          <StreakPopup streak={streakData.current} onClose={() => setStreakData(null)} />
        )}
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
git add src/components/QuizMode.tsx
git commit -m "feat: extended quiz — 15 MC + reading + Claude-graded writing, 25 pts, Fisher-Yates shuffle"
```

---

## Task 6: Build verification

- [ ] **Step 1: Run build**

```bash
npm run build
```

Expected: `✓ Compiled successfully` with no errors.

- [ ] **Step 2: Commit if any fixes needed, else done**
