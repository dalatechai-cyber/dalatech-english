'use client'
import { useEffect } from 'react'
import { FlameIcon } from './Icon'

interface StreakPopupProps {
  streak: number
  onClose: () => void
}

export function StreakPopup({ streak, onClose }: StreakPopupProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  const isNew = streak === 1
  const label = isNew ? 'Шинэ эхлэл' : 'Үргэлжилсэн цуврал'
  const caption = isNew
    ? 'Өнөөдрөөс дахин эхэлцгээе.'
    : 'Өнөөдөр ч үргэлжлүүллээ.'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClose}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') onClose()
      }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-2xl px-6 py-5 flex items-center gap-5 animate-slide-up shadow-editorial cursor-pointer"
      style={{
        background: '#141C30',
        border: '1px solid var(--hairline)',
        borderLeftWidth: '3px',
        borderLeftColor: 'var(--gold)',
        minWidth: 280,
      }}
    >
      <span
        className="flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0"
        style={{
          background: 'rgba(245,158,11,0.12)',
          color: 'var(--gold)',
          border: '1px solid rgba(245,158,11,0.25)',
        }}
      >
        <FlameIcon size={24} />
      </span>

      <div className="flex-1 min-w-0">
        <div
          className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-0.5"
          style={{ color: 'var(--champagne)' }}
        >
          {label}
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className="font-serif-display text-3xl font-bold leading-none nums-tabular"
            style={{
              background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 50%, #E4C08A 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {streak}
          </span>
          <span
            className="text-[11px] uppercase tracking-wider font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            хоног
          </span>
        </div>
        <div
          className="text-[12px] mt-1 font-serif-display italic"
          style={{ color: 'var(--text-secondary)' }}
        >
          {caption}
        </div>
      </div>

      <button
        onClick={e => {
          e.stopPropagation()
          onClose()
        }}
        aria-label="Close"
        className="flex items-center justify-center w-8 h-8 rounded-full transition-colors flex-shrink-0"
        style={{
          color: 'var(--text-muted)',
          border: '1px solid var(--hairline)',
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
    </div>
  )
}
