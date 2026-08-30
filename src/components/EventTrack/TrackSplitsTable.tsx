import { useTranslation } from 'react-i18next'
import type { TrackSplit } from '../../domain/activityTrack'
import { formatDurationSeconds, formatPaceSeconds } from '../../utils/analytics/results'
import { splitExtremes } from '../../utils/trackSplits'

type TrackSplitsTableProps = {
  splits: TrackSplit[]
  /** Heart rate has a column only when the file carried it, so GPX tables stay narrow. */
  showHeartRate: boolean
}

export function TrackSplitsTable({ splits, showHeartRate }: TrackSplitsTableProps) {
  const { t } = useTranslation()
  const { fastestIndex, slowestIndex } = splitExtremes(splits)

  if (splits.length === 0) return null

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted">
            <th scope="col" className="py-2 pr-4 font-semibold">
              {t('eventTrack.splitColumn')}
            </th>
            <th scope="col" className="py-2 pr-4 font-semibold">
              {t('common.time')}
            </th>
            <th scope="col" className="py-2 pr-4 font-semibold">
              {t('common.paceUnit')}
            </th>
            {showHeartRate ? (
              <th scope="col" className="py-2 font-semibold">
                {t('eventTrack.heartRateColumn')}
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {splits.map((split) => (
            <tr key={split.index} className="border-b border-border last:border-b-0">
              <th scope="row" className="py-2 pr-4 text-left font-normal text-muted">
                {split.partial
                  ? t('eventTrack.partialSplit', {
                      distance: (split.distanceMeters / 1000).toFixed(2),
                    })
                  : split.index}
              </th>
              <td className="py-2 pr-4 text-foreground">
                {formatDurationSeconds(split.durationSeconds)}
              </td>
              <td className="py-2 pr-4">
                <span
                  className={
                    split.index === fastestIndex
                      ? 'font-semibold text-success'
                      : split.index === slowestIndex
                        ? 'font-semibold text-danger'
                        : 'text-foreground'
                  }
                >
                  {formatPaceSeconds(split.paceSecondsPerKm)}
                </span>
                {split.index === fastestIndex ? (
                  <span className="ml-2 text-xs text-muted">{t('eventTrack.fastest')}</span>
                ) : null}
                {split.index === slowestIndex ? (
                  <span className="ml-2 text-xs text-muted">{t('eventTrack.slowest')}</span>
                ) : null}
              </td>
              {showHeartRate ? (
                <td className="py-2 text-foreground">
                  {split.averageHeartRate ?? t('common.dash')}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
