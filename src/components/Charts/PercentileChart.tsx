import { useTranslation } from 'react-i18next'
import { Line } from 'react-chartjs-2'
import './chartConfig'
import { useTheme } from '../../contexts/ThemeContext'
import type { PercentilePoint } from '../../utils/analytics/percentile'
import { PACE_CHART_COLORS } from '../../utils/chartData'
import { formatDatePt } from '../../utils/date'

/**
 * Posição no pelotão ao longo do tempo. Ao contrário do ritmo, quase não sofre
 * com o percurso nem com o dia: uma prova lenta num percurso duro continua a
 * mostrar-se bem aqui, e é por isso que vale a pena ao lado da curva de forma.
 */
export function PercentileChart({ points }: { points: PercentilePoint[] }) {
  const { t } = useTranslation()
  const { effectiveTheme } = useTheme()

  const data = {
    datasets: [
      {
        label: t('analysis.percentileSeries'),
        data: points.map((point) => ({
          x: point.result.date.getTime(),
          y: point.placing.fraction * 100,
        })),
        borderColor: '#8B5CF6',
        backgroundColor: '#8B5CF6',
        pointBackgroundColor: points.map((point) => PACE_CHART_COLORS[point.result.eventType]),
        pointBorderColor: points.map((point) => PACE_CHART_COLORS[point.result.eventType]),
        pointRadius: 5,
        tension: 0.2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items: { raw: unknown }[]) => {
            const raw = items[0]?.raw as { x?: number } | undefined
            return raw?.x ? formatDatePt(new Date(raw.x)) : ''
          },
          label: (context: { dataIndex: number }) => {
            const point = points[context.dataIndex]
            if (!point) return ''

            return [
              `${point.result.event.emoji ? `${point.result.event.emoji} ` : ''}${point.result.event.name}`,
              t('analysis.tooltipPlacing', {
                position: point.placing.position,
                total: point.placing.total,
              }),
              t('analysis.tooltipTopPercent', { percent: point.placing.topPercent }),
            ]
          },
        },
      },
    },
    scales: {
      y: {
        // Invertido: o vencedor fica em cima, como num pódio.
        reverse: true,
        min: 0,
        max: 100,
        title: { display: true, text: t('analysis.percentileAxis') },
        ticks: { callback: (value: string | number) => `${value}%` },
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
      <Line key={effectiveTheme} data={data} options={options} />
    </div>
  )
}
