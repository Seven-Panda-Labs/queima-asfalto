import { useTranslation } from 'react-i18next'
import { Line } from 'react-chartjs-2'
import './chartConfig'
import { useTheme } from '../../contexts/ThemeContext'
import type { EquivalentPoint } from '../../utils/analytics/equivalence'
import type { IndexTrend } from '../../utils/analytics/projection'
import { projectIndexAt } from '../../utils/analytics/projection'
import { formatDurationSeconds } from '../../utils/analytics/results'
import { formatDatePt } from '../../utils/date'
import { PACE_CHART_COLORS, PACE_CHART_POINT_STYLES } from '../../utils/chartData'

type FormCurveChartProps = {
  points: EquivalentPoint[]
  referenceLabel: string
  trend?: IndexTrend | null
}

const TREND_COLOR = '#94A3B8'

/** The axis is the index, not pace: paces from different distances do not compare. Points keep their discipline's colour. */
export function FormCurveChart({ points, referenceLabel, trend }: FormCurveChartProps) {
  const { t } = useTranslation()
  const { effectiveTheme } = useTheme()

  const firstMs = points[0]!.result.date.getTime()
  const lastMs = points[points.length - 1]!.result.date.getTime()

  type Dataset = { data: { x: number; y: number }[] } & Record<string, unknown>
  const datasets: Dataset[] = [
    {
      label: t('analysis.formIndex'),
      data: points.map((point) => ({ x: point.result.date.getTime(), y: point.index })),
      borderColor: '#2563EB',
      backgroundColor: '#2563EB',
      pointBackgroundColor: points.map((point) => PACE_CHART_COLORS[point.result.eventType]),
      pointBorderColor: points.map((point) => PACE_CHART_COLORS[point.result.eventType]),
      // Shape carries the distance family, so identity does not rest on colour:
      // a 5K and a marathon point are the same colour under protanopia.
      pointStyle: points.map((point) => PACE_CHART_POINT_STYLES[point.result.eventType]),
      pointRadius: 5,
      tension: 0.2,
      order: 1,
    },
  ]

  if (trend) {
    datasets.push({
      label: t('analysis.trendLine'),
      data: [
        { x: firstMs, y: projectIndexAt(trend, new Date(firstMs)) },
        { x: lastMs, y: projectIndexAt(trend, new Date(lastMs)) },
      ],
      borderColor: TREND_COLOR,
      backgroundColor: TREND_COLOR,
      borderDash: [6, 4],
      pointRadius: 0,
      tension: 0,
      order: 2,
    })
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' as const },
      tooltip: {
        callbacks: {
          title: (items: { raw: unknown }[]) => {
            const raw = items[0]?.raw as { x?: number } | undefined
            return raw?.x ? formatDatePt(new Date(raw.x)) : ''
          },
          label: (context: { datasetIndex: number; dataIndex: number; raw: unknown }) => {
            if (context.datasetIndex !== 0) {
              const raw = context.raw as { y?: number } | undefined
              return `${(raw?.y ?? 0).toFixed(1)}`
            }

            const point = points[context.dataIndex]
            if (!point) return ''

            return [
              `${point.result.event.emoji ? `${point.result.event.emoji} ` : ''}${point.result.event.name}`,
              t('analysis.tooltipIndex', { index: point.index.toFixed(1) }),
              t('analysis.tooltipTime', {
                time: formatDurationSeconds(point.result.timeSeconds),
              }),
              t('analysis.tooltipEquivalent', {
                distance: referenceLabel,
                time: formatDurationSeconds(point.equivalentSeconds),
              }),
            ]
          },
        },
      },
    },
    scales: {
      y: {
        title: { display: true, text: t('analysis.formAxis') },
      },
      x: {
        type: 'linear' as const,
        title: { display: true, text: t('results.chartDateAxis') },
        ticks: {
          maxRotation: 45,
          autoSkip: true,
          callback: (value: string | number) => formatDatePt(new Date(Number(value))),
        },
      },
    },
  }

  return (
    <div className="h-56 w-full sm:h-64">
      <Line key={effectiveTheme} data={{ datasets: datasets as never }} options={options} />
    </div>
  )
}
