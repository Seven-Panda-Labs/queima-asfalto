import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { formatEventTypeLabel } from '../../i18n/formatters'
import { SeasonNotes } from '../../components/SeasonNotes'
import type { SeasonAnnotation } from '../../domain/seasonBoard'
import type { BucketListItem } from '../../types/BucketListItem'

type WishListProps = {
  items: readonly BucketListItem[]
  /** Keyed by race identity, which is what survives a wish being scheduled. */
  season: Map<string, SeasonAnnotation>
  /** Anchors by race identity: the flag is on the race, not on the wish. */
  anchorRaceIds: ReadonlySet<string>
  /** Rendered at the end of every row: the icons the page already had. */
  actions: (item: BucketListItem) => ReactNode
}

/**
 * The wishes, as a list of races somebody wants to run one day.
 *
 * It used to be the entry funnel, grouped by what each row was waiting on, and
 * that was two jobs in one list: a dream has nothing to wait for, and the
 * paperwork of a lottery belongs to a race already in the calendar. What is
 * left here is the dream, which needs no groups.
 */
export function WishList({ items, season, anchorRaceIds, actions }: WishListProps) {
  const { t } = useTranslation()

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
      {items.map((item) => (
        <li key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
          <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
            {item.emoji ? <span aria-hidden>{item.emoji}</span> : null}
            <span>{item.name}</span>
          </span>
          {item.raceId && anchorRaceIds.has(item.raceId) ? (
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">
              {t('funnel.anchor')}
            </span>
          ) : null}

          <span className="text-xs text-muted">
            {item.disciplines.map((discipline) => formatEventTypeLabel(discipline)).join(', ')}
          </span>
          {item.location ? <span className="text-xs text-muted">{item.location}</span> : null}

          {item.role && item.role !== 'none' ? (
            <span className="text-xs font-semibold text-muted">
              {t(`bucketList.roles.${item.role}`)}
            </span>
          ) : null}

          <SeasonNotes season={item.raceId ? season.get(item.raceId) : undefined} />

          <div className="ml-auto flex flex-nowrap items-center gap-1">{actions(item)}</div>
        </li>
      ))}
    </ul>
  )
}
