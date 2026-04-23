import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

const base = (size: number): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
})

export function BookIcon({ size = 20, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p} aria-hidden>
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5a2.5 2.5 0 0 0 0 5H20" />
      <path d="M4 4.5v18" />
    </svg>
  )
}

export function PencilIcon({ size = 20, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p} aria-hidden>
      <path d="M14.06 4.94l3 3L7.5 17.5l-4 1 1-4 9.56-9.56z" />
      <path d="M13 6l5 5" />
    </svg>
  )
}

export function TargetIcon({ size = 20, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  )
}

export function SparkIcon({ size = 20, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p} aria-hidden>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
    </svg>
  )
}

export function BrainIcon({ size = 20, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p} aria-hidden>
      <path d="M9 4.5A2.5 2.5 0 0 0 6.5 7v0A2.5 2.5 0 0 0 4 9.5v0A2.5 2.5 0 0 0 5 12v0A2.5 2.5 0 0 0 4 14.5v0A2.5 2.5 0 0 0 6.5 17v0A2.5 2.5 0 0 0 9 19.5V4.5z" />
      <path d="M15 4.5A2.5 2.5 0 0 1 17.5 7v0A2.5 2.5 0 0 1 20 9.5v0A2.5 2.5 0 0 1 19 12v0A2.5 2.5 0 0 1 20 14.5v0A2.5 2.5 0 0 1 17.5 17v0A2.5 2.5 0 0 1 15 19.5V4.5z" />
      <path d="M9 4.5h6" />
    </svg>
  )
}

export function ChartIcon({ size = 20, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p} aria-hidden>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  )
}

export function FlameIcon({ size = 20, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p} aria-hidden>
      <path d="M12 3c1.5 3 4 4 4 7a4 4 0 0 1-8 0c0-1.5.7-2.3 1.5-3.5C10.5 4.9 11.5 4 12 3z" />
      <path d="M14.5 14a2.5 2.5 0 1 1-5 0c0-1 .5-1.5 1-2.2.5-.7 1-1.3 1.5-2.3.5 1 1 1.6 1.5 2.3.5.7 1 1.2 1 2.2z" />
    </svg>
  )
}

export function StarIcon({ size = 20, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p} aria-hidden>
      <path d="M12 3l2.7 5.5 6 .9-4.4 4.3 1 6-5.3-2.8-5.3 2.8 1-6L3.3 9.4l6-.9L12 3z" />
    </svg>
  )
}

export function CheckCircleIcon({ size = 20, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" />
    </svg>
  )
}

export function XCircleIcon({ size = 20, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </svg>
  )
}

export function TrophyIcon({ size = 20, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p} aria-hidden>
      <path d="M8 4h8v6a4 4 0 0 1-8 0V4z" />
      <path d="M4 5h4v3a3 3 0 0 1-4 0V5zM16 5h4v3a3 3 0 0 1-4 0V5z" />
      <path d="M9 14h6v2H9zM8 17h8v3H8z" />
    </svg>
  )
}

export function CertificateIcon({ size = 20, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p} aria-hidden>
      <rect x="3" y="4" width="18" height="14" rx="1.5" />
      <path d="M7 8h10M7 12h6" />
      <circle cx="16" cy="14" r="2" />
      <path d="M15 15.5V19l1-.7 1 .7v-3.5" />
    </svg>
  )
}

export function ClipboardIcon({ size = 20, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p} aria-hidden>
      <rect x="5" y="5" width="14" height="16" rx="1.5" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  )
}

export function ArrowRightIcon({ size = 18, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export function ArrowDownIcon({ size = 18, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p} aria-hidden>
      <path d="M12 5v14M6 13l6 6 6-6" />
    </svg>
  )
}

export function UserIcon({ size = 20, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p} aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 4.5-6 8-6s7 2 8 6" />
    </svg>
  )
}

export function NotebookIcon({ size = 20, ...p }: IconProps) {
  return (
    <svg {...base(size)} {...p} aria-hidden>
      <path d="M6 3h13v18H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M9 7h6M9 11h6M9 15h4" />
      <path d="M4 7h2M4 12h2M4 17h2" />
    </svg>
  )
}
