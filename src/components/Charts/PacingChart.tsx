import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Bar } from 'react-chartjs-2'
import './chartConfig'
import { EVEN_PACING_BAND_SECONDS, type PacingPoint } from '../../utils/analytics/pacing'
import { formatDatePt } from '../../utils/date'

type PacingChartProps = {
  points: PacingPoint[]
}

const FADED_COLOR = '#EF4444'
const NEGATIVE_COLOR = '#10B981'
const EVEN_COLOR = '#94A3B8'

function barColor(drift: number): string {
  if (drift > EVEN_PACING_BAND_SECONDS) return FADED_COLOR
  if (drift < -EVEN_PACING_BAND_SECONDS) return NEGATIVE_COLOR
  return EVEN_COLOR
}

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
          backgroundColor: points.map((point) => barColor(point.driftSeconds)),
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
            return point ? `${point.event.name} · ${formatDatePt(point.date)}` : ''
          },
          label: (context: { parsed: { y: number | null } }) => {
            const drift = context.parsed.y
            if (drift === null) return ''
            if (Math.abs(drift) <= EVEN_PACING_BAND_SECONDS) return t('analysis.pacingEvenTooltip')
            return drift > 0
              ? t('analysis.pacingFadedTooltip', { seconds: Math.round(drift) })
              : t('analysis.pacingNegativeTooltip', { seconds: Math.round(Math.abs(drift)) })
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
