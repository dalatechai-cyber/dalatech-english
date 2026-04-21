# Bug Fixes + Test History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix certificate viewing in profile, remove score from certificate design, and add a unified test history storage layer shown in /profile.

**Architecture:** New `src/lib/testHistory.ts` handles a localStorage key `'core-test-history'` (max 50). QuizMode and IELTSTest both call `saveTestResult()` after grading. Profile page renders a clickable certificate grid (opens CertificateModal) and a new "Шалгалтын түүх" section reading from testHistory.

**Tech Stack:** Next.js 14, React 18, TypeScript, localStorage

---

## File Map

| File | Change |
|---|---|
| `src/lib/testHistory.ts` | NEW — TestHistoryEntry type + load/save |
| `src/components/CertificateModal.tsx` | Remove score `div` from certificate visual |
| `src/app/profile/page.tsx` | Clickable cert cards + test history section |
| `src/components/QuizMode.tsx` | Call saveTestResult after writing graded |
| `src/components/IELTSTest.tsx` | Call saveTestResult after IELTS graded |

---

## Task 1: Create `src/lib/testHistory.ts`

**Files:**
- Create: `src/lib/testHistory.ts`

- [ ] **Step 1: Write the file**

```typescript
const KEY = 'core-test-history'

export interface TestHistoryEntry {
  id: string
  date: string
  type: 'quiz' | 'ielts'
  level?: string
  score?: number
  total?: number
  passed?: boolean
  ieltsBand?: number
}

export function loadTestHistory(): TestHistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as TestHistoryEntry[]
  } catch {
    return []
  }
}

export function saveTestResult(entry: Omit<TestHistoryEntry, 'id' | 'date'>): void {
  if (typeof window === 'undefined') return
  const history = loadTestHistory()
  const newEntry: TestHistoryEntry = {
    ...entry,
    id: `test-${Date.now()}`,
    date: new Date().toISOString().slice(0, 10),
  }
  history.unshift(newEntry)
  localStorage.setItem(KEY, JSON.stringify(history.slice(0, 50)))
}
```

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/testHistory.ts
git commit -m "feat: test history storage lib (core-test-history, max 50)"
```

---

## Task 2: Remove score from CertificateModal certificate design

**Files:**
- Modify: `src/components/CertificateModal.tsx`

The spec says score should appear only in the profile card list, NOT printed on the certificate design. Remove the score `<div>` from inside the `certRef` container. Keep `score` and `total` in the component props (they're still needed externally).

- [ ] **Step 1: Read the current file**

```bash
# Identify the score div — it currently reads:
# <div style={{ color:'#F59E0B', fontSize:'18px', fontWeight:600, marginBottom:'12px' }}>
#   Оноо: {score}/{total}
# </div>
```

- [ ] **Step 2: Remove the score block from the certificate visual**

In `src/components/CertificateModal.tsx`, find and remove this exact block (it is between the "Bottom ornament" comment and the "Date" comment):

```tsx
            {/* Score */}
            <div style={{ color:'#F59E0B', fontSize:'18px', fontWeight:600, marginBottom:'12px' }}>
              Оноо: {score}/{total}
            </div>
```

Replace it with nothing (delete those 4 lines).

- [ ] **Step 3: Run type check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/CertificateModal.tsx
git commit -m "fix: remove score from certificate visual (score stays in profile card only)"
```

---

## Task 3: Fix profile page — clickable certs + test history section

**Files:**
- Modify: `src/app/profile/page.tsx`

Current profile page has non-clickable cert cards. The full updated file:

- [ ] **Step 1: Write the updated profile page**

Replace the entire file `src/app/profile/page.tsx` with:

