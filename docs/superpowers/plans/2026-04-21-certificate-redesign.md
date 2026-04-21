# Certificate Redesign + One-Time-Per-Level Logic

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the certificate to look like a premium official document and enforce that the certificate modal only appears the first time a student passes each level.

**Architecture:** Add `hasEverPassedLevel(level)` to `certificates.ts`. Update `QuizMode` to check this before showing the modal — subsequent passes show an inline congratulations message instead. `CertificateModal` is fully rewritten with CSS geometric pattern background, double-border frame, and official typography matching the spec.

**Tech Stack:** Next.js 14, React 18, Tailwind CSS, inline SVG pattern, html2canvas (existing)

---

## File Map

| File | Change |
|---|---|
| `src/lib/certificates.ts` | Add `hasEverPassedLevel()` export |
| `src/components/QuizMode.tsx` | Check `hasEverPassedLevel` before showing cert; show "already earned" message on repeat pass |
| `src/components/CertificateModal.tsx` | Full visual redesign per spec |

---

## Task 1: Add `hasEverPassedLevel` to certificates lib

**Files:**
- Modify: `src/lib/certificates.ts`

- [ ] **Step 1: Add the function**

Append to the end of `src/lib/certificates.ts`:

```typescript
export function hasEverPassedLevel(level: LevelCode): boolean {
  return loadCertificates().some(c => c.level === level && c.type === 'quiz')
}
```

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/certificates.ts
git commit -m "feat: add hasEverPassedLevel helper for one-time certificate logic"
```

---

## Task 2: Update QuizMode — one-time certificate, "already earned" message on repeat pass

**Files:**
- Modify: `src/components/QuizMode.tsx`

- [ ] **Step 1: Read `src/components/QuizMode.tsx`**

Read the file to confirm current state.

- [ ] **Step 2: Add `hasEverPassedLevel` import**

Find the import from `@/lib/certificates` (there isn't one yet — CertificateModal handles saving). Add a new import at the top:

```typescript
import { hasEverPassedLevel } from '@/lib/certificates'
```

- [ ] **Step 3: Add `alreadyHasCert` state**

In the `QuizMode` function body, after the existing state declarations, add:

```typescript
  const [alreadyHasCert, setAlreadyHasCert] = useState(false)
```

- [ ] **Step 4: Update the "Гэрчилгээ авах" button logic in the results view**

Find the button:
```tsx
            {passed && (
              <button
                onClick={() => setShowCertificate(true)}
                className="w-full bg-gold hover:bg-gold-dark text-navy font-bold py-3 min-h-[48px] rounded-xl transition-colors"
              >
                🎓 Гэрчилгээ авах
              </button>
            )}
```

Replace with:
```tsx
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
```

- [ ] **Step 5: Set `alreadyHasCert` when results appear**

Find `setState('results')` in `handleNext`:
```typescript
      setState('results')
```

Replace with:
```typescript
      setAlreadyHasCert(hasEverPassedLevel(level))
      setState('results')
```

- [ ] **Step 6: Run type check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/QuizMode.tsx
git commit -m "feat: one-time certificate — show modal only on first pass, message on repeat"
```

---

## Task 3: Premium Certificate visual redesign

**Files:**
- Modify: `src/components/CertificateModal.tsx`

Replace the entire file with the premium design:

- [ ] **Step 1: Write the new `src/components/CertificateModal.tsx`**

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

