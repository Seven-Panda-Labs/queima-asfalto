import { useTranslation } from 'react-i18next'
import type { SeasonAnnotation } from '../../domain/seasonBoard'
import { formatDatePt } from '../../utils/date'

/**
 * What the season rules say about one race, said briefly.
 *
 * Shared by the wish list row and the race's own page, because the rules stopped
 * being about wishes: a scheduled build-up still lands in a taper.
 *
 * Warnings and never blocks: a race in the taper week might be a parkrun with
 * the kids, and the runner knows that and the app does not.
 */
export function SeasonNotes({ season }: { season: SeasonAnnotation | undefined }) {
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
          {season.serving > 0 ? ` \u00b7 ${t('season.serving', { count: season.serving })}` : ''}
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
