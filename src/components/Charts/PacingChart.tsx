import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Bar } from 'react-chartjs-2'
import './chartConfig'
import { pacingBand, type PacingPoint } from '../../utils/analytics/pacing'
import { formatDatePt } from '../../utils/date'

type PacingChartProps = {
  points: PacingPoint[]
}

/** Red is kept for a collapse, so it means something when it appears. */
const BAND_COLOR = {
  negative: '#10B981',
  even: '#94A3B8',
  fade: '#F59E0B',
  heavy: '#EF4444',
} as const

/** Bars, not a line: each race is its own decision, not a point on a curve. */
export function PacingChart({ points }: PacingChartProps) {
  const { t } = useTranslation()

  const data = useMemo(
    () => ({
      labels: points.map((point) => formatDatePt(point.date)),
      datasets: [
        {
          label: t('analysis.pacingDataset'),
          data: points.map((point) => point.driftSeconds),
          backgroundColor: points.map((point) => BAND_COLOR[pacingBand(point.driftSeconds)]),
          borderWidth: 0,
        },
      ],
    }),
    [points, t],
  )

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items: { dataIndex: number }[]) => {
            const point = points[items[0]?.dataIndex ?? 0]
            return point ? `${point.result.event.name} · ${formatDatePt(point.date)}` : ''
          },
          label: (context: { parsed: { y: number | null } }) => {
            const drift = context.parsed.y
            if (drift === null) return ''
            const band = pacingBand(drift)
            if (band === 'even') return t('analysis.pacingEvenTooltip')
            if (band === 'negative') {
              return t('analysis.pacingNegativeTooltip', { seconds: Math.round(Math.abs(drift)) })
            }
            return t(
              band === 'heavy' ? 'analysis.pacingHeavyTooltip' : 'analysis.pacingFadedTooltip',
              { seconds: Math.round(drift) },
            )
          },
        },
      },
    },
    scales: {
      y: {
        title: { display: true, text: t('analysis.pacingAxis') },
        ticks: { callback: (value: string | number) => `${Number(value) > 0 ? '+' : ''}${value}s` },
      },
      x: { ticks: { maxTicksLimit: 10, autoSkip: true } },
    },
  }

  return (
    <div className="h-64 w-full sm:h-72">
      <Bar data={data} options={options} />
    </div>
  )
}
