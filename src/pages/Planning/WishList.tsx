import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { formatEventTypeLabel } from '../../i18n/formatters'
import { SeasonNotes } from '../../components/SeasonNotes'
import type { SeasonAnnotation } from '../../domain/seasonBoard'
import { wishSubject } from '../../domain/wishSubject'
import { wishNextDate } from '../../domain/wishNextDate'
import { formatDatePt } from '../../utils/date'
import type { RaceCatalogEntry } from '../../../shared/raceCatalog'
import type { BucketListItem } from '../../types/BucketListItem'
import type { Race } from '../../types/Race'

type WishListProps = {
  items: readonly BucketListItem[]
  /** Where the name and the place come from: a wish is a marker on a race. */
  races: readonly Race[]
  /** The catalog behind them, which is what knows when they are next run. */
  catalog: readonly RaceCatalogEntry[]
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
export function WishList({
  items,
  races,
  catalog,
  season: seasonFor,
  anchorRaceIds,
  actions,
}: WishListProps) {
  const { t, i18n } = useTranslation()
  const monthName = (month: number) =>
    new Intl.DateTimeFormat(i18n.language, { month: 'long' }).format(new Date(2026, month - 1, 1))

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
      {items.map((item) => {
        const subject = wishSubject(item, races)
        // A day when the edition has been published, the typical month while
        // it has not: the difference between a decision and a dream.
        const next = wishNextDate(item, races, catalog)
        const annotation = item.raceId ? seasonFor.get(item.raceId) : undefined
        const season =
          annotation &&
          (annotation.window ||
            (annotation.serves && annotation.serves.weeksBefore >= 1) ||
            annotation.warnings.length > 0)
            ? annotation
            : undefined
        const details = [
          subject.location,
          (item.disciplines ?? []).map((discipline) => formatEventTypeLabel(discipline)).join(', '),
          item.role && item.role !== 'none' ? t(`bucketList.roles.${item.role}`) : '',
        ].filter(Boolean)
        return (
          <li key={item.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                  {item.emoji ? <span aria-hidden>{item.emoji}</span> : null}
                  <span>{subject.name}</span>
                </span>
                {item.raceId && anchorRaceIds.has(item.raceId) ? (
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">
                    {t('funnel.anchor')}
                  </span>
                ) : null}
              </div>
              {details.length > 0 ? (
                <p className="text-xs text-muted">{details.join(' · ')}</p>
              ) : null}
              {season ? (
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <SeasonNotes season={season} />
                </div>
              ) : null}
            </div>

            <span
              className={`w-28 shrink-0 text-end text-xs tabular-nums ${
                next?.kind === 'day' ? 'font-semibold text-foreground' : 'text-muted'
              }`}
            >
              {next
                ? next.kind === 'day'
                  ? formatDatePt(new Date(`${next.day}T12:00:00`))
                  : t('planning.typicalMonth', { month: monthName(next.month) })
                : null}
            </span>

            <div className="flex shrink-0 flex-nowrap items-center gap-1">{actions(item)}</div>
          </li>
          )
      })}
    </ul>
  )
}
