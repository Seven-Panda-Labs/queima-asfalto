import { useTranslation } from 'react-i18next'
import type { RacePrediction } from '../../utils/analytics/equivalence'
import { formatDurationSeconds, formatPaceSeconds } from '../../utils/analytics/results'
import { formatEventTypeLabel } from '../../i18n/formatters'
import { formatDatePt } from '../../utils/date'

/**
 * Equivalências a partir da marca mais forte. São estimativas, e para as
 * distâncias longas são estimativas optimistas: Riegel assume uma base de
 * resistência que quem só corre 5K não tem. Daí o aviso a fechar o bloco.
 */
export function RacePredictor({ predictions }: { predictions: RacePrediction[] }) {
  const { t } = useTranslation()
  if (predictions.length === 0) return null

  const base = predictions[0]!.basedOn

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
        {t('analysis.predictorBasis', {
          name: base.event.name,
          date: formatDatePt(base.date),
        })}{' '}
        {t('analysis.predictorCaveat')}
      </p>
    </div>
  )
}
