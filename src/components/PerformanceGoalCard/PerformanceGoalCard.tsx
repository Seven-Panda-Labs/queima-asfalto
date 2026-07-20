import { useTranslation } from 'react-i18next'
import { ProgressBar } from '../ProgressBar'
import type { PerformanceGoalWithProgress } from '../../types/PerformanceGoal'
import { formatPerformanceGoalLabel } from '../../types/PerformanceGoal'

const STATUS_KEYS: Record<PerformanceGoalWithProgress['status'], string> = {
  achieved: 'goals.performanceAchieved',
  in_progress: 'goals.performanceInProgress',
  no_data: 'goals.performanceNoData',
  failed: 'goals.performanceFailed',
}

type PerformanceGoalCardProps = {
  goal: PerformanceGoalWithProgress
  onEdit?: (goalId: string) => void
  onDelete?: (goal: PerformanceGoalWithProgress) => void
  compact?: boolean
  showActions?: boolean
}

export function PerformanceGoalCard({
  goal,
  onEdit,
  onDelete,
  compact = false,
  showActions = true,
}: PerformanceGoalCardProps) {
  const { t } = useTranslation()
  const isComplete = goal.status === 'achieved'
  const isFailed = goal.status === 'failed'

  return (
    <article
      className={[
        'rounded-lg border bg-surface',
        compact ? 'p-4' : 'p-5',
        isComplete ? 'border-success' : isFailed ? 'border-danger/40' : 'border-border',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={compact ? 'text-2xl' : 'text-3xl'} aria-hidden>
          {goal.emoji ?? '⚡'}
        </div>
        <span
          className={[
            'rounded-full px-2 py-0.5 text-xs font-semibold',
            isComplete
              ? 'bg-success/10 text-success'
              : isFailed
                ? 'bg-danger/10 text-danger'
                : goal.status === 'no_data'
                  ? 'bg-border text-muted'
                  : 'bg-primary/10 text-primary',
          ].join(' ')}
        >
          {t(STATUS_KEYS[goal.status])}
        </span>
      </div>

      <h2
        className={[
          'mt-3 font-display tracking-wide text-primary',
          compact ? 'text-lg' : 'text-2xl',
        ].join(' ')}
      >
        {formatPerformanceGoalLabel(goal)}
      </h2>

      <p className="mt-2 text-sm text-muted">{goal.progressLabel}</p>

      {goal.status !== 'no_data' ? (
        <div className="mt-3">
          <ProgressBar
            current={goal.percent}
            target={100}
            showCounts={false}
            label={isComplete ? undefined : `${goal.percent}%`}
          />
        </div>
      ) : null}

      {showActions && onEdit && onDelete ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onEdit(goal.id)}
            title={t('common.edit')}
            className="rounded-md px-2 py-1 text-sm font-semibold text-primary hover:bg-background"
          >
            ✏️ {t('common.edit')}
          </button>
          <button
            type="button"
            onClick={() => onDelete(goal)}
            title={t('common.delete')}
            className="rounded-md px-2 py-1 text-sm font-semibold text-danger hover:bg-background"
          >
            🗑️ {t('common.delete')}
          </button>
        </div>
      ) : null}
    </article>
  )
}
