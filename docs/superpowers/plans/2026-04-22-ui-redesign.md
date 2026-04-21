# UI Redesign — Premium Navy & Gold Design System

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply a premium design system (deep navy, gold accents, animated orbs, gradient borders, card hover effects) consistently across Landing, Level Selection, Chat, and Profile pages.

**Architecture:** globals.css gets new design utilities. Each component is rewritten in place — no new files. Profile page builds on the bug-fix plan (Task 3 from Plan E must be done first, or do that profile task here and skip Plan E Task 3). All user-facing text stays in Mongolian. No existing logic is changed — only styles.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, CSS custom properties

**Prerequisite:** `2026-04-22-bug-fixes-and-history.md` Tasks 1–5 should be done first, or do profile changes here instead.

---

## File Map

| File | Change |
|---|---|
| `src/app/globals.css` | Add radial bg, shadow-gold, page-enter-up, gold-border gradient |
| `src/components/LandingPage.tsx` | Full hero redesign: orb, gradient title, stat badges, features, redesigned CTA |
| `src/components/LevelSelector.tsx` | Premium level cards with hover glow |
| `src/components/LevelPage.tsx` | Accent card mode selection, fade-in-up mount |
| `src/components/ChatBubble.tsx` | AI: navy + gold left border; User: gold gradient bg |
| `src/components/ChatInterface.tsx` | Gold input ring, gold send button, typing indicator redesign |
| `src/app/profile/page.tsx` | Premium stats hero, cert grid with gold hover, section headings |

---

## Task 1: Update globals.css with premium design utilities

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --navy: #0F172A;
  --gold: #F59E0B;
  --gold-light: #FCD34D;
  --gold-dark: #D97706;
  --navy-surface: #1E293B;
  --navy-surface-2: #334155;
  --text-primary: #F8FAFC;
  --text-secondary: #CBD5E1;
  --text-muted: #64748B;
}

html {
  -webkit-tap-highlight-color: transparent;
}

body {
  background-color: var(--navy);
  background-image: radial-gradient(ellipse 80% 60% at 50% 0%, #1a2744 0%, #0F172A 70%);
  color: var(--text-primary);
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px;
  overflow-x: hidden;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--navy-surface); }
::-webkit-scrollbar-thumb { background: var(--navy-surface-2); border-radius: 3px; }

/* Input area: base padding + iOS/Android safe area inset */
.pb-input-area {
  padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
}

/* Dynamic viewport height */
.h-dvh {
  height: 100vh;
  height: 100dvh;
}

/* Page fade-in (existing) */
.page-enter {
  animation: pageFadeIn 0.25s ease-out both;
}

@keyframes pageFadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Premium page fade-in-up */
.page-enter-up {
  animation: pageFadeInUp 0.4s ease-out both;
}

@keyframes pageFadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Gold glow shadow */
.shadow-gold {
  box-shadow: 0 8px 32px rgba(245, 158, 11, 0.15);
}

.shadow-gold-sm {
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.2);
}

