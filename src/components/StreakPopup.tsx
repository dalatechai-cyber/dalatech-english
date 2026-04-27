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
const TRAVEL_DURATION_MS = 580
const CHROME_FADE_MS = 280
const COUNT_UP_MS = 600
const PARTICLE_DELAY_MS = 180
const EASE_OUT_QUART = 'cubic-bezier(0.22, 1, 0.36, 1)'

type Ember = {
  size: number
  xEnd: number
  yEnd: number
  duration: number
  delay: number
  warm: boolean
}

const EMBERS: readonly Ember[] = [
  { size: 6, xEnd: 18, yEnd: -108, duration: 720, delay: 0, warm: true },
  { size: 5, xEnd: -22, yEnd: -120, duration: 760, delay: 60, warm: false },
  { size: 7, xEnd: 8, yEnd: -94, duration: 660, delay: 110, warm: true },
  { size: 4, xEnd: -12, yEnd: -128, duration: 800, delay: 160, warm: false },
]

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function StreakPopup({ streak, onClose }: StreakPopupProps) {
  const previous = streak >= 2 ? streak - 1 : 0
  const [displayed, setDisplayed] = useState(previous)
  const [motionEnabled, setMotionEnabled] = useState(true)
  const flameRef = useRef<HTMLDivElement | null>(null)
  const chromeRef = useRef<HTMLDivElement | null>(null)
  const emberLayerRef = useRef<HTMLDivElement | null>(null)
  const dismissingRef = useRef(false)

  const subtitle = streak === 1 ? 'Шинэ эхлэл.' : 'Маш сайн байна.'

  useEffect(() => {
    setMotionEnabled(!prefersReducedMotion())
  }, [])

  useEffect(() => {
    if (!motionEnabled) return
    const layer = emberLayerRef.current
    if (!layer) return
    const nodes = Array.from(layer.querySelectorAll<HTMLElement>('.streak-ember'))
    const animations: Animation[] = []
    nodes.forEach((el, i) => {
      const p = EMBERS[i]
      if (!p) return
      const anim = el.animate(
        [
          { transform: 'translate(-50%, -50%) scale(1)', opacity: 0 },
          { opacity: 0.92, offset: 0.18 },
          {
            transform: `translate(calc(-50% + ${p.xEnd}px), calc(-50% + ${p.yEnd}px)) scale(0.4)`,
            opacity: 0,
          },
        ],
        {
          duration: p.duration,
          delay: PARTICLE_DELAY_MS + p.delay,
          easing: EASE_OUT_QUART,
          fill: 'forwards',
        },
      )
      animations.push(anim)
    })
    return () => animations.forEach((a) => a.cancel())
  }, [motionEnabled])

  const dismiss = useCallback(() => {
    if (dismissingRef.current) return
    dismissingRef.current = true

    const flame = flameRef.current
    const target = typeof document !== 'undefined' ? document.getElementById(FLAME_TARGET_ID) : null
    const reduced = prefersReducedMotion()

    if (!flame || !target || reduced) {
      const chrome = chromeRef.current
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

    flame.style.position = 'fixed'
    flame.style.left = `${srcRect.left}px`
    flame.style.top = `${srcRect.top}px`
    flame.style.width = `${srcRect.width}px`
    flame.style.height = `${srcRect.height}px`
    flame.style.margin = '0'
    flame.style.zIndex = '70'
    flame.style.pointerEvents = 'none'
    flame.style.transformOrigin = '50% 50%'

    const dx = dstRect.left + dstRect.width / 2 - (srcRect.left + srcRect.width / 2)
    const dy = dstRect.top + dstRect.height / 2 - (srcRect.top + srcRect.height / 2)
    const scale = dstRect.width / srcRect.width

    // Subtle arc: flame rises slightly before settling. Apex at ~42% of the way.
    const arcLift = Math.min(38, Math.max(18, Math.abs(dy) * 0.14))
    const midX = dx * 0.42
    const midY = dy * 0.42 - arcLift
    const midScale = 1 + (scale - 1) * 0.42

    const startFilter =
      'drop-shadow(0 18px 32px rgba(245, 158, 11, 0.28)) drop-shadow(0 6px 12px rgba(0, 0, 0, 0.55))'
    const trailFilter =
      'drop-shadow(0 0 36px rgba(245, 158, 11, 0.55)) drop-shadow(0 6px 14px rgba(0, 0, 0, 0.4))'
    const endFilter = 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.18))'

    const travel = flame.animate(
      [
        { transform: 'translate(0, 0) scale(1)', opacity: 1, filter: startFilter },
        {
          transform: `translate(${midX}px, ${midY}px) scale(${midScale})`,
          opacity: 1,
          filter: trailFilter,
          offset: 0.42,
        },
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 1, filter: endFilter },
      ],
      { duration: TRAVEL_DURATION_MS, easing: EASE_OUT_QUART, fill: 'forwards' }
    )

    if (chromeRef.current) {
      chromeRef.current.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration: CHROME_FADE_MS, easing: 'ease-out', fill: 'forwards' }
      )
    }

    travel.onfinish = () => onClose()
  }, [onClose])

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
        <div className="relative" style={{ width: POPUP_FLAME_SIZE, height: POPUP_FLAME_SIZE }}>
          <div
            ref={flameRef}
            style={{
              width: POPUP_FLAME_SIZE,
              height: POPUP_FLAME_SIZE,
              filter:
                'drop-shadow(0 18px 32px rgba(245, 158, 11, 0.28)) drop-shadow(0 6px 12px rgba(0, 0, 0, 0.55))',
            }}
          >
            <StreakFlame size={POPUP_FLAME_SIZE} />
          </div>

          {motionEnabled && (
            <div
              ref={emberLayerRef}
              aria-hidden
              className="absolute inset-0 pointer-events-none"
            >
              {EMBERS.map((p, i) => (
                <span
                  key={i}
                  className="streak-ember"
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '42%',
                    width: p.size,
                    height: p.size,
                    borderRadius: '9999px',
                    background: p.warm
                      ? 'radial-gradient(circle, rgba(252,211,77,0.95) 0%, rgba(245,158,11,0.55) 55%, rgba(217,119,6,0) 100%)'
                      : 'radial-gradient(circle, rgba(245,158,11,0.95) 0%, rgba(217,119,6,0.55) 55%, rgba(217,119,6,0) 100%)',
                    transform: 'translate(-50%, -50%)',
                    opacity: 0,
                    willChange: 'transform, opacity',
                  }}
                />
              ))}
            </div>
          )}
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
