import { useTranslation } from 'react-i18next'
import type { GoalBoardEntry } from '../../utils/goalsBoard'

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className: 'h-4 w-4',
  'aria-hidden': true,
} as const

function PencilIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
      <path d="M14 6l4 4" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M4 7h16" />
      <path d="M10 4h4" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

type GoalBoardCardProps = {
  entry: GoalBoardEntry
  onEdit?: (entry: GoalBoardEntry) => void
  onDelete?: (entry: GoalBoardEntry) => void
}

export function GoalBoardCard({ entry, onEdit, onDelete }: GoalBoardCardProps) {
  const { t } = useTranslation()
  const settled = entry.state !== 'pending'
  const failed = entry.state === 'failed'
  const showActions = onEdit !== undefined && onDelete !== undefined

  return (
    <article
      className={[
        'group relative flex h-full flex-col rounded-xl border bg-surface p-4',
        entry.state === 'done'
          ? 'border-success/40'
          : failed
            ? 'border-danger/40'
            : 'border-border',
      ].join(' ')}
    >
      {showActions ? (
        // Escondidos até ao hover ou foco, mas sempre visíveis onde não há rato.
        <div className="absolute end-2 top-2 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 max-sm:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(entry)}
            aria-label={t('common.edit')}
            title={t('common.edit')}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-background hover:text-primary"
          >
            <PencilIcon />
          </button>
          <button
            type="button"
            onClick={() => onDelete(entry)}
            aria-label={t('common.delete')}
            title={t('common.delete')}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-background hover:text-danger"
          >
            <TrashIcon />
          </button>
        </div>
      ) : null}

      <div className="flex items-start gap-3 pe-16">
        <span className="text-2xl leading-none" aria-hidden>
          {entry.emoji}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            {entry.typeLabel}
          </p>
          <h3 className="mt-0.5 font-display text-lg leading-tight tracking-wide text-foreground">
            {entry.title}
          </h3>
        </div>
      </div>

      {entry.hint ? <p className="mt-2 line-clamp-2 text-xs text-muted">{entry.hint}</p> : null}

      {settled ? (
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
          <span
            className={[
              'rounded-full px-2 py-0.5 text-xs font-bold',
              failed ? 'bg-danger/15 text-danger' : 'bg-success/15 text-success',
            ].join(' ')}
          >
            {entry.outcomeLabel}
          </span>
          {entry.kind === 'annual' ? (
            <span className="text-sm font-bold tabular-nums text-foreground">
              {entry.progressText}
            </span>
          ) : null}
        </div>
      ) : entry.measurable ? (
        <div className="mt-auto flex items-center gap-3 pt-3">
          <div
            role="progressbar"
            aria-valuenow={entry.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={entry.title}
            className="h-2 flex-1 overflow-hidden rounded-full bg-border"
          >
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${entry.percent}%` }}
            />
          </div>
          <span className="text-sm font-bold tabular-nums text-foreground">
            {entry.progressText}
          </span>
        </div>
      ) : (
        // Sem barra: aqui ela só saberia mostrar vazio, e vazio lê-se como falhado.
        <div className="mt-auto pt-3">
          <span className="rounded-full bg-border px-2 py-0.5 text-xs font-bold text-muted">
            {entry.progressText}
          </span>
        </div>
      )}
    </article>
  )
}