/* Gold gradient border card */
.card-gold-border {
  background: linear-gradient(#1E293B, #1E293B) padding-box,
              linear-gradient(135deg, #F59E0B, #FCD34D) border-box;
  border: 1px solid transparent;
  border-radius: 16px;
}

/* Pulsing orb animation */
@keyframes orbPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
  50%       { transform: translate(-50%, -50%) scale(1.08); opacity: 0.6; }
}

.orb-pulse {
  animation: orbPulse 6s ease-in-out infinite;
}

/* Animate bounce dots (used in loading spinners) */
@keyframes bounceDot {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}
```

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```

Expected: zero errors (CSS changes don't affect TypeScript).

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: premium design system utilities in globals.css"
```

---

## Task 2: Redesign LandingPage

**Files:**
- Modify: `src/components/LandingPage.tsx`

- [ ] **Step 1: Replace LandingPage.tsx**

```typescript
'use client'
import { LevelSelector } from './LevelSelector'
import { DailyChallenge } from './DailyChallenge'
import { NavBar } from './NavBar'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-navy">
      <NavBar />

      {/* ─── Hero ─── */}
      <header className="relative overflow-hidden min-h-[88vh] flex flex-col items-center justify-center">
        {/* Animated background orb */}
        <div
          className="absolute top-1/3 left-1/2 orb-pulse pointer-events-none"
          style={{
            width: 700,
            height: 400,
            background: 'radial-gradient(ellipse, rgba(245,158,11,0.12) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        <div className="relative max-w-3xl mx-auto px-4 pt-10 pb-16 text-center page-enter-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/25 rounded-full px-4 py-1.5 text-gold text-xs font-semibold mb-8 tracking-wide uppercase">
            ✨ AI-д суурилсан сургалт
          </div>

          {/* Title */}
          <h1
            className="font-extrabold mb-5 leading-none tracking-tight"
            style={{ fontSize: 'clamp(48px, 8vw, 80px)' }}
          >
            <span
              style={{
                background: 'linear-gradient(135deg, #F59E0B, #FCD34D)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Core
            </span>
            <span className="text-white"> English</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-text-secondary max-w-xl mx-auto mb-8 leading-relaxed" style={{ color: '#CBD5E1' }}>
            Монгол хэлтнүүдэд зориулсан AI-д суурилсан Англи хэлний дэлхийн стандартын сургалт
          </p>

          {/* Stat badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {[
              { icon: '📚', label: '5 Түвшин' },
              { icon: '✏️', label: '50+ Хичээл' },
              { icon: '🎯', label: 'IELTS Бэлтгэл' },
            ].map(s => (
              <div
                key={s.label}
                className="flex items-center gap-2 border border-gold/30 bg-gold/5 rounded-full px-4 py-2 text-sm text-gold font-medium"
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <a
            href="#levels"
            className="inline-flex items-center gap-2 font-bold text-navy py-4 px-8 rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-gold-sm"
            style={{
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              fontSize: 16,
            }}
          >
            Сургалт эхлэх →
          </a>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-text-secondary/40 text-xs animate-bounce">
          <span>↓</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-16">
        {/* Daily Challenge */}
        <div className="mb-10 page-enter-up" style={{ animationDelay: '0.1s' }}>
          <DailyChallenge />
        </div>

        {/* Features */}
        <section className="mb-14 page-enter-up" style={{ animationDelay: '0.15s' }}>
          <h2
            className="text-xl font-bold mb-2 text-center"
            style={{ color: '#F59E0B', letterSpacing: '-0.02em' }}
          >
            Яагаад Core English?
          </h2>
          <p className="text-text-secondary text-sm text-center mb-8">Дэлхийн стандартын сургалтыг монгол хэлтнүүдэд ойлгомжтойгоор</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: '🤖',
                title: 'AI Багш',
                desc: 'Хувийн AI багш таны алдааг тэр даруй засна. Монгол хэлээр тайлбар авна.',
              },
              {
                icon: '📊',
                title: 'Дэвшлийн хяналт',
                desc: 'Streak, оноо, гэрчилгээгээр дэвшлээ хяна. Профайлд бүх үр дүнгээ хар.',
              },
              {
                icon: '🎯',
                title: 'IELTS Бэлтгэл',
                desc: 'Жинхэнэ IELTS шалгалтад бэлд. 4 хэсэгтэй дадлага тест ба band оноо.',
              },
            ].map(f => (
              <div
                key={f.title}
                className="bg-navy-surface border border-gold/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 hover:shadow-gold"
              >
                <div className="w-11 h-11 rounded-xl bg-gold/10 flex items-center justify-center text-2xl mb-4">
                  {f.icon}
                </div>
                <h3 className="font-bold text-text-primary mb-2" style={{ letterSpacing: '-0.02em' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#CBD5E1' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Level selector */}
        <section id="levels" className="page-enter-up" style={{ animationDelay: '0.2s' }}>
          <h2
            className="text-xl font-bold mb-2"
            style={{ letterSpacing: '-0.02em' }}
          >
            <span className="text-gold">▎</span> Түвшин сонгох
          </h2>
          <p className="text-sm mb-6" style={{ color: '#64748B' }}>
            А1-ээс С1 хүртэл — тэнцсэн тестийн дараа дараагийн түвшин нээгдэнэ
          </p>
          <LevelSelector />
        </section>
      </main>

      <footer className="border-t border-navy-surface-2 py-6 text-center text-xs" style={{ color: '#64748B' }}>
        Powered by{' '}
        <a href="https://dalatech.online/" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
          Dalatech.ai
        </a>
      </footer>
    </div>
  )
}
```

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/LandingPage.tsx
git commit -m "feat: premium landing page redesign — animated orb hero, stat badges, features grid"
```

---

## Task 3: Redesign LevelSelector cards

**Files:**
- Modify: `src/components/LevelSelector.tsx`

- [ ] **Step 1: Replace LevelSelector.tsx**

```typescript
'use client'
import Link from 'next/link'
import { useProgress } from '@/hooks/useProgress'
import { LEVELS } from '@/lib/levels'
import type { LevelCode } from '@/lib/types'

export function LevelSelector() {
  const { getLevelProgress } = useProgress()

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {LEVELS.map((level, idx) => {
        const lp = getLevelProgress(level.code as LevelCode)
        const completed = lp.completedLessons.length
        const pct = Math.round((completed / 10) * 100)

        return (
          <Link
            key={level.code}
            href={`/level/${level.code}`}
            className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-gold"
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            {/* Gold gradient border */}
            <div
              style={{
                background: lp.examPassed
                  ? 'linear-gradient(#1E293B, #1E293B) padding-box, linear-gradient(135deg, #F59E0B, #FCD34D) border-box'
                  : undefined,
                border: lp.examPassed ? '1px solid transparent' : '1px solid rgba(245,158,11,0.12)',
                borderRadius: 16,
              }}
              className={`h-full ${!lp.examPassed ? 'bg-navy-surface' : ''}`}
            >
              <div className="p-4 flex flex-col h-full relative overflow-hidden">
                {/* Subtle diagonal pattern */}
                <div
                  className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{
                    backgroundImage: `repeating-linear-gradient(45deg, #F59E0B 0, #F59E0B 1px, transparent 0, transparent 50%)`,
                    backgroundSize: '12px 12px',
                  }}
                />

                {/* Level code */}
                <div
                  className="text-4xl font-extrabold leading-none mb-1 relative"
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B, #FCD34D)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {level.code}
                </div>

                {/* Level name */}
                <div className="text-xs font-semibold text-text-primary mb-3 leading-tight relative">
                  {level.label.split(' — ')[1]}
                </div>

                {/* Badge row */}
                <div className="flex items-center justify-between mb-2 relative">
                  <span className="text-xs" style={{ color: '#64748B' }}>
                    {completed}/10
                  </span>
                  <span className="text-xl">{lp.examPassed ? '🏆' : '📖'}</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-navy-surface-2 rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background: 'linear-gradient(90deg, #F59E0B, #FCD34D)',
                    }}
                  />
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/LevelSelector.tsx
git commit -m "feat: premium level selector cards — gradient border, gold text, pattern overlay"
```

---

## Task 4: Redesign LevelPage mode selection

**Files:**
- Modify: `src/components/LevelPage.tsx`

- [ ] **Step 1: Replace LevelPage.tsx**

```typescript
'use client'
import Link from 'next/link'
import { useProgress } from '@/hooks/useProgress'
import { getLevelMeta } from '@/lib/levels'
import { NavBar } from './NavBar'
import { ProgressBar } from './ProgressBar'
import { t } from '@/lib/i18n'
import type { LevelCode } from '@/lib/types'

interface LevelPageProps {
  levelCode: LevelCode
}

export function LevelPage({ levelCode }: LevelPageProps) {
  const { getLevelProgress } = useProgress()
  const meta = getLevelMeta(levelCode)
  const lp = getLevelProgress(levelCode)

  if (!meta) return <div className="p-8 text-center text-rose-400">Түвшин олдсонгүй</div>

  return (
    <div className="min-h-screen bg-navy">
      <NavBar levelCode={levelCode} />
      <div className="max-w-2xl mx-auto px-4 py-8 page-enter-up">

        {/* Level hero */}
        <div className="text-center mb-8">
          <div
            className="text-7xl font-extrabold leading-none mb-2"
            style={{
              background: 'linear-gradient(135deg, #F59E0B, #FCD34D)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.03em',
            }}
          >
            {levelCode}
          </div>
          <h1 className="text-xl font-bold text-text-primary mb-1">{meta.label.split(' — ')[1]}</h1>
          <p className="text-sm mb-4" style={{ color: '#CBD5E1' }}>{meta.description}</p>
          <div className="max-w-xs mx-auto">
            <ProgressBar
              completed={lp.completedLessons.length}
              total={10}
              label="Хичээлийн дэвшил"
            />
          </div>
        </div>

        {/* Mode cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {/* Free Chat */}
          <Link
            href={`/level/${levelCode}/chat`}
            className="group block rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-gold"
            style={{
              background: 'linear-gradient(#1E293B, #1E293B) padding-box, linear-gradient(135deg, #F59E0B44, #F59E0B22) border-box',
              border: '1px solid transparent',
            }}
          >
            <div className="text-4xl mb-3">💬</div>
            <h2 className="text-lg font-bold text-gold mb-2 group-hover:text-gold-light transition-colors" style={{ letterSpacing: '-0.02em' }}>
              {t('freeChat')}
            </h2>
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#CBD5E1' }}>
              {t('freeChatDesc')}
            </p>
            <div
              className="inline-flex items-center gap-2 font-semibold text-navy text-sm py-2 px-4 rounded-xl transition-all group-hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
            >
              Эхлэх <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          {/* Quiz */}
          <Link
            href={`/level/${levelCode}/quiz`}
            className="group block rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-gold"
            style={{
              background: 'linear-gradient(#1E293B, #1E293B) padding-box, linear-gradient(135deg, #F59E0B44, #F59E0B22) border-box',
              border: '1px solid transparent',
            }}
          >
            <div className="text-4xl mb-3">📝</div>
            <h2 className="text-lg font-bold text-gold mb-2 group-hover:text-gold-light transition-colors" style={{ letterSpacing: '-0.02em' }}>
              {t('quiz')}
            </h2>
            <p className="text-sm leading-relaxed mb-1" style={{ color: '#CBD5E1' }}>
              {t('quizDesc')}
            </p>
            <p className="text-xs mb-4" style={{ color: '#64748B' }}>
              15 тест · 2 уншлага · 1 бичих · 18/25 тэнцэх
            </p>
            <div
              className="inline-flex items-center gap-2 font-semibold text-navy text-sm py-2 px-4 rounded-xl transition-all group-hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
            >
              Тест өгөх <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        </div>

        {/* Lesson list */}
        <details className="bg-navy-surface border border-navy-surface-2 rounded-xl overflow-hidden">
          <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-text-secondary hover:text-text-primary transition-colors list-none flex items-center justify-between">
            <span>📚 {t('lessons')} ({lp.completedLessons.length}/10 дууссан)</span>
            <span className="text-xs text-text-secondary/60">▼</span>
          </summary>
          <div className="border-t border-navy-surface-2 divide-y divide-navy-surface-2/50">
            {meta.lessons.map(lesson => {
              const completed = lp.completedLessons.includes(lesson.id)
              return (
                <Link
                  key={lesson.id}
                  href={`/level/${levelCode}/lesson/${lesson.id}`}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-navy-surface-2/30 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    completed ? 'bg-emerald-600 text-white' : lesson.isExam ? 'bg-navy-surface-2 text-text-secondary' : 'bg-gold/20 text-gold'
                  }`}>
                    {lesson.isExam ? (completed ? '🏆' : '📝') : lesson.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text-primary truncate">{lesson.titleMn}</div>
                  </div>
                  {completed && <span className="text-emerald-400 text-sm flex-shrink-0">✓</span>}
                </Link>
              )
            })}
          </div>
        </details>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/LevelPage.tsx
git commit -m "feat: premium level page — gradient hero, accent mode cards, gold CTA buttons"
```

---

## Task 5: Redesign ChatBubble + ChatInterface input area

**Files:**
- Modify: `src/components/ChatBubble.tsx`
- Modify: `src/components/ChatInterface.tsx` (input wrapper and send button only)

- [ ] **Step 1: Replace ChatBubble.tsx**

```typescript
'use client'
import type { Message } from '@/lib/types'
import { ErrorCorrection } from './ErrorCorrection'
import { PronunciationHint } from './PronunciationHint'
import { speakText } from '@/lib/pronunciation'

interface ChatBubbleProps {
  message: Message
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isAI = message.role === 'assistant'
  const hasCorrection = message.content.includes('<correction>')

  const cleanContent = message.content
    .replace(/<correction>[\s\S]*?<\/correction>/g, '')
    .replace(/<exam-result>[\s\S]*?<\/exam-result>/g, '')
    .trim()

  const hasEnglish = /[a-zA-Z]{3,}/.test(cleanContent)

  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-3 animate-fade-in`}>
      {isAI && (
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-navy text-xs font-bold mr-2 flex-shrink-0 mt-1"
          style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
        >
          AI
        </div>
      )}
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${isAI ? 'rounded-tl-sm' : 'rounded-tr-sm'}`}
        style={
          isAI
            ? {
                background: '#1E293B',
                borderLeft: '3px solid #F59E0B',
                color: '#F8FAFC',
              }
            : {
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                color: '#0F172A',
                fontWeight: 500,
              }
        }
      >
        {isAI && hasEnglish && (
          <div className="flex justify-end mb-1">
            <button
              onClick={() => speakText(cleanContent)}
              className="text-text-secondary hover:text-gold transition-colors text-sm"
              title="Англиар уншуулах"
            >
              🔊
            </button>
          </div>
        )}
        {isAI && hasCorrection ? (
          <ErrorCorrection content={message.content} />
        ) : (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{cleanContent || message.content}</p>
        )}
        {isAI && hasEnglish && (
          <PronunciationHint content={cleanContent} />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update ChatInterface send button and input area**

In `src/components/ChatInterface.tsx`, find the textarea + send button wrapper. The current code has the input area at the bottom. Find and replace the textarea and send button block:

Find this block (the input container at the bottom of ChatInterface):
```tsx
      <div className="border-t border-navy-surface-2 bg-navy-surface pb-input-area">
        <div className="max-w-2xl mx-auto px-3 pt-3">
          <div className="flex items-end gap-2">
            <textarea
```

Replace the outer wrapper div opening line only — change the class to add better styling:
```tsx
      <div className="border-t border-navy-surface-2 bg-navy pb-input-area">
        <div className="max-w-2xl mx-auto px-3 pt-3">
          <div className="flex items-end gap-2">
            <textarea
```

Then find the send button:
```tsx
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="flex-shrink-0 w-11 h-11 rounded-xl bg-gold hover:bg-gold-dark disabled:opacity-40 disabled:cursor-not-allowed text-navy font-bold transition-colors flex items-center justify-center text-lg"
            >
              ↑
            </button>
```

Replace with:
```tsx
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="flex-shrink-0 w-11 h-11 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed text-navy font-bold transition-all hover:-translate-y-0.5 flex items-center justify-center text-lg"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
            >
              ↑
            </button>
```

Also find the textarea class and add a gold focus ring:
```tsx
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isComplete ? 'Дахин ярих...' : 'Англиар бичнэ үү...'}
              rows={1}
              className="flex-1 bg-navy-surface border border-navy-surface-2 focus:border-gold/50 focus:ring-1 focus:ring-gold/20 rounded-xl px-4 py-3 text-text-primary text-sm resize-none outline-none transition-colors min-h-[44px] max-h-36 placeholder:text-text-secondary/50"
              style={{ lineHeight: '1.5' }}
            />
```

- [ ] **Step 3: Run type check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ChatBubble.tsx src/components/ChatInterface.tsx
git commit -m "feat: premium chat bubbles — gold left border for AI, gradient bg for user"
```

---

## Task 6: Redesign Profile page (premium look)

**Files:**
- Modify: `src/app/profile/page.tsx`

This builds on the bug-fix plan version. If Plan E Task 3 has already been done, replace the file below. If not, this task replaces Plan E Task 3 entirely (include both logic and visual changes).

- [ ] **Step 1: Replace profile/page.tsx with premium version**

```typescript
'use client'
import { useState, useEffect } from 'react'
import { NavBar } from '@/components/NavBar'
import { CertificateModal } from '@/components/CertificateModal'
import { loadCertificates, formatMongolianDate, type CertificateEntry } from '@/lib/certificates'
import { loadTestHistory, type TestHistoryEntry } from '@/lib/testHistory'
import { loadStreak } from '@/lib/streak'
import { loadIELTSResults, type IELTSResult } from '@/lib/ielts'
import { t } from '@/lib/i18n'

export default function ProfilePage() {
  const [certs, setCerts] = useState<CertificateEntry[]>([])
  const [testHistory, setTestHistory] = useState<TestHistoryEntry[]>([])
  const [ieltsHistory, setIeltsHistory] = useState<IELTSResult[]>([])
  const [streak, setStreak] = useState({ current: 0, longest: 0 })
  const [selectedCert, setSelectedCert] = useState<CertificateEntry | null>(null)

  useEffect(() => {
    setCerts(loadCertificates())
    setTestHistory(loadTestHistory())
    setIeltsHistory(loadIELTSResults())
    const s = loadStreak()
    setStreak({ current: s.current, longest: s.longest })
  }, [])

  return (
    <div className="min-h-screen bg-navy">
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 page-enter-up">

        {/* Stats hero row */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div
            className="rounded-2xl p-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-gold"
            style={{
              background: 'linear-gradient(#1E293B, #1E293B) padding-box, linear-gradient(135deg, #F59E0B66, #F59E0B22) border-box',
              border: '1px solid transparent',
            }}
          >
            <div className="text-3xl mb-1">🔥</div>
            <div className="text-3xl font-extrabold text-gold" style={{ letterSpacing: '-0.03em' }}>{streak.current}</div>
            <div className="text-xs mt-1" style={{ color: '#64748B' }}>Одоогийн streak</div>
          </div>
          <div
            className="rounded-2xl p-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-gold"
            style={{
              background: 'linear-gradient(#1E293B, #1E293B) padding-box, linear-gradient(135deg, #F59E0B66, #F59E0B22) border-box',
              border: '1px solid transparent',
            }}
          >
            <div className="text-3xl mb-1">⭐</div>
            <div className="text-3xl font-extrabold text-gold" style={{ letterSpacing: '-0.03em' }}>{streak.longest}</div>
            <div className="text-xs mt-1" style={{ color: '#64748B' }}>Хамгийн урт streak</div>
          </div>
        </div>

        {/* Certificates */}
        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <span className="text-gold">▎</span> 🎓 {t('certificates')}
        </h2>

        {certs.length === 0 ? (
          <div className="text-center py-10 mb-8 bg-navy-surface border border-navy-surface-2 rounded-2xl">
            <div className="text-4xl mb-3">🎓</div>
            <p className="text-sm text-text-secondary">{t('noCertificates')}</p>
            <p className="text-xs mt-2" style={{ color: '#64748B' }}>Тест өгч 18/25 аваад гэрчилгээ аваарай!</p>
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {certs.map(cert => (
              <button
                key={cert.id}
                onClick={() => setSelectedCert(cert)}
                className="w-full rounded-xl p-4 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-gold text-left"
                style={{
                  background: 'linear-gradient(#1E293B, #1E293B) padding-box, linear-gradient(135deg, #F59E0B, #FCD34D) border-box',
                  border: '1px solid transparent',
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-navy"
                  style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
                >
                  {cert.level}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-text-primary text-sm" style={{ letterSpacing: '-0.01em' }}>
                    {cert.level} Тест гэрчилгээ
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                    {cert.score}/{cert.total} оноо · {formatMongolianDate(cert.date)}
                  </div>
                </div>
                <div className="text-gold text-xs font-semibold flex-shrink-0">Харах →</div>
              </button>
            ))}
          </div>
        )}

        {/* Test History */}
        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <span className="text-gold">▎</span> 📋 Шалгалтын түүх
        </h2>

        {testHistory.length === 0 ? (
          <div className="text-center py-10 mb-8 bg-navy-surface border border-navy-surface-2 rounded-2xl">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm text-text-secondary">Шалгалтын түүх байхгүй байна.</p>
            <p className="text-xs mt-2" style={{ color: '#64748B' }}>Тест эсвэл IELTS өгсний дараа энд харагдана.</p>
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {testHistory.map(entry => (
              <div
                key={entry.id}
                className="bg-navy-surface border border-navy-surface-2 rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0 text-lg">
                  {entry.type === 'ielts' ? '📝' : '📖'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-text-primary text-sm">
                    {entry.type === 'ielts' ? 'IELTS Mock Test' : `${entry.level} Тест`}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                    {entry.type === 'ielts'
                      ? `Band ${entry.ieltsBand ?? '—'}`
                      : `${entry.score ?? 0}/${entry.total ?? 25} оноо`}
                    {' · '}{formatMongolianDate(entry.date)}
                  </div>
                </div>
                {entry.type === 'quiz' && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                    entry.passed
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}>
                    {entry.passed ? 'Тэнцсэн' : 'Тэнцээгүй'}
                  </span>
                )}
                {entry.type === 'ielts' && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                    (entry.ieltsBand ?? 0) >= 5
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}>
                    Band {entry.ieltsBand ?? '—'}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* IELTS History */}
        {ieltsHistory.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
              <span className="text-gold">▎</span> 📝 IELTS Түүх
            </h2>
            <div className="space-y-3">
              {ieltsHistory.map((r, i) => (
                <div
                  key={i}
                  className="bg-navy-surface border border-navy-surface-2 rounded-xl p-4 flex items-center gap-4"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-navy text-lg flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
                  >
                    {r.overall}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-text-primary text-sm">IELTS Overall Band</div>
                    <div className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                      L:{r.listening} R:{r.reading} W:{r.writing} S:{r.speaking}
                      {' · '}{formatMongolianDate(r.date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {selectedCert && (
        <CertificateModal
          level={selectedCert.level}
          score={selectedCert.score}
          total={selectedCert.total}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/profile/page.tsx
git commit -m "feat: premium profile page redesign — gradient cert cards, test history, IELTS history"
```

---

## Task 7: Final build verification

- [ ] **Step 1: Run build**

```bash
npm run build
```

Expected: `✓ Compiled successfully` with zero errors.

- [ ] **Step 2: Commit any build fixes, then done**

```bash
git add -A
git commit -m "fix: build verification after UI redesign"
```
