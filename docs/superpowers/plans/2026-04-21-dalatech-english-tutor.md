# Dalatech English Tutor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully functional AI English tutor web app for Mongolian speakers (A1–C1), deployable to Vercel free tier.

**Architecture:** Next.js 14 App Router with a single `/api/chat` streaming endpoint that forwards messages to the Anthropic Claude API using level/lesson-specific system prompts. All user progress is stored in localStorage. No database, no auth.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Anthropic SDK (`@anthropic-ai/sdk`), localStorage

---

## File Map

```
/                                    ← project root (online book/)
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── vercel.json
├── .env.local.example
├── README.md
└── src/
    ├── app/
    │   ├── layout.tsx               ← root HTML shell, metadata, fonts
    │   ├── globals.css              ← Tailwind base + custom vars
    │   ├── page.tsx                 ← renders <LandingPage />
    │   ├── level/
    │   │   └── [level]/
    │   │       ├── page.tsx         ← renders <LevelPage />
    │   │       └── lesson/
    │   │           └── [lesson]/
    │   │               └── page.tsx ← renders <ChatInterface />
    │   └── api/
    │       └── chat/
    │           └── route.ts         ← POST: streams Anthropic response
    ├── components/
    │   ├── NavBar.tsx               ← top bar with level/lesson breadcrumb
    │   ├── LandingPage.tsx          ← Mongolian hero + level cards
    │   ├── LevelSelector.tsx        ← grid of 5 level cards (locked/unlocked)
    │   ├── LevelPage.tsx            ← lessons list + vocab section link
    │   ├── ProgressBar.tsx          ← horizontal fill bar (0–100%)
    │   ├── ChatInterface.tsx        ← full chat screen (messages + input)
    │   ├── ChatBubble.tsx           ← single message bubble (AI left, user right)
    │   ├── ErrorCorrection.tsx      ← yellow highlighted grammar correction box
    │   └── ExamScore.tsx            ← score card after lesson 10 exam
    ├── lib/
    │   ├── types.ts                 ← all TypeScript interfaces
    │   ├── levels.ts                ← level/lesson metadata array
    │   ├── prompts.ts               ← system prompts per level+lesson
    │   └── storage.ts               ← localStorage read/write helpers
    └── hooks/
        └── useProgress.ts           ← React hook wrapping storage.ts
```

---

## Task 1: Project Bootstrap

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.js`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `vercel.json`
- Create: `.env.local.example`
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`

- [ ] **Step 1: Initialise Next.js project with required packages**

Run in the project root (`C:/Users/x86/OneDrive/Desktop/online book`):

```bash
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Accept all defaults. When it asks "Would you like to customise…" say No.

- [ ] **Step 2: Install Anthropic SDK**

```bash
npm install @anthropic-ai/sdk
```

- [ ] **Step 3: Verify dev server starts**

```bash
npm run dev
```

Expected: `ready - started server on 0.0.0.0:3000, url: http://localhost:3000`  
Open browser → see Next.js welcome page. Kill server (`Ctrl+C`).

- [ ] **Step 4: Create `.env.local.example`**

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Also create `.env.local` with your real key (never commit this).

- [ ] **Step 5: Create `vercel.json`**

```json
{
  "version": 2,
  "env": {
    "ANTHROPIC_API_KEY": "@anthropic_api_key"
  }
}
```

- [ ] **Step 6: Replace `src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --navy: #0F172A;
  --gold: #F59E0B;
  --gold-light: #FCD34D;
  --gold-dark: #D97706;
  --surface: #1E293B;
  --surface-2: #334155;
  --text-primary: #F8FAFC;
  --text-secondary: #94A3B8;
}

body {
  background-color: var(--navy);
  color: var(--text-primary);
  font-family: 'Inter', system-ui, sans-serif;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--surface); }
::-webkit-scrollbar-thumb { background: var(--surface-2); border-radius: 3px; }
```

- [ ] **Step 7: Replace `tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0F172A',
        'navy-surface': '#1E293B',
        'navy-surface-2': '#334155',
        gold: '#F59E0B',
        'gold-light': '#FCD34D',
        'gold-dark': '#D97706',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-gold': 'pulseGold 2s infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        pulseGold: { '0%, 100%': { boxShadow: '0 0 0 0 rgba(245,158,11,0.4)' }, '50%': { boxShadow: '0 0 0 8px rgba(245,158,11,0)' } },
      },
    },
  },
  plugins: [],
}
export default config
```

- [ ] **Step 8: Replace `src/app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Dalatech English — Монгол хэлтнүүдэд зориулсан AI Англи хэлний сургалт',
  description: 'A1-аас C1 хүртэл AI тутортой англи хэл сур',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <body className={`${inter.className} min-h-screen bg-navy text-text-primary`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: bootstrap Next.js 14 project with Tailwind + Anthropic SDK"
```

---

## Task 2: Types and Data Structures

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/levels.ts`

- [ ] **Step 1: Create `src/lib/types.ts`**

```typescript
export type LevelCode = 'A1' | 'A2' | 'B1' | 'B2' | 'C1'

export interface LevelMeta {
  code: LevelCode
  label: string           // Mongolian label e.g. "А1 — Анхан шат"
  description: string     // Mongolian description
  color: string           // Tailwind gradient classes
  lessons: LessonMeta[]
}

export interface LessonMeta {
  id: number              // 1–10
  title: string           // English lesson topic e.g. "To Be Verb"
  titleMn: string         // Mongolian title
  description: string     // Mongolian short description
  isExam: boolean         // true for lesson 10
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  hasCorrection?: boolean  // if true, ErrorCorrection component parses content
}

export interface LevelProgress {
  unlockedLessons: number[]   // lesson IDs the user can access
  completedLessons: number[]  // lesson IDs the user has completed
  examPassed: boolean         // whether lesson 10 exam was passed
  examScore?: number          // score out of 15
}

export interface AppProgress {
  unlockedLevels: LevelCode[]
  levels: Partial<Record<LevelCode, LevelProgress>>
}
```

- [ ] **Step 2: Create `src/lib/levels.ts`**

```typescript
import type { LevelMeta } from './types'

