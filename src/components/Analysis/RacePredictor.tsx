import { useTranslation } from 'react-i18next'
import type { RaceForecast } from '../../utils/analytics/equivalence'
import { formatDurationSeconds, formatPaceSeconds } from '../../utils/analytics/results'
import { formatEventTypeLabel } from '../../i18n/formatters'
import { formatDatePt } from '../../utils/date'

/**
 * Equivalences from current form. The source race is named at the foot: without
 * it the numbers arrive from nowhere and nobody recognises them as theirs.
 */
export function RacePredictor({ forecast }: { forecast: RaceForecast }) {
  const { t } = useTranslation()
  const { predictions, basedOn, fromRecentForm } = forecast
  if (predictions.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-px bg-border">
        {predictions.map((prediction) => (
          <div key={prediction.eventType} className="bg-surface px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              {formatEventTypeLabel(prediction.eventType)}
            </p>
            <p className="mt-2 font-display text-2xl leading-none tracking-wide text-foreground">
              {formatDurationSeconds(prediction.predictedSeconds)}
            </p>
            <p className="mt-1 text-xs text-muted">
              {formatPaceSeconds(prediction.predictedSeconds / prediction.distanceKm)}{' '}
              {t('common.paceUnit')}
            </p>
          </div>
        ))}
      </div>
      <p className="border-t border-border px-4 py-3 text-xs text-muted">
        {t(fromRecentForm ? 'analysis.predictorBasis' : 'analysis.predictorBasisStale', {
          name: basedOn.event.name,
          date: formatDatePt(basedOn.date),
        })}{' '}
        {t('analysis.predictorCaveat')}
      </p>
    </div>
  )
}
