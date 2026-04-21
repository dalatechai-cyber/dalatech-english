# Core English — Mobile, Visual & Bug Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three bugs (duplicate certificate, language toggle, Claude branding), redesign certificate + landing + level cards visually, and make every page mobile-friendly down to 375px.

**Architecture:** All changes are to existing React/Next.js components and a shared i18n lib. No new pages or API routes. The i18n simplification removes the EN branch while keeping the same `useLanguage()` call signature so every consumer compiles unchanged. Mobile fixes use CSS `100dvh`, `env(safe-area-inset-bottom)`, and Tailwind responsive prefixes.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS (custom navy/gold tokens), localStorage, html2canvas

---

## File Map

| File | Change |
|---|---|
| `src/lib/certificates.ts` | Add deduplication guard in `saveCertificate` |
| `src/components/CertificateModal.tsx` | Move save to `useEffect`; full visual redesign; mobile stacked buttons |
| `src/lib/i18n.ts` | Strip EN translations; remove `Lang` type and `toggleLang`; export simple `t()` util |
| `src/components/LanguageToggle.tsx` | **Delete** |
| `src/components/NavBar.tsx` | Remove `LanguageToggle`; add hamburger menu for mobile |
| `src/components/LandingPage.tsx` | Remove Claude badge; upgrade hero design |
| `src/components/LevelSelector.tsx` | Enhance card visuals |
| `src/components/ChatInterface.tsx` | Fix `h-[100dvh]`, safe-area padding |
| `src/components/FreeChatInterface.tsx` | Same dvh / safe-area fix as ChatInterface |
| `src/components/ChatBubble.tsx` | `max-w-[85%]` mobile, `sm:max-w-[75%]` desktop |
| `src/components/QuizMode.tsx` | Answer options `min-h-[48px]`; result page mobile layout |
| `src/components/DailyChallenge.tsx` | Premium gold card visual upgrade |
| `src/components/MistakeDiary.tsx` | Mobile layout polish |
| `src/app/profile/page.tsx` | Mobile layout polish |
| `src/app/globals.css` | Add `dvh` fallback, safe-area utilities, `font-size: 16px` base |
| `src/app/layout.tsx` | Add viewport meta with `interactive-widget=resizes-content` |

---

## Task 1: Fix duplicate certificate — deduplication guard in `saveCertificate`

**Files:**
- Modify: `src/lib/certificates.ts`

Root cause: `saveCertificate` is called on every render of `CertificateModal`. Even after moving it to `useEffect`, a user clicking the certificate button twice would create two entries. Adding a same-level+same-date guard in the lib is the belt-and-suspenders fix.

- [ ] **Step 1: Edit `src/lib/certificates.ts` — add deduplication**

Replace the entire file with:

```typescript
import type { LevelCode } from './types'

export interface CertificateEntry {
  id: string
  level: LevelCode
  score: number
  total: number
  date: string
  type: 'quiz'
}

const KEY = 'core-certificates'

export function loadCertificates(): CertificateEntry[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as CertificateEntry[]
  } catch {
    return []
  }
}

export function saveCertificate(entry: Omit<CertificateEntry, 'id' | 'date'>): CertificateEntry {
  const today = new Date().toISOString().slice(0, 10)
  const cert: CertificateEntry = {
    ...entry,
    id: `cert-${Date.now()}`,
    date: today,
  }
  if (typeof window !== 'undefined') {
    const certs = loadCertificates()
    const duplicate = certs.some(
      c => c.level === entry.level && c.date === today && c.type === entry.type
    )
    if (!duplicate) {
      localStorage.setItem(KEY, JSON.stringify([cert, ...certs]))
    } else {
      // Return the existing cert so callers get the right id
      return certs.find(c => c.level === entry.level && c.date === today && c.type === entry.type)!
    }
  }
  return cert
}

export function formatMongolianDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-')
  const months = [
    '1-р сар','2-р сар','3-р сар','4-р сар','5-р сар','6-р сар',
    '7-р сар','8-р сар','9-р сар','10-р сар','11-р сар','12-р сар',
  ]
  return `${y} оны ${months[parseInt(m) - 1]}ын ${parseInt(d)}`
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/certificates.ts
git commit -m "fix: deduplicate certificate saves — guard same level+date in saveCertificate"
```

---

## Task 2: Fix duplicate certificate — move save to `useEffect` in `CertificateModal`

**Files:**
- Modify: `src/components/CertificateModal.tsx` (render-time save fix only; full visual redesign in Task 9)

