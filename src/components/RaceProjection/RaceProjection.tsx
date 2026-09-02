import { useTranslation } from 'react-i18next'
import type { RaceProjection as Projection } from '../../utils/analytics/racePrediction'
import { formatDurationSeconds, formatPaceSeconds } from '../../utils/analytics/results'
import { formatDatePt } from '../../utils/date'

/**
 * What form says about the race ahead, where it is useful.
 *
 * The number already existed on the analysis page, months after the moment it
 * answers a question. The race it came from is always named: without it the
 * estimate arrives from nowhere and nobody recognises it as theirs.
 */
export function RaceProjection({ projection }: { projection: Projection }) {
  const { t } = useTranslation()
  const { predictedSeconds, paceSeconds, basedOn, fromBuildUp, fromRecentForm } = projection

  const basisKey = fromBuildUp
    ? 'projection.basisBuildUp'
    : fromRecentForm
      ? 'projection.basis'
      : 'projection.basisStale'

  return (
    <section className="mt-6 rounded-lg border border-border bg-surface p-5">
      <h2 className="text-lg font-semibold text-foreground">{t('projection.title')}</h2>
      <p className="mt-2 flex flex-wrap items-baseline gap-x-3">
        <span className="font-display text-3xl leading-none tracking-wide text-foreground">
          {formatDurationSeconds(predictedSeconds)}
        </span>
        <span className="text-sm text-muted">
          {formatPaceSeconds(paceSeconds)} {t('common.paceUnit')}
        </span>
      </p>
      <p className="mt-3 text-xs text-muted">
        {t(basisKey, { name: basedOn.event.name, date: formatDatePt(basedOn.date) })}{' '}
        {t('analysis.predictorCaveat')}
      </p>
    </section>
  )
}
