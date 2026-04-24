'use client'
import { useEffect } from 'react'

interface StreakPopupProps {
  streak: number
  onClose: () => void
}

export function StreakPopup({ streak, onClose }: StreakPopupProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4500)
    return () => clearTimeout(timer)
  }, [onClose])

  const isNew = streak === 1
  const encouragement = isNew ? 'Шинэ эхлэл!' : 'Маш сайн байна!'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClose}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') onClose()
      }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-3xl px-8 pt-6 pb-7 flex flex-col items-center text-center animate-slide-up cursor-pointer"
      style={{
        background: 'linear-gradient(180deg, #141C30 0%, #0F1729 100%)',
        border: '1px solid rgba(245,158,11,0.35)',
        boxShadow:
          '0 20px 60px rgba(0,0,0,0.55), 0 0 40px rgba(245,158,11,0.18), inset 0 1px 0 rgba(245,158,11,0.12)',
        minWidth: 300,
        maxWidth: 360,
      }}
    >
      <button
        onClick={e => {
          e.stopPropagation()
          onClose()
        }}
        aria-label="Close"
        className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full transition-colors"
        style={{
          color: 'var(--text-muted)',
          border: '1px solid var(--hairline)',
          background: 'rgba(255,255,255,0.02)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)'
          e.currentTarget.style.color = 'var(--gold)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--hairline)'
          e.currentTarget.style.color = 'var(--text-muted)'
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '4rem', lineHeight: 1 }}>🔥</span>
        <span
          style={{
            fontSize: '4rem',
            fontWeight: 900,
            lineHeight: 1,
            background: 'linear-gradient(135deg, #F59E0B, #FCD34D)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {streak}
        </span>
      </div>

      <div
        className="mt-3 text-[10px] font-semibold uppercase tracking-[0.28em]"
        style={{ color: 'var(--champagne)' }}
      >
        хоног дараалал
      </div>

      <div
        className="mt-2 font-serif-display italic text-base"
        style={{ color: 'var(--text-secondary)' }}
      >
        {encouragement}
      </div>
    </div>
  )
}