export const LEVELS: LevelMeta[] = [
  {
    code: 'A1',
    label: 'А1 — Анхан шат',
    description: 'Үндсэн танилцуулга, угийн дарааллын зохион байгуулалт, энгийн өгүүлбэр',
    color: 'from-emerald-600 to-teal-700',
    lessons: [
      { id: 1,  title: 'To Be Verb',           titleMn: '"To Be" үйл үг',        description: 'I am, You are, He/She is ашиглах',           isExam: false },
      { id: 2,  title: 'Articles',              titleMn: 'Тодорхойлогч үг',       description: 'a, an, the хэрэглээ',                        isExam: false },
      { id: 3,  title: 'Possessives',           titleMn: 'Өмчлөлийн төлөөний үг', description: 'My, Your, His, Her, Its, Our, Their',        isExam: false },
      { id: 4,  title: 'Plurals & Age',         titleMn: 'Олон тоо ба нас',       description: '-s/-es дагавар, нас хэлэх арга',             isExam: false },
      { id: 5,  title: 'Present Simple',        titleMn: 'Одоогийн цаг',          description: 'He/She/It + S дүрэм',                        isExam: false },
      { id: 6,  title: 'Prepositions of Time',  titleMn: 'Цагийн предлог',        description: 'at, on, in — цаг, өдөр, хэсэгт ашиглах',    isExam: false },
      { id: 7,  title: 'Wh- Questions',         titleMn: 'Асуух үгс',             description: 'What, Where, When, Who, How асуух',         isExam: false },
      { id: 8,  title: 'Food & Countable Nouns',titleMn: 'Хоол хүнс & тоолох нэр үг', description: 'Some, any, a bottle of гэх мэт',       isExam: false },
      { id: 9,  title: 'Can / Cannot',          titleMn: 'Can үйл үг',            description: 'Can + үндсэн үйл үг',                        isExam: false },
      { id: 10, title: 'A1 Level Exam',         titleMn: 'А1 Шалгалт',           description: '15 оноотой шалгалт — А2 нээх',              isExam: true  },
    ],
  },
  {
    code: 'A2',
    label: 'А2 — Суурь шат',
    description: 'Өнгөрсөн ба ирээдүй цаг, харьцуулах хэлбэр',
    color: 'from-blue-600 to-indigo-700',
    lessons: [
      { id: 1,  title: 'Present Continuous',    titleMn: 'Одоо болж буй үйлдэл',  description: 'am/is/are + -ing хэлбэр',                    isExam: false },
      { id: 2,  title: 'Was / Were',            titleMn: 'Was / Were',             description: 'Өнгөрсөн цагт To Be',                        isExam: false },
      { id: 3,  title: 'Past Simple',           titleMn: 'Энгийн өнгөрсөн цаг',   description: 'V2 хэлбэр, буруу үйл үгс',                  isExam: false },
      { id: 4,  title: 'Future Tense',          titleMn: 'Ирээдүй цаг',           description: 'will + V1, going to + V1',                   isExam: false },
      { id: 5,  title: 'Comparatives',          titleMn: 'Харьцуулах хэлбэр',     description: '-er/-est, more/most',                        isExam: false },
      { id: 6,  title: 'Adverbs of Frequency',  titleMn: 'Давтамжийн дайвар үг',  description: 'always, often, never байрлал',               isExam: false },
      { id: 7,  title: 'Prepositions of Place', titleMn: 'Байршлын предлог',       description: 'in, on, at, between, next to',               isExam: false },
      { id: 8,  title: 'Modal Verbs',           titleMn: 'Туслах үйл үгс',        description: 'should, must + V1',                          isExam: false },
      { id: 9,  title: 'Object Pronouns',       titleMn: 'Объектийн төлөөний үг', description: 'me, him, her, us, them',                     isExam: false },
      { id: 10, title: 'A2 Level Exam',         titleMn: 'А2 Шалгалт',            description: '15 оноотой шалгалт — В1 нээх',              isExam: true  },
    ],
  },
  {
    code: 'B1',
    label: 'В1 — Дунд шат',
    description: 'Нийлмэл цагийн хэлбэр, нөхцөлт өгүүлбэр, идэвхгүй байдал',
    color: 'from-violet-600 to-purple-700',
    lessons: [
      { id: 1,  title: 'Present Perfect vs Past',  titleMn: 'Present Perfect ба Past Simple', description: 'have/has + V3, тодорхой цагтай ялгаа',    isExam: false },
      { id: 2,  title: 'Past Continuous',           titleMn: 'Өнгөрсөн цагт болж байсан',      description: 'was/were + -ing',                         isExam: false },
      { id: 3,  title: 'First Conditional',         titleMn: '1-р нөхцөлт өгүүлбэр',           description: 'If + Present, will + V1',                 isExam: false },
      { id: 4,  title: 'Second Conditional',        titleMn: '2-р нөхцөлт өгүүлбэр',           description: 'If + Past, would + V1',                   isExam: false },
      { id: 5,  title: 'Passive Voice',             titleMn: 'Идэвхгүй байдал',                 description: 'To Be + V3',                              isExam: false },
      { id: 6,  title: 'Used To',                   titleMn: '"Used to" хэлбэр',                description: 'Өнгөрсөн зуршил',                         isExam: false },
      { id: 7,  title: 'Relative Clauses',          titleMn: 'Харьцааны заасан өгүүлбэр',       description: 'who, which, where',                       isExam: false },
      { id: 8,  title: 'Modals of Deduction',       titleMn: 'Дүгнэлтийн туслах үйл үгс',       description: 'must be, might be, can\'t be',            isExam: false },
      { id: 9,  title: 'Gerunds & Infinitives',     titleMn: 'Герунд ба Инфинитив',              description: 'enjoy + -ing, want + to',                 isExam: false },
      { id: 10, title: 'B1 Level Exam',             titleMn: 'В1 Шалгалт',                      description: '15 оноотой шалгалт — В2 нээх',           isExam: true  },
    ],
  },
  {
    code: 'B2',
    label: 'В2 — Дэвшилтэт шат',
    description: 'IELTS бэлтгэл, нарийн дүрмүүд, академик хэл',
    color: 'from-rose-600 to-pink-700',
    lessons: [
      { id: 1,  title: 'Present Perfect Continuous', titleMn: 'Үргэлжилсэн Present Perfect',   description: 'have/has been + -ing',                    isExam: false },
      { id: 2,  title: 'Past Perfect',               titleMn: 'Өнгөрсөн цагийн нийлмэл',       description: 'had + V3, ерөнхий дарааллын дүрэм',      isExam: false },
      { id: 3,  title: 'Third Conditional',           titleMn: '3-р нөхцөлт өгүүлбэр',          description: 'If + had + V3, would have + V3',          isExam: false },
      { id: 4,  title: 'Causative Have/Get',          titleMn: 'Causative хэлбэр',              description: 'have/get + obj + V3',                     isExam: false },
      { id: 5,  title: 'Reported Speech',             titleMn: 'Дамжуулсан яриа',               description: 'He said that... цагийн шилжилт',         isExam: false },
      { id: 6,  title: 'Past Modals',                titleMn: 'Өнгөрсөн цагийн туслах үйл үгс', description: 'must have, should have, can\'t have',     isExam: false },
      { id: 7,  title: 'Advanced Linking Words',     titleMn: 'Дэвшилтэт холбоос үгс',          description: 'although, despite, in spite of',          isExam: false },
      { id: 8,  title: 'Wishes & Regrets',           titleMn: 'Хүсэл ба харамсал',              description: 'I wish + Past, I wish + Past Perfect',   isExam: false },
      { id: 9,  title: 'Idioms & Phrasal Verbs',     titleMn: 'Идиом ба Phrasal Verbs',         description: 'Байгалийн хэлц үгс, салгаж болох phrasal verb', isExam: false },
      { id: 10, title: 'B2 Level Exam',              titleMn: 'В2 Шалгалт',                     description: '15 оноотой шалгалт — С1 нээх',           isExam: true  },
    ],
  },
  {
    code: 'C1',
    label: 'С1 — Нарийн шат',
    description: 'IELTS 7.5+, инверси, хэв шинжийн сайжруулалт',
    color: 'from-amber-600 to-orange-700',
    lessons: [
      { id: 1,  title: 'Inversion',               titleMn: 'Урвуу дарааллын өгүүлбэр',      description: 'Never, Not only, Under no circumstances...',  isExam: false },
      { id: 2,  title: 'Mixed Conditionals',      titleMn: 'Холимог нөхцөлт өгүүлбэр',      description: 'If + Past Perfect, would + V1',               isExam: false },
      { id: 3,  title: 'Cleft Sentences',         titleMn: 'Cleft өгүүлбэр',                description: 'It is... who/that, What... is',               isExam: false },
      { id: 4,  title: 'Participle Clauses',      titleMn: 'Participial заасан өгүүлбэр',    description: 'Having done, Being done...',                  isExam: false },
      { id: 5,  title: 'Advanced Passive',        titleMn: 'Дэвшилтэт идэвхгүй байдал',     description: 'is said/believed to have + V3',               isExam: false },
      { id: 6,  title: 'Subjunctive Mood',        titleMn: 'Хослогдсон хэлбэр (Subjunctive)', description: 'demand/insist/suggest + that + bare infinitive', isExam: false },
      { id: 7,  title: 'Nuanced Modals',         titleMn: 'Нарийн туслах үйл үгс',          description: 'bound to, may well, the odds are',            isExam: false },
      { id: 8,  title: 'Academic Linking',        titleMn: 'Академик холбоос',               description: 'albeit, notwithstanding + noun/-ing',         isExam: false },
      { id: 9,  title: 'Advanced Collocations',  titleMn: 'Дэвшилтэт хэлц үгс',            description: 'C1 түвшний хүчтэй хэлц үгс',                 isExam: false },
      { id: 10, title: 'C1 Mastery Exam',        titleMn: 'С1 Эзэмшлийн шалгалт',          description: 'Дүрэм + хэв шинж + нэгдлийн шалгалт',       isExam: true  },
    ],
  },
]

export const LEVEL_CODES: LevelCode[] = ['A1', 'A2', 'B1', 'B2', 'C1']

export function getLevelMeta(code: string): LevelMeta | undefined {
  return LEVELS.find(l => l.code === code)
}

