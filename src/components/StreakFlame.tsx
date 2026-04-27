'use client'
import { useId } from 'react'

interface StreakFlameProps {
  size?: number
  className?: string
  animated?: boolean
}

export function StreakFlame({ size = 24, className, animated = true }: StreakFlameProps) {
  const uid = useId().replace(/:/g, '')
  const bodyId = `flame-body-${uid}`
  const coreId = `flame-core-${uid}`
  const tipId = `flame-tip-${uid}`
  const highlightId = `flame-highlight-${uid}`
  const baseId = `flame-base-${uid}`

  return (
    <span
      className={['streak-flame', animated ? 'streak-flame-animated' : '', className].filter(Boolean).join(' ')}
      style={{ width: size, height: size, display: 'inline-block', lineHeight: 0 }}
      aria-hidden
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 80"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <radialGradient id={bodyId} cx="50%" cy="68%" r="65%" fx="50%" fy="78%">
            <stop offset="0%" stopColor="#FFB347" />
            <stop offset="35%" stopColor="#FF8533" />
            <stop offset="65%" stopColor="#E64A1F" />
            <stop offset="100%" stopColor="#9B1B14" />
          </radialGradient>

          <radialGradient id={coreId} cx="50%" cy="68%" r="55%" fx="50%" fy="78%">
            <stop offset="0%" stopColor="#FFE082" />
            <stop offset="40%" stopColor="#FFC04A" />
            <stop offset="80%" stopColor="#FF8A1F" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FF6F00" stopOpacity="0" />
          </radialGradient>

          <radialGradient id={tipId} cx="50%" cy="55%" r="40%" fx="50%" fy="62%">
            <stop offset="0%" stopColor="#FFF8C4" />
            <stop offset="50%" stopColor="#FFE072" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#FFC04A" stopOpacity="0" />
          </radialGradient>

          <radialGradient id={highlightId} cx="42%" cy="52%" r="22%" fx="42%" fy="52%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>

          <radialGradient id={baseId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF4514" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#9B1B14" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#9B1B14" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="32" cy="70" rx="18" ry="6" fill={`url(#${baseId})`} />

        <g className="streak-flame-body">
          <path
            d="M32 4 C 24 18, 14 24, 14 42 C 14 56, 22 68, 32 70 C 42 68, 50 56, 50 42 C 50 30, 44 26, 40 18 C 38 14, 36 9, 32 4 Z"
            fill={`url(#${bodyId})`}
          />
          <path
            d="M32 16 C 27 26, 22 32, 22 44 C 22 54, 26 62, 32 64 C 38 62, 42 54, 42 44 C 42 36, 38 32, 36 26 C 34 22, 33 19, 32 16 Z"
            fill={`url(#${coreId})`}
          />
          <path
            d="M32 26 C 29 32, 27 38, 28 46 C 29 52, 31 56, 32 56 C 33 56, 35 52, 36 46 C 37 38, 35 32, 32 26 Z"
            fill={`url(#${tipId})`}
          />
          <ellipse cx="27" cy="36" rx="5" ry="9" fill={`url(#${highlightId})`} />
        </g>
      </svg>
    </span>
  )
}
