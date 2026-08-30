import { useTranslation } from 'react-i18next'
import type { SeasonSummary } from '../../utils/analytics/season'
import {
  formatHours,
  formatPaceDelta,
  formatPaceSeconds,
} from '../../utils/analytics/results'

/**
 * As épocas lado a lado. A coluna de variação compara com a época de baixo, que
 * é a anterior — as épocas estão da mais recente para a mais antiga, como em
 * todo o resto da app.
 */
export function SeasonTable({ seasons }: { seasons: SeasonSummary[] }) {
  const { t, i18n } = useTranslation()

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="min-w-full text-start text-sm">
        <thead className="border-b border-border bg-background text-muted">
          <tr>
            <th className="px-4 py-3 font-semibold">{t('common.year')}</th>
            <th className="px-4 py-3 font-semibold">{t('analysis.statRaces')}</th>
            <th className="px-4 py-3 font-semibold">{t('analysis.statDistance')}</th>
            <th className="px-4 py-3 font-semibold">{t('analysis.statTimeRacing')}</th>
            <th className="px-4 py-3 font-semibold">{t('analysis.statAveragePace')}</th>
            <th className="px-4 py-3 font-semibold">{t('analysis.paceChange')}</th>
            <th className="px-4 py-3 font-semibold">{t('analysis.statRecords')}</th>
          </tr>
        </thead>
        <tbody>
          {seasons.map((season, position) => {
            const previous = seasons[position + 1]
            const change =
              previous && season.averagePaceSeconds !== null && previous.averagePaceSeconds !== null
                ? season.averagePaceSeconds - previous.averagePaceSeconds
                : null

            return (
              <tr key={season.year} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3 font-semibold whitespace-nowrap">{season.year}</td>
                <td className="px-4 py-3 whitespace-nowrap">{season.races}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {Math.round(season.distanceKm).toLocaleString(i18n.language)} Km
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{formatHours(season.timeSeconds)}h</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {season.averagePaceSeconds === null
                    ? t('common.dash')
                    : formatPaceSeconds(season.averagePaceSeconds)}
                </td>
                <td
                  className={[
                    'px-4 py-3 whitespace-nowrap font-semibold',
                    change === null ? 'text-muted' : change < 0 ? 'text-success' : 'text-danger',
                  ].join(' ')}
                >
                  {change === null ? t('common.dash') : formatPaceDelta(change)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{season.recordsSet}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