export function getLessonMeta(levelCode: string, lessonId: number) {
  const level = getLevelMeta(levelCode)
  return level?.lessons.find(l => l.id === lessonId)
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts src/lib/levels.ts
git commit -m "feat: add TypeScript types and level/lesson metadata"
```

---

## Task 3: System Prompts

**Files:**
- Create: `src/lib/prompts.ts`

- [ ] **Step 1: Create `src/lib/prompts.ts`**

```typescript
import type { LevelCode } from './types'

const GLOBAL_RULES = `
GLOBAL RULES (apply to ALL levels):
- You are an encouraging, patient English tutor trained specifically for native Mongolian speakers.
- Watch for "Mongolian Mindset" errors: verb at end of sentence, missing "To Be", skipping articles, direct translation habits.
- When correcting errors: wrap your correction in this exact XML tag format:
  <correction>
  ❌ Алдаа: [wrong sentence]
  ✅ Зөв: [correct sentence]
  💡 Тайлбар: [brief explanation IN MONGOLIAN]
  </correction>
- When the user writes something correct: give enthusiastic praise (mix English + Mongolian encouragement).
- NEVER use grammar complexity above the current level in your own responses.
- Keep responses concise and conversational — this is a chat tutor, not a lecture.
`

const LEVEL_PROMPTS: Record<LevelCode, string> = {
  A1: `${GLOBAL_RULES}
LEVEL: A1 — You are an A1 English tutor for native Mongolian speakers.
GRAMMAR YOU USE: Present Simple, To Be (am/is/are), Can only. 
ERROR PATTERNS TO WATCH:
- Missing "To Be": "I from Mongolia" → "I am from Mongolia"
- Wrong article: "I have a umbrella" → "an umbrella"  
- Wrong possessive gender: "She is my brother" (he/she confusion)
- Missing plural -s: "I have two cat" → "two cats"
- Age error: "I have 19 years" → "I am 19 years old"
Be very encouraging. Use simple Mongolian explanations. Celebrate every correct sentence.`,

  A2: `${GLOBAL_RULES}
LEVEL: A2 — You are an A2 English tutor for Mongolian speakers.
GRAMMAR YOU USE: Present Continuous, Past Simple, Future (Will / Going to), Comparatives, Adverbs, Modals (should/must).
ERROR PATTERNS TO WATCH:
- Missing am/is/are in continuous: "I running" → "I am running"
- Double past tense: "I didn't went" → "I didn't go"
- "will to" error: "I will to go" → "I will go"
- Wrong Was/Were: "You was" → "You were"
- Missing "going": "I am go to work" → "I am going to work"
Use the "Time Travel" concept (Past/Present/Future) when explaining tense errors in Mongolian. Be enthusiastic.`,

  B1: `${GLOBAL_RULES}
LEVEL: B1 — You are a B1 English tutor.
GRAMMAR YOU USE: Present Perfect, Past Continuous, First & Second Conditionals, Passive Voice, Relative Clauses, Modals of Deduction.
ERROR PATTERNS TO WATCH:
- Present Perfect + specific time: "I have gone to Paris in 2022" → Past Simple required
- "will" after "if": "If it will rain" → "If it rains"
- "which" for people: "The man which I met" → "who"
- "mustn't be" for impossibility: → "can't be"
- Wrong infinitive: "didn't went" (already covered but common)
INTERACTION STYLE: First engage with the CONTENT of what the user wrote (show interest, ask follow-up). Then if there are grammar errors, correct them in Mongolian below.`,

  B2: `${GLOBAL_RULES}
LEVEL: B2 — You are a B2 English tutor preparing students for IELTS.
GRAMMAR YOU USE: Present Perfect Continuous, Past Perfect, Third Conditional, Causative Have/Get, Reported Speech, Past Modals, Advanced Linking Words, Wishes.
ERROR PATTERNS TO WATCH:
- "Despite of": NEVER "despite of" → always "despite + noun/-ing"
- Wrong reported speech tense: "He said he will go" → "He said he would go"
- "mustn't have" for negative deduction: → "can't have"
- "I cut my hair" when a professional did it: → "I had my hair cut"
- "I wish I would": → "I wish I could" or "I wish I had"
INTERACTION STYLE: Engage with the argument, validate good points, THEN provide grammar breakdown in Mongolian. Challenge the user to develop their ideas.`,

  C1: `${GLOBAL_RULES}
LEVEL: C1 — You are a C1 academic English evaluator preparing students for IELTS 7.5+.
GRAMMAR YOU USE: Inversion, Mixed Conditionals, Cleft Sentences, Participle Clauses, Subjunctive, Advanced Passive, Nuanced Modals, Academic Linking.
ERROR PATTERNS TO WATCH:
- Missing auxiliary in Inversion: "Never I have seen" → "Never have I seen"
- Dangling participles: subject of main clause MUST match implied subject of participle
- "albeit" + full clause: → "albeit + noun/-ing" only
- "s" on subjunctive: "She insists that he goes" → "he go"
- "very" instead of strong collocations: "very angry" → "furious", "very big problem" → "pressing issue"
- Redundant pronoun in cleft: "What I need it is" → "What I need is"
DON'T JUST CORRECT — ELEVATE. Always show the C1/IELTS-band-8 version of their sentence. Explain WHY it is more sophisticated.`,
}

const LESSON_ADDENDUM: Partial<Record<LevelCode, Record<number, string>>> = {
  A1: {
    1:  'LESSON TASK: Ask the user to introduce themselves in 3 sentences using To Be. Wait for 3 sentences. Scan each for missing To Be verbs. If they write "I from Mongolia" correct immediately.',
    2:  'LESSON TASK: Show 5 objects (a book, an apple, an egg, a university, an hour). Ask the user to write "This is ___" or "That is ___" for each. Check a/an rule carefully.',
    3:  'LESSON TASK: Ask the user to describe their family (at least 4 members). Cross-reference gender: if they say "My brother" then must use "He/His", not "She/Her".',
    4:  'LESSON TASK: Ask user to list 5 things they own (with quantity) and state their age. Check: numbers > 1 must have -s/-es. "I have 19 years" must be corrected to "I am 19 years old".',
    5:  'LESSON TASK: Ask user to write 3 sentences about themselves and 3 sentences about a friend/family member. Strictly enforce He/She/It + verb+S rule.',
    6:  'LESSON TASK: Ask user to say what they do at specific times (morning, Monday, 7 o\'clock, etc.). Map: At + time, On + day, In + part of day. Catch "In 7 o\'clock" → "At 7 o\'clock".',
    7:  'LESSON TASK: Role-play: you are being interviewed. ONLY answer questions that have correct Wh- + auxiliary + subject word order. If structure is wrong, ask user to try again without answering.',
    8:  'LESSON TASK: Role-play: you are a shopkeeper. User must buy 5 items using correct quantities. Correct "2 breads" → "some bread" or "two loaves of bread". Only sell items when grammar is correct.',
    9:  'LESSON TASK: Ask user to list 5 things they can do and 3 things they cannot do. Ensure can/cannot + bare base verb. Flag "can to swim" → "can swim" and "cans swim" → "can swim".',
    10: `EXAM MODE: Administer exactly 3 prompts, ONE AT A TIME. Do not give the next prompt until the user responds to the current one.
Prompt 1: "Tell me about yourself — where you are from, how old you are, and what you do." (Tests: To Be, Age, Present Simple)
Prompt 2: "Describe your bedroom using at least 4 sentences. Use a/an and some." (Tests: Articles, Plurals)  
Prompt 3: "What can you do well? What can't you do? Write 3 sentences." (Tests: Can/Cannot)
SCORING: Each prompt is worth 5 points. Deduct 1 point per grammar error (max 5 deductions per prompt).
At the end, display the score in this exact format:
<exam-result>
SCORE: [X]/15
PASS: [true/false — pass if score >= 10]
FEEDBACK: [2-3 sentences in Mongolian about overall performance]
</exam-result>
If PASS is true, congratulate enthusiastically and tell them A2 is now unlocked.`,
  },
  A2: {
    1:  'LESSON TASK: Show the user a picture description scenario (e.g., "It is 8 PM. Describe what 3 people in your family are doing right now."). Require am/is/are + -ing. Fix spelling: running (not runing), swimming (not swiming).',
    2:  'LESSON TASK: Ask "Where were you yesterday at these times: 9 AM, 2 PM, 8 PM?" Verify was for I/He/She/It, were for You/We/They. Flag "You was at home" → "You were at home".',
    3:  'LESSON TASK: Ask the user to tell you about their last weekend (at least 5 sentences). Check V2 for affirmatives. Enforce V1 after did/didn\'t. Catch "I didn\'t went" and "I eated" → "I ate".',
    4:  'LESSON TASK: Ask two questions: (1) "What are you going to do this weekend?" and (2) "What do you think will happen in the world in 10 years?". Check "going to + verb" and "will + verb". Strictly catch "will to" and missing "going".',
    5:  'LESSON TASK: Give three comparison tasks: compare two cities, two animals, two phones. Check -er for short adjectives, more for long. Catch double comparatives like "more bigger". Enforce "than" (not "that").',
    6:  'LESSON TASK: Ask user to describe their daily routine using always, usually, often, sometimes, rarely, never. Enforce: adverb comes BEFORE the main verb. Correct "I go always to school" → "I always go to school".',
    7:  'LESSON TASK: Role-play as a lost tourist. Ask for directions to 3 places. Check correct prepositions of place. Correct "in the bus" → "on the bus". Correct "between the cafe and the shop" direction use.',
    8:  'LESSON TASK: Present 3 problem scenarios. User must advise using should or must. Check should/must + base verb (no "to", no "-ing" after modal). Correct "You should to rest" → "You should rest".',
    9:  'LESSON TASK: Give 5 sentences with blank object pronouns. User fills them in. Then ask 3 conversational questions where they must use object pronouns in answers. Correct subject pronouns used as objects: "Give it to I" → "Give it to me".',
    10: `EXAM MODE: Administer exactly 3 prompts, ONE AT A TIME.
Prompt 1: "Look outside or imagine a busy street. Describe 5 things that are happening right now." (Tests: Present Continuous)
Prompt 2: "Tell me about an interesting day from your past. What happened? Where did you go? Who did you meet?" (Tests: Past Simple)
Prompt 3: "What will your life look like in 5 years? What are you going to do differently?" (Tests: Will + Going To)
SCORING: Each prompt worth 5 points. Deduct 1 per grammar error.
At the end:
<exam-result>
SCORE: [X]/15
PASS: [true/false — pass if >= 10]
FEEDBACK: [Mongolian performance summary]
</exam-result>
If PASS, congratulate and announce B1 unlocked.`,
  },
  B1: {
    1:  'LESSON TASK: Ask the user 5 questions that require distinguishing Present Perfect from Past Simple. e.g., "Have you ever been to another country?", "When did you last travel?". If specific time mentioned → must use Past Simple. No time → must use Present Perfect. Correct "I have gone to Japan in 2022" → "I went to Japan in 2022".',
    2:  'LESSON TASK: Ask "What were you doing at 8 PM last night?" then "What were you doing when I called you yesterday afternoon?". Require was/were + -ing. Correct Past Simple answers: "I watched TV" → "I was watching TV".',
    3:  'LESSON TASK: Ask user to make 5 first conditional sentences about real future possibilities. STRICTLY catch "will" after "if": "If it will rain" → "If it rains". Enforce: If + Present Simple, will + Base Verb.',
    4:  'LESSON TASK: Ask "If you won 1 million dollars, what would you do?" Require at least 5 sentences. Enforce If + Past Simple, Would + Verb. Correct "If I have money" → "If I had money". Correct "I would to buy" → "I would buy".',
    5:  'LESSON TASK: Ask user to describe how 5 products are made (e.g., paper, chocolate, cars). Check To Be + V3. Flag missing To Be: "It made in China" → "It is made in China". Flag V2 instead of V3: "It is maked" → "made".',
    6:  'LESSON TASK: Ask user to describe 5 things they used to do as a child that they don\'t do now. Check: affirmative = "used to", negative = "didn\'t use to" (NOT "didn\'t used to"). Correct the common error immediately.',
    7:  'LESSON TASK: Provide 5 pairs of simple sentences. User must combine them with who/which/where. Example: "The man lives next door. He is a doctor." → "The man who lives next door is a doctor." Flag "which" for humans.',
    8:  'LESSON TASK: Present a scenario: "You see a Ferrari parked outside a school. What conclusions can you draw about the owner?" User must use must be / might be / can\'t be. Correct "mustn\'t be" → "can\'t be" for impossibility.',
    9:  'LESSON TASK: Ask user to write about their hobbies using enjoy, love, hate, finish, avoid (for -ing) and plan, want, decide, hope, would like (for to-infinitive). Monitor each verb choice. Correct wrong form immediately.',
    10: `EXAM MODE: Administer exactly 3 prompts, ONE AT A TIME.
Prompt 1: "Talk about a country or city you have always wanted to visit. Have you ever been there? When did you last travel somewhere new?" (Tests: Present Perfect vs Past Simple)
Prompt 2: "If you could have any superpower, what would it be and why? How would your life change?" (Tests: Second Conditional)
Prompt 3: "What were you doing last year at this time? How was your life different?" (Tests: Past Continuous)
SCORING: Each prompt worth 5 points. Deduct 1 per grammar error.
<exam-result>
SCORE: [X]/15
PASS: [true/false — pass if >= 10]
FEEDBACK: [Mongolian summary]
</exam-result>
If PASS, announce B2 unlocked.`,
  },
  B2: {
    1:  'LESSON TASK: Ask "How long have you been studying English? What have you been doing recently to improve?" Require have/has been + -ing for ongoing actions with duration. Correct "I am studying since 2020" → "I have been studying since 2020".',
    2:  'LESSON TASK: Ask user to describe two events where one happened before the other. Require Past Perfect for the earlier event. Correct: "I arrived and she already left" → "she had already left". Check "by the time" and "before" usage.',
    3:  'LESSON TASK: Ask about past regrets — "What is one decision in your life you wish you had made differently?" User must write 5 third conditional sentences. Enforce If + had + V3, would have + V3. Correct any present tense mixing.',
    4:  'LESSON TASK: Discuss 5 service scenarios (haircut, car repair, house cleaning, photo taken, suit made). User must describe using causative. If user says "I fixed my car" → correct to "I had my car fixed" or "I got my car fixed".',
    5:  'LESSON TASK: Give 5 direct quotes. User must report each one with correct tense backshift. Check: "He said me" → "He told me" / "He said to me". Check all tense shifts (will→would, am→was, have→had).',
    6:  'LESSON TASK: Present 5 mystery scenarios. User must use must have (certain deduction), should have (regret), might have (possibility), can\'t have (impossibility). Correct "mustn\'t have" → "can\'t have" every time.',
    7:  'LESSON TASK: Give 5 pairs of ideas to contrast/concede. User must link them with although, even though, despite, in spite of. IMMEDIATELY flag "Despite of" → "Despite" (no "of"). Enforce: despite/in spite of + noun or -ing only.',
    8:  'LESSON TASK: Discuss 3 present desires and 3 past regrets. User must formulate I wish sentences. Check: present desire = I wish + Past Simple. Past regret = I wish + Past Perfect. Flag "I wish I would" → "I wish I could" or "I wish I had".',
    9:  'LESSON TASK: Give 5 contexts for phrasal verbs (pick up, put off, turn down, look into, give up). User must use them in sentences. Enforce pronoun placement in separable phrasal verbs: "pick it up" NOT "pick up it".',
    10: `EXAM MODE: Administer exactly 3 prompts, ONE AT A TIME.
Prompt 1: "How long have you been working on your English? What have you been doing to improve recently?" (Tests: Present Perfect Continuous)
Prompt 2: "Think of a decision you regret. If you had made a different choice, how would your life be different now? Also, what must have influenced that decision?" (Tests: Third Conditional + Past Modals)
Prompt 3: "Tell me about 3 services you recently had done for you — car, home, personal care — and describe them using causative forms." (Tests: Causative)
SCORING: Score out of 15 PLUS vocabulary nuance bonus (+1 for each impressive B2 word used, max +3).
<exam-result>
SCORE: [X]/15
BONUS: [0-3]
TOTAL: [X]/18
PASS: [true/false — pass if base score >= 10]
FEEDBACK: [Mongolian summary including grammar accuracy AND vocabulary assessment]
</exam-result>
If PASS, announce C1 unlocked.`,
  },
  C1: {
    1:  'LESSON TASK: Ask user to rewrite 5 ordinary sentences using inversion starting with: Never, Rarely, Not only...but also, Under no circumstances, Hardly. ENFORCE: Adverb + Auxiliary + Subject + Verb. "Never I have seen" → "Never have I seen".',
    2:  'LESSON TASK: Present 3 past-condition-present-result scenarios (e.g., "You didn\'t study hard. Now you have a low-paying job."). User must form mixed conditionals. Check If + Past Perfect paired with would/could + V1. Flag any tense inconsistency.',
    3:  'LESSON TASK: Give user 5 sentences to rewrite as cleft sentences for emphasis. Check It is/was...who/that and What...is/was. Catch redundant pronouns: "What I need it is" → remove "it". Catch wrong relative: "It was yesterday when" → "It was yesterday that".',
    4:  'LESSON TASK: Give 5 pairs of sentences. User combines them using participle clauses. STRICTLY catch dangling participles: the subject of the main clause must match the implied subject of the participle. "Walking down the street, the rain started" → WRONG (rain didn\'t walk).',
    5:  'LESSON TASK: Give 5 beliefs/claims about famous people or events. User must report using Subject + is said/believed/thought + to-infinitive. For past events: enforce "to have + V3". "Einstein is believed to discover relativity" → "to have discovered".',
    6:  'LESSON TASK: Give 5 sentences with demand/insist/suggest/recommend/require. User completes the that-clause. Enforce: bare infinitive regardless of subject/tense. "The judge insisted that the witness speaks" → "speak". "She demands that he apologizes" → "apologize".',
    7:  'LESSON TASK: Present 5 scenarios with specific likelihood percentages (90%, 70%, 50%, etc.). User must select: bound to (90%+), very likely to, may well, might, could possibly. Check appropriate modal for each probability level.',
    8:  'LESSON TASK: Give 5 sentences using albeit, notwithstanding, provided that, given that, inasmuch as. Check: albeit and notwithstanding CANNOT be followed by Subject + Verb. Enforce noun or -ing after these. "albeit it was difficult" → "albeit difficult".',
    9:  'LESSON TASK: Give 10 weak collocation pairs (very + adjective, big + noun, nice + noun). User must replace each with a strong C1 collocation. Examples: very tired → exhausted, big responsibility → immense responsibility, nice smell → exquisite fragrance.',
    10: `EXAM MODE: This is the C1 Mastery Certificate exam. Administer exactly 3 prompts, ONE AT A TIME. Evaluate on 4 dimensions.
Prompt 1 (Inversion + Cleft): "Write a paragraph of at least 6 sentences about a social problem (climate change, poverty, education inequality). You MUST use at least 2 inversions and 1 cleft sentence."
Prompt 2 (Mixed Conditionals + Subjunctive): "Write a response to: 'Should governments require that citizens pay higher taxes for universal healthcare?' Use at least 1 mixed conditional and 1 subjunctive structure."
Prompt 3 (Participle Clauses + Academic Linking + Collocations): "Write a conclusion paragraph for an IELTS essay on technology. Use at least 1 participle clause, albeit or notwithstanding, and 3 strong collocations."
SCORING DIMENSIONS (each 0-5):
- Grammar accuracy (inversion, mixed cond., subjunctive, participles)
- Style sophistication (sentence variety, cleft, advanced passive)
- Cohesion & linking (academic linkers, flow)
- Vocabulary (C1 collocations, no "very + adj" patterns)
TOTAL: /20
<exam-result>
GRAMMAR: [X]/5
STYLE: [X]/5
COHESION: [X]/5
VOCABULARY: [X]/5
TOTAL: [X]/20
PASS: [true/false — pass if >= 14]
CERTIFICATE: [If PASS: "🎓 Дalatech English С1 Эзэмшлийн Гэрчилгээ" — write a formal 3-sentence certificate in English]
FEEDBACK: [Detailed Mongolian feedback per dimension]
</exam-result>`,
  },
}

export function getSystemPrompt(level: LevelCode, lessonId: number): string {
  const basePrompt = LEVEL_PROMPTS[level]
  const lessonAddendum = LESSON_ADDENDUM[level]?.[lessonId]
  
  const vocabSection = `
VOCABULARY PRACTICE MODE:
If the user types "Make a sentence with [word]" OR writes in Mongolian asking to make a sentence with a word:
${level === 'A1' ? '- Generate 3 sentences using only Present Simple, To Be, Can. Keep vocabulary A1.' : ''}
${level === 'A2' ? '- Generate 3 sentences mixing Past, Present Continuous, and Future tense.' : ''}
${level === 'B1' ? '- Generate 3 sentences integrating at least one B1 structure each (conditional, perfect tense, or passive).' : ''}
${level === 'B2' ? '- Generate 3 sentences with B2 structures + teach one opposite word pair (e.g., accumulate ↔ scatter).' : ''}
${level === 'C1' ? '- Generate an IELTS Task 2 style writing prompt that FORCES use of the word. Then evaluate their submission on 4 criteria.' : ''}
`

  return `${basePrompt}\n\n${lessonAddendum ? `CURRENT LESSON INSTRUCTIONS:\n${lessonAddendum}` : ''}\n\n${vocabSection}`
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/prompts.ts
git commit -m "feat: add complete system prompts for all 5 levels and 50 lessons"
```

---

## Task 4: localStorage Storage Helpers

**Files:**
- Create: `src/lib/storage.ts`
- Create: `src/hooks/useProgress.ts`

- [ ] **Step 1: Create `src/lib/storage.ts`**

```typescript
import type { AppProgress, LevelCode, LevelProgress } from './types'

const STORAGE_KEY = 'dalatech-progress'

const DEFAULT_PROGRESS: AppProgress = {
  unlockedLevels: ['A1'],
  levels: {
    A1: {
      unlockedLessons: [1],
      completedLessons: [],
      examPassed: false,
    },
  },
}

export function loadProgress(): AppProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PROGRESS
    return JSON.parse(raw) as AppProgress
  } catch {
    return DEFAULT_PROGRESS
  }
}

