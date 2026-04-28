'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { StreakFlame } from './StreakFlame'

interface StreakPopupProps {
  streak: number
  onClose: () => void
}

const FLAME_TARGET_ID = 'navbar-streak-flame'
const POPUP_FLAME_SIZE = 140
const AUTO_DISMISS_MS = 2000
const TRAVEL_DURATION_MS = 620
const CHROME_FADE_MS = 280
const COUNT_UP_MS = 600
const ARRIVAL_LEAD_MS = 160
const EASE_OUT_QUART = 'cubic-bezier(0.22, 1, 0.36, 1)'

const PARTICLES = [
  { dx: -22, dy: -56, delay: 60,  size: 8,  duration: 720 },
  { dx:  18, dy: -68, delay: 0,   size: 9,  duration: 760 },
  { dx:  34, dy: -44, delay: 140, size: 7,  duration: 680 },
  { dx: -38, dy: -38, delay: 200, size: 6,  duration: 660 },
  { dx:   4, dy: -78, delay: 90,  size: 10, duration: 800 },
]

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function StreakPopup({ streak, onClose }: StreakPopupProps) {
  const previous = streak >= 2 ? streak - 1 : 0
  const [displayed, setDisplayed] = useState(previous)
  const flameRef = useRef<HTMLDivElement | null>(null)
  const chromeRef = useRef<HTMLDivElement | null>(null)
  const dismissingRef = useRef(false)
  const cloneRef = useRef<HTMLDivElement | null>(null)

  const subtitle = streak === 1 ? 'Шинэ эхлэл.' : 'Маш сайн байна.'

  const dismiss = useCallback(() => {
    if (dismissingRef.current) return
    dismissingRef.current = true

    const flame = flameRef.current
    const target = typeof document !== 'undefined' ? document.getElementById(FLAME_TARGET_ID) : null
    const reduced = prefersReducedMotion()

    if (!flame || !target || reduced) {
      const chrome = chromeRef.current
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('streak:flame-arriving', { detail: { current: streak } }))
      }
      if (chrome && !reduced) {
        const anim = chrome.animate(
          [{ opacity: 1 }, { opacity: 0 }],
          { duration: 160, easing: 'ease-out', fill: 'forwards' }
        )
        anim.onfinish = () => onClose()
      } else {
        onClose()
      }
      return
    }

    const srcRect = flame.getBoundingClientRect()
    const dstRect = target.getBoundingClientRect()

    // The popup's stage retains `transform: scale(1)` via animation-fill-mode: both,
    // which makes it a containing block for position:fixed descendants. Clone the flame
    // onto document.body so position:fixed resolves against the viewport.
    const clone = flame.cloneNode(true) as HTMLDivElement
    clone.style.position = 'fixed'
    clone.style.left = `${srcRect.left}px`
    clone.style.top = `${srcRect.top}px`
    clone.style.width = `${srcRect.width}px`
    clone.style.height = `${srcRect.height}px`
    clone.style.margin = '0'
    clone.style.zIndex = '70'
    clone.style.pointerEvents = 'none'
    clone.style.transformOrigin = '50% 50%'
    clone.style.willChange = 'transform, filter, opacity'
    document.body.appendChild(clone)
    cloneRef.current = clone

    flame.style.opacity = '0'

    const dx = dstRect.left + dstRect.width / 2 - (srcRect.left + srcRect.width / 2)
    const dy = dstRect.top + dstRect.height / 2 - (srcRect.top + srcRect.height / 2)
    const finalScale = dstRect.width / srcRect.width

    const dist = Math.hypot(dx, dy)
    const arcPeak = Math.max(48, dist * 0.15)

    const tx = (t: number) => t * dx
    const ty = (t: number) => {
      // Parabola: 4t(1-t) peaks at t=0.5 with value 1. Lift the path by arcPeak * peak.
      const peak = 4 * t * (1 - t)
      return t * dy - arcPeak * peak
    }
    const sc = (t: number) => 1 + (finalScale - 1) * t

    const offsets = [0, 0.2, 0.4, 0.6, 0.8, 1]
    const transformKeyframes = offsets.map(t => ({
      offset: t,
      transform: `translate(${tx(t).toFixed(2)}px, ${ty(t).toFixed(2)}px) scale(${sc(t).toFixed(4)})`,
    }))

    const travel = clone.animate(
      [
        { ...transformKeyframes[0], filter: 'drop-shadow(0 12px 24px rgba(245, 158, 11, 0.32))', opacity: 1 },
        { ...transformKeyframes[1], filter: 'drop-shadow(0 6px 18px rgba(245, 158, 11, 0.42)) drop-shadow(0 0 22px rgba(245, 158, 11, 0.28))', opacity: 1 },
        { ...transformKeyframes[2], filter: 'drop-shadow(0 0 24px rgba(245, 158, 11, 0.55)) drop-shadow(0 0 44px rgba(245, 158, 11, 0.32))', opacity: 1 },
        { ...transformKeyframes[3], filter: 'drop-shadow(0 0 22px rgba(245, 158, 11, 0.45)) drop-shadow(0 0 36px rgba(245, 158, 11, 0.22))', opacity: 1 },
        { ...transformKeyframes[4], filter: 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.28))', opacity: 0.55 },
        { ...transformKeyframes[5], filter: 'drop-shadow(0 0 0 rgba(245, 158, 11, 0))', opacity: 0 },
      ],
      { duration: TRAVEL_DURATION_MS, easing: EASE_OUT_QUART, fill: 'forwards' }
    )

    if (chromeRef.current) {
      chromeRef.current.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration: CHROME_FADE_MS, easing: 'ease-out', fill: 'forwards' }
      )
    }

    // Notify NavBar so it can pulse just as the flame is arriving.
    const arrivalLead = Math.max(0, TRAVEL_DURATION_MS - ARRIVAL_LEAD_MS)
    const arrivalTimer = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('streak:flame-arriving', { detail: { current: streak } }))
    }, arrivalLead)

    travel.onfinish = () => {
      window.clearTimeout(arrivalTimer)
      if (cloneRef.current && cloneRef.current.parentNode) {
        cloneRef.current.parentNode.removeChild(cloneRef.current)
        cloneRef.current = null
      }
      onClose()
    }
  }, [onClose, streak])

  useEffect(() => {
    const reduced = prefersReducedMotion()
    if (reduced || streak === previous) {
      setDisplayed(streak)
      return
    }
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_UP_MS)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplayed(Math.round(previous + (streak - previous) * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [streak, previous])

  useEffect(() => {
    const timer = setTimeout(dismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [dismiss])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        dismiss()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [dismiss])

  // Clean up clone if user navigates away mid-animation.
  useEffect(() => {
    return () => {
      if (cloneRef.current && cloneRef.current.parentNode) {
        cloneRef.current.parentNode.removeChild(cloneRef.current)
        cloneRef.current = null
      }
    }
  }, [])

  const reduced = typeof window !== 'undefined' && prefersReducedMotion()

  return (
    <div
      ref={chromeRef}
      role="dialog"
      aria-modal="true"
      aria-label="Streak celebration"
      onClick={dismiss}
      className="fixed inset-0 z-[60] flex items-center justify-center cursor-pointer"
    >
      <div
        className="absolute inset-0 streak-backdrop-enter"
        style={{ background: 'rgba(7, 12, 24, 0.92)' }}
      />

      <button
        onClick={(e) => {
          e.stopPropagation()
          dismiss()
        }}
        aria-label="Хаах"
        className="absolute top-5 right-5 w-11 h-11 flex items-center justify-center rounded-full transition-colors"
        style={{
          color: 'var(--candlelight-gold-dark)',
          border: '1px solid var(--hairline)',
          background: 'transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--candlelight-gold)'
          e.currentTarget.style.borderColor = 'var(--hairline-gold)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--candlelight-gold-dark)'
          e.currentTarget.style.borderColor = 'var(--hairline)'
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      <div className="relative streak-stage-enter flex flex-col items-center text-center px-6">
        <div
          className="relative"
          style={{ width: POPUP_FLAME_SIZE, height: POPUP_FLAME_SIZE }}
        >
          <div
            ref={flameRef}
            style={{
              width: POPUP_FLAME_SIZE,
              height: POPUP_FLAME_SIZE,
              filter: 'drop-shadow(0 18px 32px rgba(245, 158, 11, 0.28)) drop-shadow(0 6px 12px rgba(0, 0, 0, 0.55))',
            }}
          >
            <StreakFlame size={POPUP_FLAME_SIZE} />
          </div>

          {!reduced && PARTICLES.map((p, i) => (
            <span
              key={i}
              aria-hidden
              className="streak-ember"
              style={{
                position: 'absolute',
                left: '50%',
                top: '38%',
                width: p.size,
                height: p.size,
                marginLeft: -p.size / 2,
                marginTop: -p.size / 2,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255, 232, 160, 0.95) 0%, rgba(245, 158, 11, 0.85) 40%, rgba(217, 119, 6, 0) 80%)',
                pointerEvents: 'none',
                ['--ember-dx' as string]: `${p.dx}px`,
                ['--ember-dy' as string]: `${p.dy}px`,
                animationDelay: `${p.delay}ms`,
                animationDuration: `${p.duration}ms`,
              }}
            />
          ))}
        </div>

        <div
          className="font-serif-display nums-tabular mt-8"
          style={{
            color: 'var(--candlelight-gold)',
            fontSize: 'clamp(72px, 14vw, 128px)',
            fontWeight: 400,
            lineHeight: 0.95,
            letterSpacing: '-0.02em',
            fontStyle: 'italic',
          }}
        >
          {displayed}
        </div>

        <div
          lang="mn"
          className="mt-4 text-[11px] font-semibold uppercase"
          style={{
            color: 'var(--candlelight-gold-dark)',
            letterSpacing: '0.18em',
          }}
        >
          Хоног Дараалал
        </div>

        <div
          className="mt-5 font-serif-display italic"
          style={{
            color: 'var(--vellum-champagne)',
            fontSize: 'clamp(15px, 2vw, 18px)',
            lineHeight: 1.4,
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  )
}
