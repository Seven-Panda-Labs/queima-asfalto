import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatEventTypeLabel } from '../../i18n/formatters'
import {
  gapBetween,
  seasonTimeline,
  spanBetween,
  type SeasonRace,
} from '../../domain/seasonTimeline'
import type { Event } from '../../types/Event'

/**
 * The day and the month, as short as the language allows.
 *
 * Portuguese writes "15 de fev." where the parts are all that is wanted: a
 * timeline is read across, and every extra word costs a race on the line.
 */
function shortDay(date: Date, language: string): string {
  const parts = new Intl.DateTimeFormat(language, {
    day: 'numeric',
    month: 'short',
  }).formatToParts(date)
  const day = parts.find((part) => part.type === 'day')?.value ?? ''
  const month = (parts.find((part) => part.type === 'month')?.value ?? '').replace(/\.$/, '')
  return `${day} ${month}`
}

/**
 * The gap between two races, as a way to fill it.
 *
 * The whole point of seeing the path to an anchor is noticing that there are
 * eleven weeks and nothing in them. So the space between two races is the
 * button: it opens the catalog already asking about those dates.
 */
function Gap({
  before,
  after,
  year,
  label,
}: {
  before: SeasonRace | null
  after: SeasonRace | null
  year: number
  label: string
}) {
  const { t } = useTranslation()
  const { from, to } = gapBetween(before, after, year)
  // Every connector looks the same, so the one thing worth saying on it is how
  // long it is: five weeks between two races is a plan, five days is a clash.
  const span = before && after ? spanBetween(before, after) : null

  return (
    <Link
      to={`/planeamento/descobrir?from=${from}&to=${to}&season=${year}`}
      aria-label={label}
      title={label}
      className="group flex shrink-0 items-center gap-1 px-1 text-muted/50 transition-colors hover:text-primary focus-visible:text-primary"
    >
      <span aria-hidden className="h-px w-3 bg-current sm:w-5" />
      {span ? (
        <span className="text-[0.65rem] uppercase tracking-wide tabular-nums">
          {t(`planning.span.${span.unit}`, { count: span.count })}
        </span>
      ) : null}
      <span
        aria-hidden
        className="rounded-full border border-dashed border-current px-1.5 text-xs leading-5 group-hover:border-solid"
      >
        +
      </span>
      <span aria-hidden className="h-px w-3 bg-current sm:w-5" />
    </Link>
  )
}

function Race({ race, language }: { race: SeasonRace; language: string }) {
  const { t } = useTranslation()

  return (
    <span
      title={race.inSeason ? undefined : t('planning.otherSeason')}
      className={`inline-flex shrink-0 items-baseline gap-1 rounded-md border px-2 py-1 ${
        race.isAnchor ? 'border-accent bg-accent/10' : 'border-border bg-surface'
      } ${race.inSeason ? '' : 'opacity-50'}`}
    >
      {race.isAnchor ? (
        <span aria-label={t('funnel.anchor')} title={t('funnel.anchor')} className="text-xs">
          ⚓
        </span>
      ) : null}
      <span className="text-sm font-semibold leading-tight text-foreground">{race.name}</span>
      <span className="text-[0.65rem] uppercase text-muted">
        {formatEventTypeLabel(race.eventType)}
      </span>
      <span className="text-[0.65rem] tabular-nums text-muted">
        {shortDay(race.date, language)}
        {race.inSeason ? '' : ` ${race.date.getFullYear()}`}
      </span>
    </span>
  )
}

/**
 * The season as the paths to its anchors.
 *
 * One line per anchor, read left to right: the races that lead to it and then
 * the anchor itself. That is how every runner interviewed describes a year,
 * and it is the question a grid of months could not answer, which is what is
 * happening between now and the race that matters.
 *
 * No links to a race's own page. Planning is comparing, and a detail page is
 * the fastest way out of it. The links that are here all go the other way, to
 * the catalog, with the dates of the gap they came from.
 */
export function SeasonTimeline({
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
  const legs = seasonTimeline(events, year, anchorRaceIds)
  const booked = legs.reduce(
    (count, leg) => count + leg.leadUp.length + (leg.anchor ? 1 : 0),
    0,
  )
  const anchored = legs.some((leg) => leg.anchor)

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

      <ul className="mt-2 space-y-1.5">
        {legs.map((leg, at) => {
          const races = [...leg.leadUp, ...(leg.anchor ? [leg.anchor] : [])]
          return (
            <li
              key={leg.anchor?.id ?? `leg-${at}`}
              className="flex flex-wrap items-center gap-y-1 rounded-lg border border-border bg-surface/50 px-2 py-1.5"
            >
              {races.length === 0 ? (
                <Gap before={null} after={null} year={year} label={t('planning.gapAnywhere')} />
              ) : null}
              {races.map((race, position) => (
                <span key={race.id} className="flex items-center">
                  <Gap
                    before={races[position - 1] ?? null}
                    after={race}
                    year={year}
                    label={t('planning.gapBefore', { name: race.name })}
                  />
                  <Race race={race} language={i18n.language} />
                </span>
              ))}
              {/* After the anchor there is nothing to prepare, so the trailing
                  gap belongs to the leg that has no anchor. */}
              {races.length > 0 && !leg.anchor ? (
                <Gap
                  before={races[races.length - 1]!}
                  after={null}
                  year={year}
                  label={t('planning.gapAfter', { name: races[races.length - 1]!.name })}
                />
              ) : null}
            </li>
          )
        })}
      </ul>

      {booked > 0 && !anchored ? (
        <p className="mt-2 text-xs text-muted">{t('planning.noAnchorHint')}</p>
      ) : null}
    </section>
  )
}