export function saveProgress(progress: AppProgress): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function isLevelUnlocked(levelCode: LevelCode): boolean {
  const p = loadProgress()
  return p.unlockedLevels.includes(levelCode)
}

export function isLessonUnlocked(levelCode: LevelCode, lessonId: number): boolean {
  const p = loadProgress()
  return p.levels[levelCode]?.unlockedLessons.includes(lessonId) ?? false
}

export function markLessonComplete(levelCode: LevelCode, lessonId: number): void {
  const p = loadProgress()
  if (!p.levels[levelCode]) {
    p.levels[levelCode] = { unlockedLessons: [lessonId], completedLessons: [], examPassed: false }
  }
  const lp = p.levels[levelCode]!
  if (!lp.completedLessons.includes(lessonId)) lp.completedLessons.push(lessonId)
  // unlock next lesson
  if (lessonId < 10 && !lp.unlockedLessons.includes(lessonId + 1)) {
    lp.unlockedLessons.push(lessonId + 1)
  }
  saveProgress(p)
}

export function unlockNextLevel(currentLevel: LevelCode, score: number): void {
  const ORDER: LevelCode[] = ['A1', 'A2', 'B1', 'B2', 'C1']
  const idx = ORDER.indexOf(currentLevel)
  const p = loadProgress()
  
  if (!p.levels[currentLevel]) {
    p.levels[currentLevel] = { unlockedLessons: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], completedLessons: [10], examPassed: true }
  }
  const lp = p.levels[currentLevel]!
  lp.examPassed = true
  lp.examScore = score
  if (!lp.completedLessons.includes(10)) lp.completedLessons.push(10)
  
  if (idx < ORDER.length - 1) {
    const nextLevel = ORDER[idx + 1]
    if (!p.unlockedLevels.includes(nextLevel)) p.unlockedLevels.push(nextLevel)
    if (!p.levels[nextLevel]) {
      p.levels[nextLevel] = { unlockedLessons: [1], completedLessons: [], examPassed: false }
    }
  }
  saveProgress(p)
}