- [ ] **Step 1: Replace the render-time `saveCertificate` call with a `useEffect`**

Find and replace in `CertificateModal.tsx`:

Old (line ~39-40):
```typescript
  // Save on mount
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _cert = saveCertificate({ level, score, total, type: 'quiz' })
```

New:
```typescript
  useEffect(() => {
    saveCertificate({ level, score, total, type: 'quiz' })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
```

Also add `useEffect` to the import:
```typescript
import { useRef, useEffect } from 'react'
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CertificateModal.tsx
git commit -m "fix: move certificate save to useEffect to prevent duplicate on re-render"
```

---

## Task 3: Remove language toggle — simplify `i18n.ts` to Mongolian-only

**Files:**
- Modify: `src/lib/i18n.ts`
- Delete: `src/components/LanguageToggle.tsx`

- [ ] **Step 1: Replace `src/lib/i18n.ts` entirely**

```typescript
export const UI: Record<string, string> = {
  appName: 'Core English',
  chooseLevel: 'Түвшин сонгох',
  howItWorks: 'Хэрхэн ажилладаг вэ?',
  freeChat: 'Чөлөөт яриа',
  freeChatDesc: 'AI багштай чөлөөтэй ярилц. Дүрэм, үг хэллэгийн алдааг засна.',
  quiz: 'Тест',
  quizDesc: 'Олон сонголттой тест өгч мэдлэгээ шалга.',
  lessons: 'Хичээлүүд',
  mistakes: 'Алдааны дэвтэр',
  profile: 'Профайл',
  streak: 'хоног',
  loading: 'Уншиж байна...',
  send: 'Илгээх',
  next: 'Дараагийн',
  back: 'Буцах',
  retry: 'Дахин оролдох',
  start: 'Эхлэх',
  close: 'Хаах',
  download: 'Зураг татах',
  share: 'Facebook-т хуваалцах',
  poweredBy: 'Powered by',
  levelLabel: 'Түвшин',
  lessonLabel: 'Хичээл',
  completedLabel: 'дууссан',
  totalLessons: 'хичээл',
  dailyChallenge: 'Өдрийн даалгавар 📚',
  dailyChallengeNew: 'Өнөөдрийн шинэ даалгавар',
  alreadyAnswered: 'Өнөөдрийн даалгаварыг гүйцэтгэсэн байна!',
  correct: 'Зөв!',
  wrong: 'Буруу.',
  yourAnswer: 'Таны хариулт',
  correctAnswer: 'Зөв хариулт',
  submitAnswer: 'Хариулах',
  yourType: 'Бичих',
  date: 'Огноо',
  error: 'Алдаа',
  correction: 'Зөв хувилбар',
  explanation: 'Тайлбар',
  practiceAgain: 'Дахин дадлага хийх',
  filterByLevel: 'Түвшнээр шүүх',
  allLevels: 'Бүх түвшин',
  searchMistakes: 'Алдаа хайх...',
  noMistakes: 'Алдаа бүртгэгдээгүй байна.',
  certificates: 'Гэрчилгээнүүд',
  noCertificates: 'Одоогоор гэрчилгээ байхгүй байна.',
  certificate: 'ГЭРЧИЛГЭЭ',
  certBody: 'Та [LEVEL] түвшний тестийг амжилттай өглөө!',
  certScore: 'Оноо',
  streakContinue: 'Өнөөдөр ч үргэлжлүүллээ!',
  streakBroken: 'Шинэ эхлэл! Өнөөдрөөс дахин эхэлцгээе 💪',
  days: 'хоног',
  errorMsg: 'Уучлаарай, алдаа гарлаа. Дахин оролдоно уу.',
  quizLoading: 'Асуултуудыг бэлдэж байна...',
  quizResults: 'Тестийн үр дүн',
  quizPassed: 'Тэнцсэн! 🎉',
  quizFailed: 'Тэнцээгүй 😔',
  quizPassMsg: 'Баяр хүргэе! Та тестийг амжилттай дүүргэлээ.',
  quizFailMsg: 'Дараах сэдвүүдийг давтана уу:',
  quizRetry: 'Дахин тест өгөх',
  quizContinue: 'Үргэлжлүүлэх',
  step: 'Хичээл нээнэ',
  step1desc: 'А1-ээс эхлэн тус бүрийг нээнэ. Шалгалтаар тэнцвэл дараагийн түвшин нээгдэнэ.',
  step2: 'AI-тай ярилцана',
  step2desc: 'Та англиар бичиж, AI алдааг монгол хэлээр тайлбарлан засна.',
  step3: 'Ахина',
  step3desc: 'Тест өгөөд 7/10 аваас гэрчилгээ авна.',
}

export function t(key: string): string {
  return UI[key] ?? key
}

export function useLanguage() {
  return { t }
}
```

