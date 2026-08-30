import { useTranslation } from 'react-i18next'
import { StatGrid, type StatItem } from './AnalysisSection'
import type { SeasonComparison } from '../../utils/analytics/season'
import {
  formatHours,
  formatPaceDelta,
  formatPaceSeconds,
} from '../../utils/analytics/results'

function signed(value: number, digits = 0): string {
  const rounded = Number(value.toFixed(digits))
  if (rounded === 0) return ''
  return `${rounded > 0 ? '+' : ''}${rounded.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`
}

function moreIsBetter(value: number): StatItem['deltaTone'] {
  if (value > 0) return 'good'
  if (value < 0) return 'bad'
  return 'neutral'
}

/**
 * Os números da época, cada um com o que mudou face à anterior. A época
 * anterior vem cortada no mesmo dia do ano (ver `compareSeasons`), senão em
 * Março estaria sempre a perder contra doze meses inteiros.
 */
export function SeasonHeader({ comparison }: { comparison: SeasonComparison }) {
  const { t, i18n } = useTranslation()
  const { current, delta } = comparison

  const items: StatItem[] = [
    {
      key: 'races',
      value: String(current.races),
      label: t('analysis.statRaces'),
      delta: delta ? signed(delta.races) : undefined,
      deltaTone: delta ? moreIsBetter(delta.races) : undefined,
    },
    {
      key: 'distance',
      value: Math.round(current.distanceKm).toLocaleString(i18n.language),
      label: t('analysis.statDistance'),
      delta: delta ? signed(delta.distanceKm) : undefined,
      deltaTone: delta ? moreIsBetter(delta.distanceKm) : undefined,
    },
    {
      key: 'time',
      value: `${formatHours(current.timeSeconds)}h`,
      label: t('analysis.statTimeRacing'),
      delta: delta ? signed(delta.timeSeconds / 3600, 1) : undefined,
      // Mais tempo em prova é mais corrida, não é melhor nem pior.
      deltaTone: 'neutral',
    },
    {
      key: 'pace',
      value:
        current.averagePaceSeconds === null
          ? t('common.dash')
          : formatPaceSeconds(current.averagePaceSeconds),
      label: t('analysis.statAveragePace'),
      delta:
        delta?.averagePaceSeconds != null && Math.round(delta.averagePaceSeconds) !== 0
          ? formatPaceDelta(delta.averagePaceSeconds)
          : undefined,
      // Menos segundos por km é mais rápido.
      deltaTone: delta?.averagePaceSeconds != null && delta.averagePaceSeconds < 0 ? 'good' : 'bad',
    },
    {
      key: 'records',
      value: String(current.recordsSet),
      label: t('analysis.statRecords'),
      delta: delta ? signed(delta.recordsSet) : undefined,
      deltaTone: delta ? moreIsBetter(delta.recordsSet) : undefined,
    },
  ]

  return (
    <div>
      <StatGrid items={items} />
      {comparison.previous ? (
        <p className="mt-2 text-xs text-muted">
          {comparison.throughDayOfYear === null
            ? t('analysis.comparedToFullSeason', { year: comparison.previous.year })
            : t('analysis.comparedToSamePoint', { year: comparison.previous.year })}
        </p>
      ) : null}
    </div>
  )
}
