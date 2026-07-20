import { useTranslation } from 'react-i18next'

type ProgressBarProps = {
  current: number
  target: number
  label?: string
  showCounts?: boolean
}

export function ProgressBar({ current, target, label, showCounts = true }: ProgressBarProps) {
  const { t } = useTranslation()
  const percent = target > 0 ? Math.min(100, (current / target) * 100) : 0
  const isComplete = current >= target

  return (
    <div className="w-full">
      {label ? <p className="mb-1 text-sm font-semibold text-foreground">{label}</p> : null}
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-label={label ?? t('progress.countOf', { current, target })}
        className="h-3 overflow-hidden rounded-lg bg-border"
      >
        <div
          className={[
            'h-full rounded-lg transition-all',
            isComplete ? 'bg-success' : 'bg-success',
          ].join(' ')}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showCounts ? (
        <p className="mt-1 text-sm font-bold text-foreground">
          {current}/{target}
          {isComplete ? <span className="ml-2 text-success">✓</span> : null}
        </p>
      ) : null}
    </div>
  )
}