- [ ] **Step 2: Delete `LanguageToggle.tsx`**

```bash
rm "src/components/LanguageToggle.tsx"
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/i18n.ts
git rm src/components/LanguageToggle.tsx
git commit -m "fix: remove EN language toggle — app is Mongolian-only"
```

---

## Task 4: Remove LanguageToggle from NavBar + add mobile hamburger

**Files:**
- Modify: `src/components/NavBar.tsx`

- [ ] **Step 1: Replace `src/components/NavBar.tsx`**

```typescript
'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { loadStreak } from '@/lib/streak'
import { t } from '@/lib/i18n'

interface NavBarProps {
  levelCode?: string
  lessonId?: number
  lessonTitle?: string
}

export function NavBar({ levelCode, lessonId, lessonTitle }: NavBarProps) {
  const [streak, setStreak] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const data = loadStreak()
    setStreak(data.current)
  }, [])

  return (
    <nav className="bg-navy-surface border-b border-navy-surface-2 px-4 py-3 relative z-40">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-gold font-bold text-lg tracking-tight hover:text-gold-light transition-colors flex-shrink-0">
          {t('appName')}
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
            <span className="text-navy-surface-2 hidden sm:block">/</span>
            <span className="text-text-secondary text-sm truncate max-w-[120px] sm:max-w-[200px] hidden sm:block">
              {t('lessonLabel')} {lessonId}: {lessonTitle}
            </span>
          </>
        )}

        <div className="ml-auto flex items-center gap-3">
          {streak > 0 && (
            <span className="text-gold text-sm font-medium flex items-center gap-1 flex-shrink-0">
              🔥 {streak} {t('streak')}
            </span>
          )}
          {/* Desktop nav links */}
          <Link href="/mistakes" className="text-text-secondary hover:text-text-primary text-xs transition-colors hidden sm:block">
            {t('mistakes')}
          </Link>
          <Link href="/profile" className="text-text-secondary hover:text-text-primary text-xs transition-colors hidden sm:block">
            {t('profile')}
          </Link>
          {/* Mobile hamburger */}
          <button
            className="sm:hidden w-9 h-9 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-navy-surface-2/50"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Цэс нээх"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-navy-surface border-b border-navy-surface-2 py-2 z-50">
          <Link
            href="/mistakes"
            className="flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-text-primary hover:bg-navy-surface-2/30 transition-colors text-sm"
            onClick={() => setMenuOpen(false)}
          >
            📓 {t('mistakes')}
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-text-primary hover:bg-navy-surface-2/30 transition-colors text-sm"
            onClick={() => setMenuOpen(false)}
          >
            👤 {t('profile')}
          </Link>
        </div>
      )}
    </nav>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/NavBar.tsx
git commit -m "fix: remove LanguageToggle from NavBar; add mobile hamburger menu"
```

---

## Task 5: Remove Claude attribution from LandingPage

**Files:**
- Modify: `src/components/LandingPage.tsx`

The `🤖 Claude AI-аар тэжээгддэг` badge is on lines 17-19.

- [ ] **Step 1: Remove the Claude badge block**

Find and remove this block in `LandingPage.tsx`:
```tsx
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 text-gold text-sm font-medium mb-6">
            🤖 Claude AI-аар тэжээгддэг
          </div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/LandingPage.tsx
git commit -m "fix: remove Claude AI attribution badge from landing page"
```

---

## Task 6: Mobile — global CSS fixes (dvh, safe-area, base font-size)

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Replace `src/app/globals.css`**

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
  --text-secondary: #94A3B8;
}

html {
  /* Prevent iOS tap highlight */
  -webkit-tap-highlight-color: transparent;
}

body {
  background-color: var(--navy);
  color: var(--text-primary);
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px; /* minimum for no iOS zoom on focus */
  overflow-x: hidden; /* no horizontal scroll */
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--navy-surface); }
::-webkit-scrollbar-thumb { background: var(--navy-surface-2); border-radius: 3px; }

/* Safe-area helpers used in chat screens */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* Dynamic viewport height — shrinks when keyboard opens on iOS */
.h-dvh {
  height: 100vh; /* fallback */
  height: 100dvh;
}

/* Minimum tap target size */
.tap-target {
  min-height: 44px;
  min-width: 44px;
}

/* Page fade-in animation */
.page-enter {
  animation: pageFadeIn 0.25s ease-out both;
}

