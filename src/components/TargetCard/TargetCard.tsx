import type { DashboardTarget } from '../../utils/dashboardHighlights'

/**
 * Objetivo por cumprir. A barra é laranja de propósito: o verde fica
 * reservado às conquistas, para se distinguir num relance o que já está feito.
 */
export function TargetCard({ target }: { target: DashboardTarget }) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none" aria-hidden>
          {target.emoji}
        </span>
        <h3 className="font-display text-lg leading-tight tracking-wide text-foreground">
          {target.title}
        </h3>
      </div>

      {target.hint ? <p className="mt-2 line-clamp-2 text-xs text-muted">{target.hint}</p> : null}

      <div className="mt-auto flex items-center gap-3 pt-3">
        <div
          role="progressbar"
          aria-valuenow={target.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={target.title}
          className="h-2 flex-1 overflow-hidden rounded-full bg-border"
        >
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${target.percent}%` }}
          />
        </div>
        <span className="text-sm font-bold tabular-nums text-foreground">
          {target.progressText}
        </span>
      </div>
    </article>
  )
}
