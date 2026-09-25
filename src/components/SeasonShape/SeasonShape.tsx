import { useTranslation } from 'react-i18next'
import { formatEventTypeLabel } from '../../i18n/formatters'
import { seasonShape } from '../../domain/seasonShape'
import type { Event } from '../../types/Event'

/**
 * The year as twelve months, so the gaps are as visible as the races.
 *
 * The question while planning is not "what have I booked", which the calendar
 * answers, it is "where is the hole": a test four weeks before the anchor, a
 * spring with nothing in it. A list of races cannot show an empty April.
 *
 * No links. Planning is comparing, not reading one race, and a detail page is
 * the fastest way out of the frame of mind.
 */
export function SeasonShape({
  events,
  year,
  years,
  anchorRaceIds,
  onYear,
}: {
  events: readonly Event[]
  year: number
  years: readonly number[]
  anchorRaceIds: ReadonlySet<string>
  onYear: (year: number) => void
}) {
  const { t, i18n } = useTranslation()
  const months = seasonShape(events, year, anchorRaceIds)
  const monthName = (month: number) =>
    new Intl.DateTimeFormat(i18n.language, { month: 'short' }).format(new Date(2026, month - 1, 1))
  const booked = months.reduce((count, month) => count + month.races.length, 0)

  return (
    <section>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          {t('planning.seasonTitle')}
        </h2>
        <label className="sr-only" htmlFor="planning-season-year">
          {t('planning.seasonYear')}
        </label>
        <select
          id="planning-season-year"
          value={year}
          onChange={(changed) => onYear(Number(changed.target.value))}
          className="rounded-md border border-border bg-background px-2 py-1 text-sm font-semibold text-foreground"
        >
          {years.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted">{t('planning.seasonCount', { count: booked })}</span>
      </div>

      <ul className="mt-2 divide-y divide-border rounded-lg border border-border bg-surface">
        {months.map((month) => (
          <li key={month.month} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-2">
            <span className="w-10 shrink-0 text-xs font-semibold uppercase text-muted">
              {monthName(month.month)}
            </span>
            {month.races.length === 0 ? (
              <span className="text-xs text-muted/60">{t('planning.seasonEmptyMonth')}</span>
            ) : (
              <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {month.races.map((race) => (
                  <span key={race.id} className="inline-flex items-baseline gap-1.5">
                    <span className="text-sm font-semibold text-foreground">{race.name}</span>
                    {race.isAnchor ? (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">
                        {t('funnel.anchor')}
                      </span>
                    ) : null}
                    <span className="text-xs text-muted">
                      {formatEventTypeLabel(race.eventType)}
                    </span>
                    <span className="text-xs text-muted">{race.date.getDate()}</span>
                  </span>
                ))}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