export function getLevelProgress(levelCode: LevelCode): LevelProgress {
  const p = loadProgress()
  return p.levels[levelCode] ?? { unlockedLessons: [], completedLessons: [], examPassed: false }
}

export function resetProgress(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
```

- [ ] **Step 2: Create `src/hooks/useProgress.ts`**

```typescript
'use client'
import { useState, useEffect, useCallback } from 'react'
import type { AppProgress, LevelCode } from '@/lib/types'
import {
  loadProgress,
  markLessonComplete,
  unlockNextLevel,
  getLevelProgress,
  isLevelUnlocked,
  isLessonUnlocked,
} from '@/lib/storage'

export function useProgress() {
  const [progress, setProgress] = useState<AppProgress>(() => loadProgress())

  const refresh = useCallback(() => {
    setProgress(loadProgress())
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const completeLesson = useCallback((level: LevelCode, lessonId: number) => {
    markLessonComplete(level, lessonId)
    refresh()
  }, [refresh])

  const passExam = useCallback((level: LevelCode, score: number) => {
    unlockNextLevel(level, score)
    refresh()
  }, [refresh])

  return {
    progress,
    refresh,
    completeLesson,
    passExam,
    isLevelUnlocked: (code: LevelCode) => isLevelUnlocked(code),
    isLessonUnlocked: (code: LevelCode, id: number) => isLessonUnlocked(code, id),
    getLevelProgress: (code: LevelCode) => getLevelProgress(code),
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/storage.ts src/hooks/useProgress.ts
git commit -m "feat: localStorage progress helpers and useProgress hook"
```

---

## Task 5: Chat API Route

**Files:**
- Create: `src/app/api/chat/route.ts`

- [ ] **Step 1: Create `src/app/api/chat/route.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import type { LevelCode } from '@/lib/types'
import { getSystemPrompt } from '@/lib/prompts'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  const { messages, level, lessonId } = await req.json() as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
    level: LevelCode
    lessonId: number
  }

  const systemPrompt = getSystemPrompt(level, lessonId)

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(event.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  })
}
```

- [ ] **Step 2: Test the API manually**

Make sure you have `.env.local` with `ANTHROPIC_API_KEY=sk-ant-...`

Start dev server: `npm run dev`

Test with curl:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello, I am student"}],"level":"A1","lessonId":1}'
```
Expected: streaming text response with a greeting and possibly a grammar correction (missing "a" before "student").

- [ ] **Step 3: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat: streaming Anthropic chat API route with level/lesson system prompts"
```

---

## Task 6: UI Components — Shared/Primitive

**Files:**
- Create: `src/components/NavBar.tsx`
- Create: `src/components/ProgressBar.tsx`
- Create: `src/components/ErrorCorrection.tsx`

- [ ] **Step 1: Create `src/components/NavBar.tsx`**

```typescript
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavBarProps {
  levelCode?: string
  lessonId?: number
  lessonTitle?: string
}

export function NavBar({ levelCode, lessonId, lessonTitle }: NavBarProps) {
  return (
    <nav className="bg-navy-surface border-b border-navy-surface-2 px-4 py-3 flex items-center gap-3">
      <Link href="/" className="text-gold font-bold text-lg tracking-tight hover:text-gold-light transition-colors">
        Dalatech English
      </Link>
      {levelCode && (
        <>
          <span className="text-navy-surface-2">/</span>
          <Link
            href={`/level/${levelCode}`}
            className="text-text-secondary hover:text-text-primary transition-colors text-sm"
          >
            {levelCode}
          </Link>
        </>
      )}
      {lessonId && lessonTitle && (
        <>
          <span className="text-navy-surface-2">/</span>
          <span className="text-text-secondary text-sm truncate max-w-[160px]">
            Хичээл {lessonId}: {lessonTitle}
          </span>
        </>
      )}
    </nav>
  )
}
```

- [ ] **Step 2: Create `src/components/ProgressBar.tsx`**

```typescript
interface ProgressBarProps {
  completed: number
  total: number
  label?: string
}

export function ProgressBar({ completed, total, label }: ProgressBarProps) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs text-text-secondary mb-1">
          <span>{label}</span>
          <span>{completed}/{total}</span>
        </div>
      )}
      <div className="w-full h-2 bg-navy-surface-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-gold rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `src/components/ErrorCorrection.tsx`**