```typescript
'use client'
import { useState, useEffect } from 'react'
import { NavBar } from '@/components/NavBar'
import { CertificateModal } from '@/components/CertificateModal'
import { loadCertificates, formatMongolianDate, type CertificateEntry } from '@/lib/certificates'
import { loadTestHistory, type TestHistoryEntry } from '@/lib/testHistory'
import { loadStreak } from '@/lib/streak'
import { t } from '@/lib/i18n'

export default function ProfilePage() {
  const [certs, setCerts] = useState<CertificateEntry[]>([])
  const [testHistory, setTestHistory] = useState<TestHistoryEntry[]>([])
  const [streak, setStreak] = useState({ current: 0, longest: 0 })
  const [selectedCert, setSelectedCert] = useState<CertificateEntry | null>(null)

  useEffect(() => {
    setCerts(loadCertificates())
    setTestHistory(loadTestHistory())
    const s = loadStreak()
    setStreak({ current: s.current, longest: s.longest })
  }, [])

  return (
    <div className="min-h-screen bg-navy">
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
        <h1 className="text-2xl font-bold text-gold mb-6">👤 {t('profile')}</h1>

        {/* Streak stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-navy-surface border border-navy-surface-2 rounded-xl p-4 text-center">
            <div className="text-3xl mb-1">🔥</div>
            <div className="text-2xl font-bold text-gold">{streak.current}</div>
            <div className="text-xs text-text-secondary">Одоогийн streak</div>
          </div>
          <div className="bg-navy-surface border border-navy-surface-2 rounded-xl p-4 text-center">
            <div className="text-3xl mb-1">⭐</div>
            <div className="text-2xl font-bold text-gold">{streak.longest}</div>
            <div className="text-xs text-text-secondary">Хамгийн урт streak</div>
          </div>
        </div>

        {/* Certificates */}
        <h2 className="text-lg font-bold text-text-primary mb-4">🎓 {t('certificates')}</h2>

        {certs.length === 0 ? (
          <div className="text-center py-12 text-text-secondary mb-8">
            <div className="text-4xl mb-3">🎓</div>
            <p className="text-sm">{t('noCertificates')}</p>
            <p className="text-xs mt-2 text-text-secondary/60">Тест өгч 18/25 аваад гэрчилгээ аваарай!</p>
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {certs.map(cert => (
              <button
                key={cert.id}
                onClick={() => setSelectedCert(cert)}
                className="w-full bg-navy-surface border border-gold/20 hover:border-gold/50 hover:shadow-[0_0_16px_rgba(245,158,11,0.12)] rounded-xl p-4 flex items-center gap-4 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-gold font-bold">{cert.level}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-text-primary text-sm">
                    {cert.level} Тест гэрчилгээ
                  </div>
                  <div className="text-xs text-text-secondary mt-0.5">
                    {cert.score}/{cert.total} оноо · {formatMongolianDate(cert.date)}
                  </div>
                </div>
                <div className="text-gold text-xs font-medium flex-shrink-0">Харах →</div>
              </button>
            ))}
          </div>
        )}

        {/* Test History */}
        <h2 className="text-lg font-bold text-text-primary mb-4">📋 Шалгалтын түүх</h2>

        {testHistory.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm">Шалгалтын түүх байхгүй байна.</p>
            <p className="text-xs mt-2 text-text-secondary/60">Тест эсвэл IELTS өгсний дараа энд харагдана.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {testHistory.map(entry => (
              <div
                key={entry.id}
                className="bg-navy-surface border border-navy-surface-2 rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-navy-surface-2 flex items-center justify-center flex-shrink-0 text-lg">
                  {entry.type === 'ielts' ? '📝' : '📖'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-text-primary text-sm">
                    {entry.type === 'ielts'
                      ? `IELTS Mock Test`
                      : `${entry.level} Тест`}
                  </div>
                  <div className="text-xs text-text-secondary mt-0.5">
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
git commit -m "fix: clickable certificate cards in profile + test history section"
```

---

## Task 4: Wire QuizMode to saveTestResult

**Files:**
- Modify: `src/components/QuizMode.tsx`

Add `saveTestResult` call in `handleSubmitWriting`, after receiving the writing grade result. Compute the total inline (before React re-renders) so the value is accurate.

- [ ] **Step 1: Add import**

At the top of `src/components/QuizMode.tsx`, add to imports:

```typescript
import { saveTestResult } from '@/lib/testHistory'
```

The full import section becomes:
```typescript
'use client'
import { useState, useEffect } from 'react'
import type { LevelCode } from '@/lib/types'
import { NavBar } from './NavBar'
import { CertificateModal } from './CertificateModal'
import { StreakPopup } from './StreakPopup'
import { recordStudySession } from '@/lib/streak'
import { hasEverPassedLevel } from '@/lib/certificates'
import { saveTestResult } from '@/lib/testHistory'
import { t } from '@/lib/i18n'
```

- [ ] **Step 2: Add saveTestResult call in handleSubmitWriting**

Find the `handleSubmitWriting` function. After `setWritingScore(result.score)` and `setWritingFeedback(result.feedback)`, add the history save. The try-block inside `handleSubmitWriting` becomes:

```typescript
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
      // Compute total inline before state updates batch
      const currentMcScore = mcAnswers.filter((a, i) => a === mcQuestions[i]?.correctIndex).length
      const currentReadingScore = readingAnswers.filter((a, i) => a === readingQuestions[i]?.correctIndex).length * 2
      const currentTotal = currentMcScore + currentReadingScore + result.score
      saveTestResult({ type: 'quiz', level, score: currentTotal, total: 25, passed: currentTotal >= 18 })
    } catch {
      setWritingScore(0)
      setWritingFeedback('Үнэлгээ хийхэд алдаа гарлаа.')
    }
```

- [ ] **Step 3: Run type check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/QuizMode.tsx
git commit -m "feat: save quiz result to test history after grading"
```

---

## Task 5: Wire IELTSTest to saveTestResult

**Files:**
- Modify: `src/components/IELTSTest.tsx`

Add `saveTestResult` call in `submitTest`, alongside the existing `saveIELTSResult` call.

- [ ] **Step 1: Add import**

At the top of `src/components/IELTSTest.tsx`, add to imports:

```typescript
import { saveTestResult } from '@/lib/testHistory'
```

The full import section becomes:
```typescript
'use client'
import { useState } from 'react'
import { NavBar } from './NavBar'
import type { IELTSContent, IELTSAnswers } from '@/lib/ielts'
import { saveIELTSResult } from '@/lib/ielts'
import { saveTestResult } from '@/lib/testHistory'
```

- [ ] **Step 2: Add saveTestResult call in submitTest**

Find the try-block inside `submitTest`. After `saveIELTSResult({...})`, add:

```typescript
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
```

- [ ] **Step 3: Run type check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Run full build**

```bash
npm run build
```

Expected: `✓ Compiled successfully`, zero errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/IELTSTest.tsx
git commit -m "feat: save IELTS result to test history after grading"
```