@keyframes pageFadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

- [ ] **Step 2: Update `src/app/layout.tsx` — add viewport interactive-widget**

Replace the file:
```typescript
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Core English — Монгол хэлтнүүдэд зориулсан AI Англи хэлний сургалт',
  description: 'A1-аас C1 хүртэл AI тутортой англи хэл сур',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  interactiveWidget: 'resizes-content',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <body className={`${inter.className} min-h-screen bg-navy text-text-primary`}>
        <div className="page-enter">
          {children}
        </div>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "fix(mobile): add dvh, safe-area, 16px base font, interactive-widget viewport"
```

---

## Task 7: Mobile — fix chat interfaces (h-dvh + safe-area + ChatBubble width)

**Files:**
- Modify: `src/components/ChatInterface.tsx`
- Modify: `src/components/FreeChatInterface.tsx`
- Modify: `src/components/ChatBubble.tsx`

- [ ] **Step 1: Fix `ChatInterface.tsx` — replace `h-screen` with `h-dvh` and add safe-area padding**

In `ChatInterface.tsx`, make these three targeted edits:

**Change 1** — outer container:
```
Old:  <div className="flex flex-col h-screen bg-navy">
New:  <div className="flex flex-col h-dvh bg-navy">
```

**Change 2** — input section (add safe-area bottom padding):
```
Old:  <div className="px-4 py-3 bg-navy-surface border-t border-navy-surface-2">
New:  <div className="px-4 pt-3 pb-3 pb-safe bg-navy-surface border-t border-navy-surface-2">
```

**Change 3** — hint text below textarea, also increase textarea font-size to 16px to avoid iOS zoom:
```
Old:  className="flex-1 bg-transparent text-text-primary text-sm resize-none outline-none placeholder:text-text-secondary py-1 max-h-[120px]"
New:  className="flex-1 bg-transparent text-text-primary text-[16px] sm:text-sm resize-none outline-none placeholder:text-text-secondary py-1 max-h-[120px]"
```

- [ ] **Step 2: Fix `FreeChatInterface.tsx` — same three changes**

**Change 1:**
```
Old:  <div className="flex flex-col h-screen bg-navy">
New:  <div className="flex flex-col h-dvh bg-navy">
```

**Change 2:**
```
Old:  <div className="px-4 py-3 bg-navy-surface border-t border-navy-surface-2">
New:  <div className="px-4 pt-3 pb-3 pb-safe bg-navy-surface border-t border-navy-surface-2">
```

**Change 3** — textarea font-size:
```
Old:  className="flex-1 bg-transparent text-text-primary text-sm resize-none outline-none placeholder:text-text-secondary py-1 max-h-[120px]"
New:  className="flex-1 bg-transparent text-text-primary text-[16px] sm:text-sm resize-none outline-none placeholder:text-text-secondary py-1 max-h-[120px]"
```

- [ ] **Step 3: Fix `ChatBubble.tsx` — 85% max-width on mobile**

```
Old:  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
New:  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ChatInterface.tsx src/components/FreeChatInterface.tsx src/components/ChatBubble.tsx
git commit -m "fix(mobile): dvh height for chat, safe-area padding, 85% bubble width, 16px textarea"
```

---

## Task 8: Mobile — QuizMode answer options height

**Files:**
- Modify: `src/components/QuizMode.tsx`

- [ ] **Step 1: Add `min-h-[48px]` and `items-center` to answer option buttons**

In `QuizMode.tsx`, find the answer option button:
```
Old:  className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${style}`}
New:  className={`w-full text-left px-4 py-3 min-h-[48px] flex items-center rounded-xl border transition-all text-sm ${style}`}
```

- [ ] **Step 2: Ensure result page buttons are `min-h-[48px]`**

In the results section of `QuizMode.tsx`, find:
```
Old:  className="w-full bg-gold hover:bg-gold-dark text-navy font-bold py-3 rounded-xl transition-colors"
New:  className="w-full bg-gold hover:bg-gold-dark text-navy font-bold py-3 min-h-[48px] rounded-xl transition-colors"
```

And the retry button:
```
Old:  className="w-full bg-navy-surface hover:bg-navy-surface-2 border border-navy-surface-2 text-text-primary font-semibold py-3 rounded-xl transition-colors"
New:  className="w-full bg-navy-surface hover:bg-navy-surface-2 border border-navy-surface-2 text-text-primary font-semibold py-3 min-h-[48px] rounded-xl transition-colors"
```

- [ ] **Step 3: Commit**

```bash
git add src/components/QuizMode.tsx
git commit -m "fix(mobile): quiz answer options min-h-48px for comfortable touch targets"
```

---

## Task 9: Visual redesign — premium Certificate modal

**Files:**
- Modify: `src/components/CertificateModal.tsx`

Replace the entire file. This keeps the `useEffect` save from Task 2, adds the trophy icon at top center, level code prominent in gold, decorative separators, and stacked mobile buttons.

- [ ] **Step 1: Replace `src/components/CertificateModal.tsx`**

```typescript
'use client'
import { useRef, useEffect } from 'react'
import type { LevelCode } from '@/lib/types'
import { formatMongolianDate, saveCertificate } from '@/lib/certificates'
import { t } from '@/lib/i18n'

