interface ProgressBarProps {
  completed: number
  total: number
  label?: string
}

export function ProgressBar({ completed, total, label }: ProgressBarProps) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs text-text-secondary mb-1">
          <span>{label}</span>
          <span>{completed}/{total}</span>
        </div>
      )}
      <div className="w-full h-2 bg-navy-surface-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-gold rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
