import { useTranslation } from 'react-i18next'
import { StatGrid, type StatItem } from './AnalysisSection'
import type { ActivityRhythm, CareerTotals as Totals } from '../../utils/analytics/activity'
import { formatHours } from '../../utils/analytics/results'
import { formatDatePt } from '../../utils/date'

type CareerTotalsProps = {
  totals: Totals
  rhythm: ActivityRhythm | null
}

/** Fecha a página: o que já se fez, todo junto. */
export function CareerTotals({ totals, rhythm }: CareerTotalsProps) {
  const { t, i18n } = useTranslation()

  const items: StatItem[] = [
    { key: 'races', value: String(totals.races), label: t('analysis.statRacesEver') },
    {
      key: 'distance',
      value: Math.round(totals.distanceKm).toLocaleString(i18n.language),
      label: t('analysis.statDistanceEver'),
    },
    {
      key: 'time',
      value: `${formatHours(totals.timeSeconds)}h`,
      label: t('analysis.statTimeEver'),
    },
    { key: 'seasons', value: String(totals.seasons), label: t('analysis.statSeasons') },
    { key: 'locations', value: String(totals.locations), label: t('analysis.statLocations') },
  ]

  if (rhythm) {
    items.push({
      key: 'streak',
      value: String(rhythm.currentMonthStreak),
      label: t('analysis.statMonthStreak'),
    })
  }

  return (
    <div>
      <StatGrid items={items} />
      <p className="mt-2 text-xs text-muted">
        {t('analysis.careerSince', {
          date: formatDatePt(totals.firstRace.date),
          name: totals.firstRace.event.name,
        })}
        {rhythm?.longestGapDays != null
          ? ` · ${t('analysis.longestGap', { days: rhythm.longestGapDays })}`
          : ''}
      </p>
    </div>
  )
}