This component parses `<correction>...</correction>` XML tags from AI messages and renders them as a highlighted yellow box.

```typescript
interface ErrorCorrectionProps {
  content: string
}

export function parseCorrections(text: string): Array<{ type: 'text' | 'correction'; content: string }> {
  const parts: Array<{ type: 'text' | 'correction'; content: string }> = []
  const regex = /<correction>([\s\S]*?)<\/correction>/g
  let last = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: 'text', content: text.slice(last, match.index) })
    }
    parts.push({ type: 'correction', content: match[1].trim() })
    last = regex.lastIndex
  }
  if (last < text.length) {
    parts.push({ type: 'text', content: text.slice(last) })
  }
  return parts
}

export function ErrorCorrection({ content }: ErrorCorrectionProps) {
  const parts = parseCorrections(content)

  return (
    <div className="space-y-2">
      {parts.map((part, i) =>
        part.type === 'text' ? (
          <p key={i} className="whitespace-pre-wrap text-sm leading-relaxed">
            {part.content}
          </p>
        ) : (
          <div
            key={i}
            className="bg-amber-400/15 border border-amber-400/40 rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap"
          >
            {part.content}
          </div>
        )
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/NavBar.tsx src/components/ProgressBar.tsx src/components/ErrorCorrection.tsx
git commit -m "feat: NavBar, ProgressBar, and ErrorCorrection shared components"
```

---

## Task 7: ExamScore Component

**Files:**
- Create: `src/components/ExamScore.tsx`

- [ ] **Step 1: Create `src/components/ExamScore.tsx`**

This component parses `<exam-result>...</exam-result>` from AI messages to render a score card.

