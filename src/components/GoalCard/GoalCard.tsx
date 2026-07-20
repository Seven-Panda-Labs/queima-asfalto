import { useTranslation } from 'react-i18next'
import { ProgressBar } from '../ProgressBar'
import type { GoalWithProgress } from '../../types/Goal'
import { formatGoalLabel, formatGoalOutcomeLabel } from '../../types/Goal'

type GoalCardProps = {
  goal: GoalWithProgress
  onEdit?: (goalId: string) => void
  onDelete?: (goal: GoalWithProgress) => void
  compact?: boolean
  showActions?: boolean
}

const OUTCOME_STYLES: Record<
  GoalWithProgress['outcome'],
  { border: string; badge: string }
> = {
  in_progress: { border: 'border-border', badge: '' },
  achieved: { border: 'border-success', badge: 'bg-success/10 text-success' },
  exceeded: { border: 'border-primary', badge: 'bg-primary/10 text-primary' },
  crushed: { border: 'border-accent', badge: 'bg-accent/10 text-accent' },
  failed: { border: 'border-danger/40', badge: 'bg-danger/10 text-danger' },
}

export function GoalCard({
  goal,
  onEdit,
  onDelete,
  compact = false,
  showActions = true,
}: GoalCardProps) {
  const { t } = useTranslation()
  const styles = OUTCOME_STYLES[goal.outcome]
  const outcomeLabel = formatGoalOutcomeLabel(goal.outcome)

  return (
    <article
      className={[
        'rounded-lg border bg-surface',
        compact ? 'p-4' : 'p-5',
        styles.border,
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={compact ? 'text-2xl' : 'text-3xl'} aria-hidden>
          {goal.emoji ?? '🏃'}
        </div>
        {outcomeLabel ? (
          <span className={['rounded-full px-2 py-0.5 text-xs font-semibold', styles.badge].join(' ')}>
            {outcomeLabel}
          </span>
        ) : null}
      </div>

      <h2
        className={[
          'mt-3 font-display tracking-wide text-primary',
          compact ? 'text-lg' : 'text-2xl',
        ].join(' ')}
      >
        {formatGoalLabel(goal)}
      </h2>
      <div className="mt-3">
        <ProgressBar current={goal.currentCount} target={goal.targetCount} />
      </div>

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
