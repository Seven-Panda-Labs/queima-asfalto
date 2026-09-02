import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatEventTypeLabel } from '../../i18n/formatters'
import { formatDatePt } from '../../utils/date'
import type { FunnelGroup, FunnelRow } from '../../domain/raceEntryFunnel'
import type { SeasonRuleId, TuneUpWindow } from '../../domain/seasonRules'
import type { RaceEntry } from '../../types/RaceEntry'

/** What the season rules have to say about one row. */
export type ItemSeason = {
  window?: TuneUpWindow
  /** How many races are declared as preparing for this anchor. */
  serving: number
  /** The anchor this race prepares, and how far ahead of it this race sits. */
  serves?: { name: string; weeksBefore: number }
  warnings: { rule: SeasonRuleId; count?: number }[]
}

type BucketListFunnelProps = {
  groups: FunnelGroup[]
  season: Map<string, ItemSeason>
  /** Rendered at the end of every row: the icons the page already had. */
  actions: (row: FunnelRow) => ReactNode
  showEntryLink: boolean
}

/**
 * The date this row is waiting on, said in words.
 *
 * A date on its own is useless here: "12 October" answers nothing, while "closes
 * 12 October" is the whole point of the group.
 */
function WaitingOn({ entry }: { entry: RaceEntry | null }) {
  const { t } = useTranslation()
  if (!entry) return null

  const parts: string[] = []
  if (entry.placeConfirmByAt) {
    parts.push(t('funnel.confirmBy', { date: formatDatePt(entry.placeConfirmByAt) }))
  }
  if (entry.registrationOpensAt && !entry.registrationClosesAt) {
    parts.push(t('funnel.opens', { date: formatDatePt(entry.registrationOpensAt) }))
  }
  if (entry.registrationClosesAt) {
    parts.push(t('funnel.closes', { date: formatDatePt(entry.registrationClosesAt) }))
  }
  if (entry.lotteryDrawAt && entry.entryStatus === 'applied') {
    parts.push(t('funnel.draw', { date: formatDatePt(entry.lotteryDrawAt) }))
  }
  if (parts.length === 0 && entry.raceDate) {
    parts.push(t('funnel.race', { date: formatDatePt(entry.raceDate) }))
  }

  if (parts.length === 0) return null
  return <span className="text-xs text-muted">{parts.join(' · ')}</span>
}

/**
 * What the rules say, said briefly.
 *
 * Warnings and never blocks: a race in the taper week might be a parkrun with the
 * kids, and the runner knows that and the app does not.
 */
function SeasonNotes({ season }: { season: ItemSeason | undefined }) {
  const { t } = useTranslation()
  if (!season) return null

  return (
    <>
      {season.window ? (
        <span className="text-xs text-muted">
          {t('season.tuneUpWindow', {
            distance: season.window.targetDistanceKm,
            from: formatDatePt(season.window.from),
            to: formatDatePt(season.window.to),
          })}
          {season.serving > 0 ? ` · ${t('season.serving', { count: season.serving })}` : ''}
        </span>
      ) : null}
      {season.serves && season.serves.weeksBefore >= 1 ? (
        <span className="text-xs text-muted">
          {t('season.beforeAnchor', {
            count: Math.round(season.serves.weeksBefore),
            anchor: season.serves.name,
          })}
        </span>
      ) : null}
      {season.warnings.map(({ rule, count }) => (
        <span
          key={`${rule}-${count ?? 0}`}
          className="rounded-full bg-warning-bg px-2 py-0.5 text-xs font-semibold text-warning-fg"
        >
          {t(`season.warnings.${rule}`, { count: count ?? 0 })}
        </span>
      ))}
    </>
  )
}

export function BucketListFunnel({ groups, season, actions, showEntryLink }: BucketListFunnelProps) {
  const { t } = useTranslation()
  const populated = groups.filter((group) => group.rows.length > 0)

  return (
    <div className="space-y-8">
      {populated.map((group) => (
        <section key={group.key}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
            {t(`funnel.groups.${group.key}`, { count: group.rows.length })}
          </h2>
          {group.key === 'action_needed' ? (
            <p className="mt-1 text-xs text-accent">{t('funnel.actionNeededHint')}</p>
          ) : null}

          <ul className="mt-2 divide-y divide-border rounded-lg border border-border bg-surface">
            {group.rows.map(({ item, entry }) => (
              <li key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
                <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                  {item.emoji ? <span aria-hidden>{item.emoji}</span> : null}
                  <span>{item.name}</span>
                </span>
                {item.isAnchor ? (
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

                <WaitingOn entry={entry} />
                <SeasonNotes season={season.get(item.id)} />

                <div className="ml-auto flex flex-nowrap items-center gap-1">
                  {showEntryLink ? (
                    <Link
                      to={`/bucket-list/${item.id}/inscricao`}
                      className="rounded-md px-2 py-1 text-xs font-semibold text-muted transition-colors hover:bg-background hover:text-primary"
                    >
                      {entry ? t('funnel.editEntry') : t('funnel.planEntry')}
                    </Link>
                  ) : null}
                  {actions({ item, entry })}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
