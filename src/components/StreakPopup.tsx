'use client'
import { useEffect } from 'react'

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
  const message = isNew
    ? 'Шинэ эхлэл! Өнөөдрөөс дахин эхэлцгээе 💪'
    : `Өнөөдөр ч үргэлжлүүллээ! 🔥 ${streak} хоног`

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-navy-surface border border-gold/40 rounded-2xl px-6 py-4 shadow-xl flex items-center gap-3 animate-slide-up"
      onClick={onClose}
    >
      <span className="text-2xl">{isNew ? '💪' : '🔥'}</span>
      <p className="text-text-primary text-sm font-medium">{message}</p>
      <button onClick={onClose} className="text-text-secondary hover:text-text-primary ml-2 text-lg">×</button>
    </div>
  )
}