interface CertificateModalProps {
  level: LevelCode
  score: number
  total: number
  onClose: () => void
}

export function CertificateModal({ level, score, total, onClose }: CertificateModalProps) {
  const certRef = useRef<HTMLDivElement>(null)
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    saveCertificate({ level, score, total, type: 'quiz' })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDownload = async () => {
    if (!certRef.current) return
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(certRef.current, { backgroundColor: '#0F172A', scale: 2 })
      const link = document.createElement('a')
      link.download = `core-english-${level}-certificate.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      console.error('Certificate download failed', e)
    }
  }

  const handleShare = () => {
    const text = encodeURIComponent(`Core English ${level} түвшний тестийг ${score}/${total} оноотойгоор амжилттай дууслаа! 🎓`)
    window.open(
      `https://www.facebook.com/sharer/sharer.php?quote=${text}&u=${encodeURIComponent('https://core-english.vercel.app')}`,
      '_blank'
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm sm:max-w-md my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Certificate */}
        <div
          ref={certRef}
          className="bg-[#0F172A] rounded-2xl p-6 sm:p-8 text-center relative"
          style={{
            border: '2px solid #F59E0B',
            boxShadow: '0 0 40px rgba(245,158,11,0.15), inset 0 0 60px rgba(245,158,11,0.03)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {/* Corner decorations */}
          <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-[#F59E0B] rounded-tl-lg opacity-70" />
          <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-[#F59E0B] rounded-tr-lg opacity-70" />
          <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-[#F59E0B] rounded-bl-lg opacity-70" />
          <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-[#F59E0B] rounded-br-lg opacity-70" />

          {/* Trophy icon */}
          <div className="text-5xl mb-2">🏆</div>

          {/* Brand */}
          <div className="text-[#F59E0B] text-base font-bold tracking-widest uppercase mb-1">
            CORE ENGLISH
          </div>

          {/* Top separator */}
          <div className="flex items-center gap-2 my-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#F59E0B]/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#F59E0B]/60" />
          </div>

          {/* Certificate title */}
          <div className="text-white text-2xl sm:text-3xl font-extrabold tracking-widest mb-4">
            {t('certificate')}
          </div>

          {/* Level */}
          <div className="text-[#F59E0B] text-5xl sm:text-6xl font-extrabold mb-2 leading-none">
            {level}
          </div>
          <div className="text-white text-sm font-medium mb-4">
            түвшинг амжилттай дүүргэлээ
          </div>

          {/* Bottom separator */}
          <div className="flex items-center gap-2 my-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#F59E0B]/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#F59E0B]/60" />
          </div>

          {/* Score */}
          <div className="text-[#F59E0B] text-xl font-bold mb-2">
            Оноо: {score}/{total}
          </div>

          {/* Date */}
          <p className="text-gray-400 text-xs mb-4">{formatMongolianDate(today)}</p>

          {/* Attribution */}
          <div className="text-[#F59E0B]/50 text-xs tracking-wide">Powered by Dalatech.ai</div>
        </div>

        {/* Action buttons — stacked vertically on all sizes */}
        <div className="flex flex-col gap-2 mt-4">
          <button
            onClick={handleDownload}
            className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-[#0F172A] font-bold py-3 min-h-[48px] rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            📥 {t('download')}
          </button>
          <button
            onClick={handleShare}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 min-h-[48px] rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            <span className="font-bold">f</span> {t('share')}
          </button>
          <button
            onClick={onClose}
            className="w-full bg-navy-surface border border-navy-surface-2 text-text-secondary hover:text-text-primary py-3 min-h-[44px] rounded-xl transition-colors text-sm"
          >
            {t('close')} ✕
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CertificateModal.tsx
git commit -m "feat: premium certificate redesign — trophy, level prominent, gold separators, mobile-friendly buttons"
```

---

## Task 10: Visual — upgrade LandingPage hero

**Files:**
- Modify: `src/components/LandingPage.tsx`

- [ ] **Step 1: Replace `src/components/LandingPage.tsx`**

```typescript
'use client'
import { LevelSelector } from './LevelSelector'
import { DailyChallenge } from './DailyChallenge'
import { t } from '@/lib/i18n'
import { NavBar } from './NavBar'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-navy">
      <NavBar />

      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/8 via-transparent to-navy-surface/20 pointer-events-none" />
        {/* Decorative orb */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gold/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 pt-10 sm:pt-16 pb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 text-gold text-xs sm:text-sm font-medium mb-6">
            ✨ Дэлхийн стандартын AI сургалт
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-4 leading-tight">
            <span className="text-white">Core </span>
            <span
              className="text-gold"
              style={{ textShadow: '0 0 40px rgba(245,158,11,0.4)' }}
            >
              English
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-text-secondary max-w-xl mx-auto mb-3 leading-relaxed">
            Монгол хэлтнүүдэд зориулсан AI англи хэлний сургалт
          </p>
          <p className="text-sm sm:text-base text-text-secondary/70 max-w-lg mx-auto mb-10">
            А1-ээс С1 хүртэл — алдааг монгол хэлээр тайлбарлан, тест өгч гэрчилгээ авна.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {[
              { icon: '🧠', text: 'Монгол тайлбар' },
              { icon: '✏️', text: 'Алдаа засах' },
              { icon: '📊', text: 'Дэвшил хянах' },
              { icon: '🏆', text: 'Гэрчилгээ авах' },
            ].map(f => (
              <div
                key={f.text}
                className="bg-navy-surface border border-navy-surface-2 hover:border-gold/30 rounded-xl p-3 text-center transition-colors"
              >
                <div className="text-2xl mb-1">{f.icon}</div>
                <div className="text-xs text-text-secondary">{f.text}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-16">
        {/* Daily Challenge */}
        <div className="mb-10">
          <DailyChallenge />
        </div>

        {/* Levels */}
        <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
          <span className="text-gold">▎</span>
          {t('chooseLevel')}
        </h2>
        <LevelSelector />

        {/* How it works */}
        <section className="mt-16">
          <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <span className="text-gold">▎</span>
            {t('howItWorks')}
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { step: '01', title: t('step'), desc: t('step1desc') },
              { step: '02', title: t('step2'), desc: t('step2desc') },
              { step: '03', title: t('step3'), desc: t('step3desc') },
            ].map(s => (
              <div key={s.step} className="bg-navy-surface border border-navy-surface-2 hover:border-gold/30 rounded-xl p-5 transition-colors">
                <div className="text-gold text-3xl font-bold mb-3 opacity-80">{s.step}</div>
                <div className="font-semibold text-text-primary mb-2">{s.title}</div>
                <p className="text-text-secondary text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-navy-surface-2 py-6 text-center text-xs text-text-secondary">
        {t('poweredBy')}{' '}
        <a href="https://dalatech.online/" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
          Dalatech.ai
        </a>
      </footer>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/LandingPage.tsx
git commit -m "feat: upgrade landing page hero — gold glow title, decorative orb, section headers"
```

---

## Task 11: Visual — enhance LevelSelector cards

**Files:**
- Modify: `src/components/LevelSelector.tsx`

- [ ] **Step 1: Replace `src/components/LevelSelector.tsx`**

```typescript
'use client'
import Link from 'next/link'
import { useProgress } from '@/hooks/useProgress'
import { LEVELS } from '@/lib/levels'
import type { LevelCode } from '@/lib/types'

export function LevelSelector() {
  const { getLevelProgress } = useProgress()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {LEVELS.map(level => {
        const lp = getLevelProgress(level.code as LevelCode)
        const completed = lp.completedLessons.length
        const pct = Math.round((completed / 10) * 100)

        return (
          <Link
            key={level.code}
            href={`/level/${level.code}`}
            className="group relative rounded-2xl overflow-hidden border border-navy-surface-2 hover:border-gold/60 transition-all duration-300 hover:shadow-[0_0_24px_rgba(245,158,11,0.15)] active:scale-[0.98]"
          >
            <div className={`bg-gradient-to-br ${level.color} p-0.5 rounded-2xl h-full`}>
              <div className="bg-navy rounded-[14px] p-5 h-full flex flex-col">
                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div
                      className="text-3xl font-extrabold text-gold leading-none"
                      style={{ textShadow: '0 0 20px rgba(245,158,11,0.3)' }}
                    >
                      {level.code}
                    </div>
                    <div className="text-sm font-semibold text-text-primary mt-1">
                      {level.label.split(' — ')[1]}
                    </div>
                  </div>
                  <div className="text-2xl">{lp.examPassed ? '🏆' : '📖'}</div>
                </div>

                {/* Description */}
                <p className="text-xs text-text-secondary leading-relaxed mb-4 flex-1">
                  {level.description}
                </p>

                {/* Lesson count badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-secondary/70 bg-navy-surface rounded-full px-2.5 py-0.5 border border-navy-surface-2">
                    10 хичээл
                  </span>
                  <span className="text-xs font-semibold text-gold">
                    {completed}/10 дууссан
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-navy-surface-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
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

- [ ] **Step 2: Commit**

```bash
git add src/components/LevelSelector.tsx
git commit -m "feat: premium level cards — larger level code, gradient progress bar, lesson count badge"
```

---

## Task 12: Visual — upgrade DailyChallenge card

**Files:**
- Modify: `src/components/DailyChallenge.tsx`

- [ ] **Step 1: Upgrade the outer card container and header in `DailyChallenge.tsx`**

Find:
```tsx
    <div className="bg-navy-surface border border-gold/20 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-gold font-bold text-sm">{t('dailyChallenge')}</span>
        <span className="text-xs text-text-secondary border border-navy-surface-2 rounded-full px-2 py-0.5">{q.level}</span>
      </div>
```

Replace with:
```tsx
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        border: '1px solid rgba(245,158,11,0.35)',
        boxShadow: '0 0 30px rgba(245,158,11,0.08)',
      }}
    >
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-lg flex-shrink-0">
          🏅
        </div>
        <div>
          <div className="text-gold font-bold text-sm">{t('dailyChallenge')}</div>
          <div className="text-xs text-text-secondary/70">Өдөр бүр шинэ асуулт</div>
        </div>
        <span className="ml-auto text-xs font-bold text-gold bg-gold/10 border border-gold/25 rounded-full px-2.5 py-0.5">{q.level}</span>
      </div>
```

Also wrap the rest of the card content in `<div className="relative">` to sit above the background glow.

Find the closing `</div>` of the outer card and ensure the relative wrapper is closed properly. The structure should be:

```tsx
    <div ... outer card ...>
      <div ... background glow ... />
      <div className="relative flex items-center gap-3 mb-4"> ... header ... </div>
      <div className="relative">
        <p ...>{q.question}</p>
        ... rest of card content ...
      </div>
    </div>
```

- [ ] **Step 2: Import `t` instead of `useLanguage` in DailyChallenge**

Since `useLanguage` now returns `{ t }` only, the existing `const { t } = useLanguage()` still compiles. No change needed for functionality — but update the import for cleanliness:

```
Old:  import { useLanguage } from '@/lib/i18n'
New:  import { t } from '@/lib/i18n'
```

And remove `const { t } = useLanguage()` from the component body.

- [ ] **Step 3: Commit**

```bash
git add src/components/DailyChallenge.tsx
git commit -m "feat: premium daily challenge card with gold glow and trophy icon"
```

---

## Task 13: Visual — polish Profile page and MistakeDiary for mobile

**Files:**
- Modify: `src/app/profile/page.tsx`
- Modify: `src/components/MistakeDiary.tsx`

- [ ] **Step 1: Update `useLanguage` import in Profile page**

In `src/app/profile/page.tsx`:
```
Old:  import { useLanguage } from '@/lib/i18n'
...
  const { t } = useLanguage()
New:  import { t } from '@/lib/i18n'
```
Remove `const { t } = useLanguage()` from the component body and just call `t(...)` directly.

- [ ] **Step 2: Add mobile-friendly padding and min-tap-target to Profile page buttons/links**

In `src/app/profile/page.tsx`, update the page wrapper to ensure mobile padding:
```
Old:  <div className="max-w-2xl mx-auto px-4 py-8">
New:  <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
```

- [ ] **Step 3: Update `useLanguage` import in MistakeDiary**

In `src/components/MistakeDiary.tsx`:
```
Old:  import { useLanguage } from '@/lib/i18n'
...
  const { t } = useLanguage()
New:  import { t } from '@/lib/i18n'
```
Remove `const { t } = useLanguage()` from the function body.

- [ ] **Step 4: Fix MistakeDiary mobile layout — ensure filters don't overflow on small screens**

In `MistakeDiary.tsx`, find the filter row:
```
Old:  <div className="flex flex-col sm:flex-row gap-3 mb-6">
New:  <div className="flex flex-col gap-3 mb-6 sm:flex-row">
```

The `select` element can overflow on tiny screens — add `w-full sm:w-auto`:
```
Old:  className="bg-navy-surface border border-navy-surface-2 rounded-xl px-4 py-2.5 text-text-primary text-sm outline-none"
New:  className="w-full sm:w-auto bg-navy-surface border border-navy-surface-2 rounded-xl px-4 py-2.5 text-text-primary text-sm outline-none"
```

- [ ] **Step 5: Commit**

```bash
git add src/app/profile/page.tsx src/components/MistakeDiary.tsx
git commit -m "fix(mobile): profile and mistake diary — direct t() import, mobile padding, filter layout"
```

---

## Task 14: Update remaining components that use `useLanguage`

**Files:**
- Modify: `src/components/LevelPage.tsx`
- Modify: `src/components/QuizMode.tsx`  
- Modify: `src/components/StreakPopup.tsx` (check if it uses useLanguage)

The `useLanguage()` hook now returns `{ t }` with no breaking change, so existing calls will still compile. However, since `useLanguage` is now a trivial function (no state/effect), components can optionally switch to importing `t` directly to avoid an unnecessary client render hook. Do this cleanup in the two remaining components.

- [ ] **Step 1: Update `LevelPage.tsx`**

```
Old:  import { useLanguage } from '@/lib/i18n'
...
  const { t } = useLanguage()
New:  import { t } from '@/lib/i18n'
```
Remove `const { t } = useLanguage()` from the function body.

- [ ] **Step 2: Update `QuizMode.tsx`**

```
Old:  import { useLanguage } from '@/lib/i18n'
...
  const { t } = useLanguage()
New:  import { t } from '@/lib/i18n'
```
Remove `const { t } = useLanguage()` from the component body.

- [ ] **Step 3: Check `StreakPopup.tsx` for useLanguage**

If `StreakPopup.tsx` imports `useLanguage`, apply the same swap. If it doesn't, skip.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd "C:/Users/x86/OneDrive/Desktop/online book"
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/LevelPage.tsx src/components/QuizMode.tsx src/components/StreakPopup.tsx
git commit -m "refactor: replace useLanguage() hook calls with direct t() import across components"
```

---

## Task 15: Final build verification

- [ ] **Step 1: Run Next.js production build**

```bash
cd "C:/Users/x86/OneDrive/Desktop/online book"
npm run build
```

Expected: `Route (app)` table with all routes showing no errors. No TypeScript or ESLint errors.

- [ ] **Step 2: If build fails, read the error and fix**

Common failure modes:
- Missing import `t` somewhere → add `import { t } from '@/lib/i18n'`
- `useLanguage` called in a server component → convert call to `t()` direct import
- `LanguageToggle` still imported somewhere → remove the import

- [ ] **Step 3: Commit any build fixes, then final commit**

```bash
git add -A
git commit -m "fix: resolve any remaining build errors post-i18n refactor"
```

---

## Spec Coverage Checklist

| Requirement | Task |
|---|---|
| Bug 1: duplicate certificate | Tasks 1, 2 |
| Bug 2: remove MN/EN toggle | Tasks 3, 4, 13, 14 |
| Bug 3: remove Claude attribution | Task 5 |
| Certificate visual redesign (trophy, level, separators, score, date, Dalatech) | Task 9 |
| Facebook share / Download | Task 9 (kept from original, now stacked vertically) |
| Landing page hero upgrade | Task 10 |
| Level cards visual upgrade | Task 11 |
| Daily challenge gold card | Task 12 |
| Mobile: no horizontal scroll | Task 6 (`overflow-x: hidden`) |
| Mobile: min 16px body text | Task 6 |
| Mobile: chat dvh + safe-area | Task 7 |
| Mobile: chat bubble 85% | Task 7 |
| Mobile: textarea 16px (no iOS zoom) | Task 7 |
| Mobile: quiz options 48px | Task 8 |
| Mobile: certificate modal scrollable | Task 9 |
| Mobile: certificate buttons stacked | Task 9 |
| Mobile: navbar hamburger | Task 4 |
| Mobile: all buttons min 44px | Tasks 7, 8, 9 |
| `interactiveWidget` viewport (iOS keyboard) | Task 6 |
| Footer: Powered by Dalatech.ai | All landing/page edits preserve it |
| Do not break AI chat / quiz logic | No API routes touched |
| Do not remove content filter | Not touched |
| Keep localStorage | Not touched |