```typescript
'use client'
import type { LevelCode } from '@/lib/types'

interface ExamScoreProps {
  content: string
  level: LevelCode
  onPassConfirmed: (score: number) => void
}

interface ParsedResult {
  score?: number
  total?: number
  passed?: boolean
  feedback?: string
  certificate?: string
  grammar?: number
  style?: number
  cohesion?: number
  vocabulary?: number
  bonus?: number
}

export function parseExamResult(text: string): ParsedResult | null {
  const match = text.match(/<exam-result>([\s\S]*?)<\/exam-result>/)
  if (!match) return null
  const block = match[1]

  const get = (key: string) => {
    const m = new RegExp(`${key}:\\s*(.+)`, 'i').exec(block)
    return m?.[1]?.trim()
  }

  const scoreStr = get('SCORE') ?? get('TOTAL')
  const [scoreNum, totalNum] = scoreStr?.split('/') ?? []
  const passStr = get('PASS')

  return {
    score: scoreNum ? parseInt(scoreNum) : undefined,
    total: totalNum ? parseInt(totalNum) : undefined,
    passed: passStr?.toLowerCase() === 'true',
    feedback: get('FEEDBACK'),
    certificate: get('CERTIFICATE'),
    grammar: get('GRAMMAR') ? parseInt(get('GRAMMAR')!.split('/')[0]) : undefined,
    style: get('STYLE') ? parseInt(get('STYLE')!.split('/')[0]) : undefined,
    cohesion: get('COHESION') ? parseInt(get('COHESION')!.split('/')[0]) : undefined,
    vocabulary: get('VOCABULARY') ? parseInt(get('VOCABULARY')!.split('/')[0]) : undefined,
    bonus: get('BONUS') ? parseInt(get('BONUS')!) : undefined,
  }
}

export function ExamScore({ content, level, onPassConfirmed }: ExamScoreProps) {
  const result = parseExamResult(content)
  if (!result || result.score === undefined) return null

  const pct = result.total ? Math.round((result.score / result.total) * 100) : 0

  return (
    <div className="mt-4 bg-navy-surface border border-navy-surface-2 rounded-2xl p-5 space-y-4 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="text-3xl font-bold text-gold">{result.score}/{result.total ?? 15}</div>
        <div className="flex-1">
          <div className="w-full h-3 bg-navy-surface-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${result.passed ? 'bg-emerald-500' : 'bg-rose-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className={`text-xs mt-1 font-medium ${result.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
            {result.passed ? '✓ Тэнцсэн' : '✗ Тэнцээгүй'}
          </div>
        </div>
      </div>

      {/* C1 dimension breakdown */}
      {result.grammar !== undefined && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[['Дүрэм', result.grammar], ['Хэв шинж', result.style], ['Нэгдэл', result.cohesion], ['Үгийн сан', result.vocabulary]].map(([label, val]) => (
            <div key={label as string} className="bg-navy-surface-2 rounded-lg p-2 text-center">
              <div className="text-text-secondary text-xs">{label}</div>
              <div className="text-gold font-bold">{val}/5</div>
            </div>
          ))}
        </div>
      )}

      {result.certificate && (
        <div className="border border-gold/40 bg-gold/5 rounded-xl p-4 text-center">
          <div className="text-gold text-lg font-bold mb-2">🎓 Гэрчилгээ</div>
          <p className="text-sm text-text-primary">{result.certificate}</p>
        </div>
      )}

      {result.feedback && (
        <div className="text-sm text-text-secondary leading-relaxed">{result.feedback}</div>
      )}

      {result.passed && (
        <button
          onClick={() => onPassConfirmed(result.score!)}
          className="w-full py-3 bg-gold hover:bg-gold-dark text-navy font-bold rounded-xl transition-colors"
        >
          Дараагийн түвшин рүү →
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ExamScore.tsx
git commit -m "feat: ExamScore component with score parsing and certificate display"
```

---

## Task 8: ChatBubble + ChatInterface

**Files:**
- Create: `src/components/ChatBubble.tsx`
- Create: `src/components/ChatInterface.tsx`

- [ ] **Step 1: Create `src/components/ChatBubble.tsx`**

```typescript
import type { Message } from '@/lib/types'
import { ErrorCorrection } from './ErrorCorrection'

interface ChatBubbleProps {
  message: Message
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isAI = message.role === 'assistant'
  const hasCorrection = message.content.includes('<correction>')
  const hasExam = message.content.includes('<exam-result>')

  // Strip XML tags for the "no correction" display path
  const cleanContent = message.content
    .replace(/<correction>[\s\S]*?<\/correction>/g, '')
    .replace(/<exam-result>[\s\S]*?<\/exam-result>/g, '')
    .trim()

  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-3 animate-fade-in`}>
      {isAI && (
        <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-navy text-xs font-bold mr-2 flex-shrink-0 mt-1">
          AI
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isAI
            ? 'bg-navy-surface text-text-primary rounded-tl-sm'
            : 'bg-gold text-navy font-medium rounded-tr-sm'
        }`}
      >
        {isAI && (hasCorrection || hasExam) ? (
          <ErrorCorrection content={message.content} />
        ) : (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{cleanContent || message.content}</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/ChatInterface.tsx`**

```typescript
'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Message, LevelCode } from '@/lib/types'
import { getLessonMeta, getLevelMeta } from '@/lib/levels'
import { useProgress } from '@/hooks/useProgress'
import { ChatBubble } from './ChatBubble'
import { ExamScore, parseExamResult } from './ExamScore'
import { ProgressBar } from './ProgressBar'
import { NavBar } from './NavBar'

interface ChatInterfaceProps {
  level: LevelCode
  lessonId: number
}

export function ChatInterface({ level, lessonId }: ChatInterfaceProps) {
  const router = useRouter()
  const { completeLesson, passExam, getLevelProgress } = useProgress()
  const lessonMeta = getLessonMeta(level, lessonId)
  const levelMeta = getLevelMeta(level)
  const lp = getLevelProgress(level)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(lp.completedLessons.includes(lessonId))
  const [lastExamContent, setLastExamContent] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Initial greeting from AI
  useEffect(() => {
    if (messages.length === 0) {
      const greeting: Message = {
        id: 'init',
        role: 'assistant',
        content: `Сайн байна уу! Тавтай морилно уу — **${levelMeta?.label} · Хичээл ${lessonId}: ${lessonMeta?.titleMn}**\n\n${lessonMeta?.description}\n\nЭхэлцгээе! 🌟`,
        timestamp: Date.now(),
      }
      setMessages([greeting])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    const aiMsgId = `a-${Date.now()}`
    setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '', timestamp: Date.now() }])

    const abort = new AbortController()
    abortRef.current = abort

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, level, lessonId }),
        signal: abort.signal,
      })

      if (!res.body) throw new Error('No stream body')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullContent += chunk
        setMessages(prev =>
          prev.map(m => (m.id === aiMsgId ? { ...m, content: fullContent } : m))
        )
      }

      // Check if exam result is present
      if (fullContent.includes('<exam-result>')) {
        setLastExamContent(fullContent)
        const result = parseExamResult(fullContent)
        if (result?.passed) {
          // Will be handled by onPassConfirmed
        } else if (result && !result.passed) {
          // exam failed — don't mark complete yet
        } else {
          // Lesson 10 but weird format — still mark complete
          if (lessonMeta?.isExam) completeLesson(level, lessonId)
        }
      } else {
        // For non-exam lessons mark as complete after first meaningful exchange
        if (!lessonMeta?.isExam && !isComplete && newMessages.filter(m => m.role === 'user').length >= 1) {
          completeLesson(level, lessonId)
          setIsComplete(true)
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        setMessages(prev =>
          prev.map(m =>
            m.id === aiMsgId
              ? { ...m, content: 'Уучлаарай, алдаа гарлаа. Дахин оролдоно уу.' }
              : m
          )
        )
      }
    } finally {
      setIsLoading(false)
      abortRef.current = null
    }
  }, [input, isLoading, messages, level, lessonId, lessonMeta, isComplete, completeLesson])

  const handlePassConfirmed = useCallback((score: number) => {
    passExam(level, score)
    router.push(`/level/${level}`)
  }, [passExam, level, router])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  const progressCount = lp.completedLessons.length

  return (
    <div className="flex flex-col h-screen bg-navy">
      <NavBar levelCode={level} lessonId={lessonId} lessonTitle={lessonMeta?.titleMn} />
      
      {/* Progress bar */}
      <div className="px-4 py-2 bg-navy-surface border-b border-navy-surface-2">
        <ProgressBar completed={progressCount} total={10} label={`${level} дэвшил`} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.map(msg => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        {isLoading && messages[messages.length - 1]?.content === '' && (
          <div className="flex justify-start mb-3">
            <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-navy text-xs font-bold mr-2 flex-shrink-0">AI</div>
            <div className="bg-navy-surface rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-5">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-2 h-2 bg-gold rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Exam result card shown inline after score */}
        {lastExamContent && !isLoading && (
          <ExamScore
            content={lastExamContent}
            level={level}
            onPassConfirmed={handlePassConfirmed}
          />
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-4 py-3 bg-navy-surface border-t border-navy-surface-2">
        <div className="flex items-end gap-2 bg-navy rounded-2xl px-4 py-2 border border-navy-surface-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Энд бичнэ үү... (Enter = илгээх, Shift+Enter = шинэ мөр)"
            rows={1}
            className="flex-1 bg-transparent text-text-primary text-sm resize-none outline-none placeholder:text-text-secondary py-1 max-h-[120px]"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="w-9 h-9 bg-gold hover:bg-gold-dark disabled:opacity-40 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
          >
            <svg className="w-4 h-4 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-text-secondary text-center mt-1.5">
          Vocabulary дасгалын хувьд: &quot;Make a sentence with [word]&quot; гэж бичнэ үү
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ChatBubble.tsx src/components/ChatInterface.tsx
git commit -m "feat: ChatBubble and ChatInterface with streaming, corrections, and exam scoring"
```

---

## Task 9: LevelPage Component

**Files:**
- Create: `src/components/LevelPage.tsx`

- [ ] **Step 1: Create `src/components/LevelPage.tsx`**

```typescript
'use client'
import Link from 'next/link'
import { useProgress } from '@/hooks/useProgress'
import { getLevelMeta } from '@/lib/levels'
import { NavBar } from './NavBar'
import { ProgressBar } from './ProgressBar'
import type { LevelCode } from '@/lib/types'

interface LevelPageProps {
  levelCode: LevelCode
}

export function LevelPage({ levelCode }: LevelPageProps) {
  const { getLevelProgress, isLessonUnlocked } = useProgress()
  const meta = getLevelMeta(levelCode)
  const lp = getLevelProgress(levelCode)

  if (!meta) return <div className="p-8 text-center text-rose-400">Түвшин олдсонгүй</div>

  return (
    <div className="min-h-screen bg-navy">
      <NavBar levelCode={levelCode} />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gold mb-1">{meta.label}</h1>
          <p className="text-text-secondary text-sm">{meta.description}</p>
          <div className="mt-4">
            <ProgressBar
              completed={lp.completedLessons.length}
              total={10}
              label="Хичээлийн дэвшил"
            />
          </div>
        </div>

        <div className="space-y-3">
          {meta.lessons.map(lesson => {
            const unlocked = isLessonUnlocked(levelCode, lesson.id)
            const completed = lp.completedLessons.includes(lesson.id)

            return (
              <div
                key={lesson.id}
                className={`rounded-xl border transition-all ${
                  unlocked
                    ? 'bg-navy-surface border-navy-surface-2 hover:border-gold/40 cursor-pointer'
                    : 'bg-navy-surface/50 border-navy-surface-2/50 opacity-60 cursor-not-allowed'
                }`}
              >
                {unlocked ? (
                  <Link href={`/level/${levelCode}/lesson/${lesson.id}`} className="flex items-center gap-4 p-4">
                    <LessonIcon id={lesson.id} completed={completed} isExam={lesson.isExam} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-text-primary">{lesson.titleMn}</div>
                      <div className="text-xs text-text-secondary mt-0.5 truncate">{lesson.description}</div>
                    </div>
                    {completed && <span className="text-emerald-400 text-lg flex-shrink-0">✓</span>}
                    {!completed && <span className="text-gold text-sm flex-shrink-0">→</span>}
                  </Link>
                ) : (
                  <div className="flex items-center gap-4 p-4">
                    <LessonIcon id={lesson.id} completed={false} locked isExam={lesson.isExam} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-text-secondary">{lesson.titleMn}</div>
                      <div className="text-xs text-text-secondary/60 mt-0.5">Өмнөх хичээлийг дуусгана уу</div>
                    </div>
                    <span className="text-text-secondary/50 text-lg flex-shrink-0">🔒</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-8 bg-navy-surface border border-gold/20 rounded-xl p-4">
          <div className="text-gold text-sm font-semibold mb-2">📚 Үгийн сангийн дасгал</div>
          <p className="text-text-secondary text-xs">Аль ч хичээлийн дотор "Make a sentence with [word]" гэж бичвэл AI тухайн үгийг ашиглан өгүүлбэр гарган өгнө.</p>
        </div>
      </div>
    </div>
  )
}

function LessonIcon({ id, completed, locked, isExam }: { id: number; completed: boolean; locked?: boolean; isExam: boolean }) {
  if (isExam) {
    return (
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${completed ? 'bg-gold' : 'bg-navy-surface-2'}`}>
        {completed ? '🏆' : locked ? '🔒' : '📝'}
      </div>
    )
  }
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
      completed ? 'bg-emerald-600 text-white' : locked ? 'bg-navy-surface-2 text-text-secondary' : 'bg-gold/20 text-gold'
    }`}>
      {id}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/LevelPage.tsx
git commit -m "feat: LevelPage with lesson grid, lock/unlock state, and progress"
```

---

## Task 10: LevelSelector + LandingPage

**Files:**
- Create: `src/components/LevelSelector.tsx`
- Create: `src/components/LandingPage.tsx`

- [ ] **Step 1: Create `src/components/LevelSelector.tsx`**

```typescript
'use client'
import Link from 'next/link'
import { useProgress } from '@/hooks/useProgress'
import { LEVELS } from '@/lib/levels'
import type { LevelCode } from '@/lib/types'

export function LevelSelector() {
  const { isLevelUnlocked, getLevelProgress } = useProgress()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {LEVELS.map(level => {
        const unlocked = isLevelUnlocked(level.code as LevelCode)
        const lp = getLevelProgress(level.code as LevelCode)
        const pct = Math.round((lp.completedLessons.length / 10) * 100)

        return (
          <div
            key={level.code}
            className={`relative rounded-2xl overflow-hidden border transition-all duration-200 ${
              unlocked
                ? 'border-navy-surface-2 hover:border-gold/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] cursor-pointer'
                : 'border-navy-surface-2/50 opacity-60 cursor-not-allowed'
            }`}
          >
            {unlocked ? (
              <Link href={`/level/${level.code}`} className="block">
                <LevelCardContent level={level} pct={pct} examPassed={lp.examPassed} />
              </Link>
            ) : (
              <LevelCardContent level={level} pct={pct} locked examPassed={false} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function LevelCardContent({
  level,
  pct,
  locked,
  examPassed,
}: {
  level: (typeof LEVELS)[0]
  pct: number
  locked?: boolean
  examPassed: boolean
}) {
  return (
    <div className={`bg-gradient-to-br ${level.color} p-0.5 rounded-2xl`}>
      <div className="bg-navy rounded-[14px] p-5 h-full">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xl font-bold text-gold">{level.code}</div>
            <div className="text-sm font-medium text-text-primary mt-0.5">{level.label.split(' — ')[1]}</div>
          </div>
          <div className="text-2xl">{locked ? '🔒' : examPassed ? '🏆' : '📖'}</div>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed mb-4">{level.description}</p>
        <div className="w-full h-1.5 bg-navy-surface-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gold rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-text-secondary mt-1.5">
          <span>{pct}% дууссан</span>
          <span>10 хичээл</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/LandingPage.tsx`**

```typescript
'use client'
import { LevelSelector } from './LevelSelector'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-navy">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-navy-surface/30" />
        <div className="relative max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 text-gold text-sm font-medium mb-6">
            🤖 Claude AI-аар тэжээгддэг
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
            Dalatech{' '}
            <span className="text-gold">English</span>
          </h1>
          <p className="text-lg sm:text-xl text-text-secondary max-w-xl mx-auto mb-3">
            Монгол хэлтнүүдэд зориулсан AI англи хэлний сургалт
          </p>
          <p className="text-base text-text-secondary/80 max-w-lg mx-auto mb-8">
            А1-ээс С1 хүртэл — таны алдааг монгол хэлээр тайлбарлан, дэвшлийг хянан, шалгалт өгч дараагийн түвшин рүү ахина.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mb-12">
            {[
              { icon: '🧠', text: 'Монгол тайлбар' },
              { icon: '✏️', text: 'Алдаа засах' },
              { icon: '📊', text: 'Дэвшил хянах' },
              { icon: '🏆', text: 'Шалгалтаар ахих' },
            ].map(f => (
              <div key={f.text} className="bg-navy-surface border border-navy-surface-2 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">{f.icon}</div>
                <div className="text-xs text-text-secondary">{f.text}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Levels */}
      <main className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-xl font-bold text-text-primary mb-6">
          Түвшин сонгох
        </h2>
        <LevelSelector />

        {/* How it works */}
        <section className="mt-16">
          <h2 className="text-xl font-bold text-text-primary mb-6">Хэрхэн ажилладаг вэ?</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { step: '01', title: 'Хичээл нээнэ', desc: 'А1-ээс эхлэн тус бүрийг дараалан нээнэ. Шалгалтаар тэнцвэл дараагийн түвшин нээгдэнэ.' },
              { step: '02', title: 'AI-тай ярилцана', desc: 'Та англиар бичиж, AI алдааг монгол хэлээр тайлбарлан засна. Зөв бичвэл магтаал авна.' },
              { step: '03', title: 'Ахина', desc: '10-р хичээл бол шалгалт — 15 оноогоос 10+ авбал дараагийн түвшин нээгдэнэ.' },
            ].map(s => (
              <div key={s.step} className="bg-navy-surface border border-navy-surface-2 rounded-xl p-5">
                <div className="text-gold text-3xl font-bold mb-3">{s.step}</div>
                <div className="font-semibold text-text-primary mb-2">{s.title}</div>
                <p className="text-text-secondary text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-navy-surface-2 py-6 text-center text-xs text-text-secondary">
        Powered by{' '}
        <a href="https://dalatech.ai" className="text-gold hover:underline">Dalatech.ai</a>
        {' '}· Built with Claude claude-sonnet-4-6
      </footer>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/LevelSelector.tsx src/components/LandingPage.tsx
git commit -m "feat: LevelSelector cards and LandingPage with Mongolian hero section"
```

---

## Task 11: Next.js Pages (App Router)

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/level/[level]/page.tsx`
- Create: `src/app/level/[level]/lesson/[lesson]/page.tsx`

- [ ] **Step 1: Replace `src/app/page.tsx`**

```typescript
import { LandingPage } from '@/components/LandingPage'

export default function Home() {
  return <LandingPage />
}
```

- [ ] **Step 2: Create `src/app/level/[level]/page.tsx`**

```typescript
import { LevelPage } from '@/components/LevelPage'
import { LEVEL_CODES } from '@/lib/levels'
import type { LevelCode } from '@/lib/types'
import { notFound } from 'next/navigation'

interface Props {
  params: { level: string }
}

export function generateStaticParams() {
  return LEVEL_CODES.map(code => ({ level: code }))
}

export default function LevelRoute({ params }: Props) {
  if (!LEVEL_CODES.includes(params.level as LevelCode)) notFound()
  return <LevelPage levelCode={params.level as LevelCode} />
}
```

- [ ] **Step 3: Create `src/app/level/[level]/lesson/[lesson]/page.tsx`**

```typescript
import { ChatInterface } from '@/components/ChatInterface'
import { LEVEL_CODES, getLevelMeta } from '@/lib/levels'
import type { LevelCode } from '@/lib/types'
import { notFound } from 'next/navigation'

interface Props {
  params: { level: string; lesson: string }
}

export function generateStaticParams() {
  const params: Array<{ level: string; lesson: string }> = []
  for (const code of LEVEL_CODES) {
    for (let i = 1; i <= 10; i++) {
      params.push({ level: code, lesson: String(i) })
    }
  }
  return params
}

export default function LessonRoute({ params }: Props) {
  const levelCode = params.level as LevelCode
  const lessonId = parseInt(params.lesson)
  if (!LEVEL_CODES.includes(levelCode) || isNaN(lessonId) || lessonId < 1 || lessonId > 10) notFound()
  const meta = getLevelMeta(levelCode)
  if (!meta?.lessons.find(l => l.id === lessonId)) notFound()

  return <ChatInterface level={levelCode} lessonId={lessonId} />
}
```

- [ ] **Step 4: Update `next.config.js` to allow dynamic API routes (needed for streaming)**

Read the existing next.config.js and replace:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = nextConfig
```

- [ ] **Step 5: Verify the full app in browser**

```bash
npm run dev
```

Open `http://localhost:3000` — should see the landing page with Mongolian text and 5 level cards (only A1 unlocked).
Navigate to `/level/A1` — should see 10 lessons with lesson 1 unlocked.
Navigate to `/level/A1/lesson/1` — should see chat interface with greeting message.
Type a message — should see AI response streaming in.

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx src/app/level src/app/level
git commit -m "feat: Next.js App Router pages for landing, level overview, and chat lessons"
```

---

## Task 12: README + Deployment

**Files:**
- Create: `README.md`
- Create: `vercel.json` (already done in Task 1, verify contents)

- [ ] **Step 1: Create `README.md`**

```markdown
# Dalatech English — AI English Tutor for Mongolian Speakers

A1 to C1 level English tutoring powered by Claude claude-sonnet-4-6, built for Mongolian native speakers.

## Deploy to Vercel (Free)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Add environment variable: `ANTHROPIC_API_KEY` = your Anthropic API key
4. Deploy — you get a free URL like `dalatech-english.vercel.app`

## Local Development

```bash
cp .env.local.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY

npm install
npm run dev
# Open http://localhost:3000
```

## Features

- 5 levels: A1, A2, B1, B2, C1
- 10 lessons per level + vocabulary practice in each
- Level 10 exam required to unlock next level
- Grammar corrections shown in Mongolian with yellow highlight
- All progress stored in localStorage (no sign-up required)
- Streaming AI responses via Claude claude-sonnet-4-6

## Stack

- Next.js 14 (App Router)
- TypeScript + Tailwind CSS
- Anthropic SDK (streaming)
- localStorage for progress
```

- [ ] **Step 2: Final type-check + build**

```bash
npm run build
```

Expected: successful build with no TypeScript errors. If errors appear, fix them before deploying.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "feat: README with deployment instructions"
```

---

## Self-Review Checklist

**Spec Coverage:**
- [x] Landing page in Mongolian — LandingPage.tsx
- [x] 5 levels A1–C1 with 10 lessons each — levels.ts
- [x] Level 10 exam with score + unlock next level — ExamScore.tsx + storage.ts
- [x] Chat interface (WhatsApp style, AI left, user right) — ChatBubble.tsx
- [x] Yellow error correction box — ErrorCorrection.tsx (`<correction>` XML tags)
- [x] Progress bar — ProgressBar.tsx
- [x] Score display at exam end — ExamScore.tsx with `<exam-result>` parsing
- [x] Mongolian UI labels — throughout all components
- [x] Mobile-first responsive — Tailwind classes
- [x] Deep navy + gold color scheme — globals.css + tailwind.config.ts
- [x] Level lock/unlock system — storage.ts + LevelSelector.tsx
- [x] Vocabulary practice mode — prompts.ts VOCAB section
- [x] localStorage progress — storage.ts
- [x] Vercel deployment config — vercel.json + README
- [x] ANTHROPIC_API_KEY env var — .env.local.example + route.ts
- [x] All 5 level system prompts — prompts.ts
- [x] All 50 lesson-specific instructions — prompts.ts LESSON_ADDENDUM
- [x] "Powered by Dalatech.ai" footer — LandingPage.tsx
- [x] App name "Dalatech English" — layout.tsx + NavBar.tsx

**Type Consistency:**
- `LevelCode` = `'A1' | 'A2' | 'B1' | 'B2' | 'C1'` — defined in types.ts, used consistently
- `Message` interface used in ChatInterface and ChatBubble
- `AppProgress` used in storage.ts and useProgress.ts
- `parseExamResult` exported from ExamScore.tsx, imported in ChatInterface.tsx ✓
- `parseCorrections` exported from ErrorCorrection.tsx, used in ErrorCorrection component internally ✓

**No Placeholders:** All code blocks are complete implementations. No TBD, TODO, or "fill in" comments.
