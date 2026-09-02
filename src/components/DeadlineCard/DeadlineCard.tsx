import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { buildRaceEntryFunnel, nextDateFor } from '../../domain/raceEntryFunnel'
import { formatDatePt } from '../../utils/date'
import type { BucketListItem } from '../../types/BucketListItem'
import type { RaceEntry } from '../../types/RaceEntry'

type DeadlineCardProps = {
  items: readonly BucketListItem[]
  entries: readonly RaceEntry[]
}

/**
 * The card that brings somebody back outside race season.
 *
 * Renders only when a gate is actually open or closing. A card that is always
 * there saying nothing needs doing is furniture: this one is either urgent or
 * absent.
 */
export function DeadlineCard({ items, entries }: DeadlineCardProps) {
  const { t } = useTranslation()
  const rows = buildRaceEntryFunnel(items, entries).find(
    (group) => group.key === 'action_needed',
  )?.rows

  if (!rows || rows.length === 0) return null

  const first = rows[0]!
  const date = nextDateFor(first.entry)

  return (
    <Link
      to="/bucket-list"
      className="block rounded-xl border border-accent/40 bg-accent/5 p-4 transition-colors hover:bg-accent/10"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
        {t('funnel.groups.action_needed', { count: rows.length })}
      </p>
      <p className="mt-1 font-display text-lg leading-tight tracking-wide text-foreground">
        {first.item.name}
      </p>
      {date ? <p className="mt-1 text-sm text-muted">{formatDatePt(date)}</p> : null}
      {rows.length > 1 ? (
        <p className="mt-2 text-xs text-muted">
          {t('funnel.andOthers', { count: rows.length - 1 })}
        </p>
      ) : null}
    </Link>
  )
}