const DIAGONAL_PATTERN = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40L40 0M10 40L40 10M0 30L30 0M20 40L40 20M0 20L20 0M30 40L40 30M0 10L10 0' stroke='%23F59E0B' stroke-width='0.5' stroke-opacity='0.06'/%3E%3C/svg%3E")`

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
    const appUrl = 'https://core-english.vercel.app'
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}`
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (isMobile) {
      window.location.href = shareUrl
    } else {
      window.open(shareUrl, 'fb-share-dialog', 'width=626,height=436,toolbar=0,status=0,menubar=0,scrollbars=yes,resizable=yes')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Outer double-border frame */}
        <div
          ref={certRef}
          style={{
            background: '#0F172A',
            backgroundImage: DIAGONAL_PATTERN,
            border: '3px solid #F59E0B',
            borderRadius: '16px',
            padding: '8px',
            minHeight: '600px',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {/* Inner border container */}
          <div
            style={{
              border: '1px solid rgba(245,158,11,0.6)',
              borderRadius: '10px',
              background: '#1E293B',
              padding: '32px 28px',
              minHeight: '580px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            {/* Corner ornaments */}
            <div style={{ position:'absolute', top:12, left:12, width:16, height:16, border:'2px solid #F59E0B', transform:'rotate(45deg)', opacity:0.8 }} />
            <div style={{ position:'absolute', top:12, right:12, width:16, height:16, border:'2px solid #F59E0B', transform:'rotate(45deg)', opacity:0.8 }} />
            <div style={{ position:'absolute', bottom:12, left:12, width:16, height:16, border:'2px solid #F59E0B', transform:'rotate(45deg)', opacity:0.8 }} />
            <div style={{ position:'absolute', bottom:12, right:12, width:16, height:16, border:'2px solid #F59E0B', transform:'rotate(45deg)', opacity:0.8 }} />

            {/* Brand */}
            <div style={{ color:'#F59E0B', letterSpacing:'0.3em', fontSize:'12px', fontWeight:700, textTransform:'uppercase', marginBottom:'8px' }}>
              CORE ENGLISH
            </div>

            {/* Top ornament line */}
            <div style={{ color:'#F59E0B', fontSize:'11px', letterSpacing:'0.15em', marginBottom:'16px', opacity:0.9 }}>
              ◆───────────────◆
            </div>

            {/* "АКАДЕМИК АМЖИЛТЫН" */}
            <div style={{ color:'#F59E0B', letterSpacing:'0.2em', fontSize:'11px', fontWeight:600, textTransform:'uppercase', marginBottom:'6px', opacity:0.8 }}>
              АКАДЕМИК АМЖИЛТЫН
            </div>

            {/* "ГЭРЧИЛГЭЭ" */}
            <div style={{ color:'#FFFFFF', fontSize:'36px', fontWeight:800, letterSpacing:'0.1em', marginBottom:'20px' }}>
              {t('certificate')}
            </div>

            {/* Trophy */}
            <div style={{ fontSize:'48px', marginBottom:'16px', lineHeight:1 }}>🏆</div>

            {/* Level */}
            <div style={{
              color:'#F59E0B',
              fontSize:'72px',
              fontWeight:900,
              lineHeight:1,
              marginBottom:'8px',
              textShadow: '0 0 40px rgba(245,158,11,0.5), 0 0 80px rgba(245,158,11,0.2)',
            }}>
              {level}
            </div>

            <div style={{ color:'#FFFFFF', fontSize:'16px', marginBottom:'20px', opacity:0.9 }}>
              түвшний тестийг амжилттай өглөө
            </div>

            {/* Score */}
            <div style={{ color:'#F59E0B', fontSize:'18px', fontWeight:600, marginBottom:'12px' }}>
              Оноо: {score}/{total}
            </div>

            {/* Bottom ornament */}
            <div style={{ color:'#F59E0B', fontSize:'11px', letterSpacing:'0.15em', marginBottom:'12px', opacity:0.9 }}>
              ◆───────────────◆
            </div>

            {/* Date */}
            <div style={{ color:'rgba(248,250,252,0.6)', fontSize:'13px', marginBottom:'12px' }}>
              {formatMongolianDate(today)}
            </div>

            {/* Attribution */}
            <div style={{ color:'rgba(245,158,11,0.45)', fontSize:'11px', letterSpacing:'0.1em', marginTop:'auto', paddingTop:'8px' }}>
              Powered by Dalatech.ai
            </div>
          </div>
        </div>

        {/* Action buttons */}
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

- [ ] **Step 2: Run type check and build**

```bash
npx tsc --noEmit && npm run build
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/CertificateModal.tsx
git commit -m "feat: premium certificate redesign — double border, diagonal pattern, corner ornaments, 72px level code"
```
