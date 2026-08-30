import type { ReactNode } from 'react'

type AnalysisSectionProps = {
  title: string
  /** What the section answers, in one line. */
  hint?: string
  /** Shown instead of the content when there is not enough data. */
  empty?: string
  aside?: ReactNode
  children?: ReactNode
}

/** Below its minimum a block says what is missing rather than drawing a trend through two points. */
export function AnalysisSection({ title, hint, empty, aside, children }: AnalysisSectionProps) {
  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-2xl tracking-wide text-foreground">{title}</h2>
        {aside}
      </div>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}

      {empty ? (
        <p className="mt-3 rounded-xl border border-dashed border-border bg-surface px-4 py-6 text-center text-sm text-muted">
          {empty}
        </p>
      ) : (
        <div className="mt-3">{children}</div>
      )}
    </section>
  )
}

export type StatItem = {
  key: string
  value: string
  label: string
  /** Change against the previous season. */
  delta?: string
  deltaTone?: 'good' | 'bad' | 'neutral'
}

const DELTA_CLASS: Record<NonNullable<StatItem['deltaTone']>, string> = {
  good: 'text-success',
  bad: 'text-danger',
  neutral: 'text-muted',
}

/** The Dashboard strip's grammar, with auto columns: the analysis shows more than three numbers. */
export function StatGrid({ items }: { items: StatItem[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-px overflow-hidden rounded-xl border border-border bg-border">
      {items.map((item) => (
        <div key={item.key} className="bg-surface px-4 py-4">
          <p className="flex flex-wrap items-baseline gap-x-2 font-display text-3xl leading-none tracking-wide text-foreground">
            {item.value}
            {item.delta ? (
              <span
                className={[
                  'font-sans text-sm font-semibold',
                  DELTA_CLASS[item.deltaTone ?? 'neutral'],
                ].join(' ')}
              >
                {item.delta}
              </span>
            ) : null}
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  )
}
