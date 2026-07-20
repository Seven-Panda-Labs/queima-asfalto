import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Line } from 'react-chartjs-2'
import './chartConfig'
import { useTheme } from '../../contexts/ThemeContext'
import type { Event, EventType } from '../../types/Event'
import { formatEventTypeLabel } from '../../types/Goal'
import {
  buildPaceChartSeries,
  formatPaceSeconds,
  pacePointColor,
  PACE_CHART_COLORS,
  type PaceChartSeries,
} from '../../utils/chartData'
import { formatDatePt } from '../../utils/date'

type PaceChartProps = {
  events: Event[]
  eventType: EventType | 'all'
}

function buildDataset(series: PaceChartSeries, multiSeries: boolean, datasetLabel: string) {
  const { eventType, points } = series
  const color = PACE_CHART_COLORS[eventType]
  const averageSeconds = Math.round(
    points.reduce((sum, point) => sum + point.paceSeconds, 0) / points.length,
  )

  return {
    label: datasetLabel,
    data: multiSeries
      ? points.map((point) => ({ x: point.date.getTime(), y: point.paceSeconds }))
      : points.map((point) => point.paceSeconds),
    borderColor: color,
    backgroundColor: color,
    pointBackgroundColor: points.map((point) => pacePointColor(point.paceSeconds, averageSeconds)),
    pointBorderColor: points.map((point) => pacePointColor(point.paceSeconds, averageSeconds)),
    pointRadius: 5,
    tension: 0.2,
  }
}

export function PaceChart({ events, eventType }: PaceChartProps) {
  const { t } = useTranslation()
  const { effectiveTheme } = useTheme()
  const series = useMemo(() => buildPaceChartSeries(events, eventType), [events, eventType])
  const multiSeries = eventType === 'all' && series.length > 0

  if (series.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg bg-background text-muted sm:h-56">
        {eventType === 'all'
          ? t('results.chartEmptyAll')
          : t('results.chartEmpty', { type: formatEventTypeLabel(eventType) })}
      </div>
    )
  }

  const singleSeries = series[0]!
  const typeLabel = formatEventTypeLabel(singleSeries.eventType)

  const data = {
    labels: multiSeries ? undefined : singleSeries.points.map((point) => point.label),
    datasets: series.map((item) =>
      buildDataset(
        item,
        multiSeries,
        multiSeries
          ? formatEventTypeLabel(item.eventType)
          : t('results.chartDataset', { type: typeLabel }),
      ),
    ),
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          title: multiSeries
            ? (items: { raw: unknown }[]) => {
                const raw = items[0]?.raw as { x?: number } | undefined
                return raw?.x ? formatDatePt(new Date(raw.x)) : ''
              }
            : undefined,
          label: (context: { datasetIndex: number; dataIndex: number }) => {
            const point = series[context.datasetIndex]?.points[context.dataIndex]
            if (!point) return ''

            const pace = formatPaceSeconds(point.paceSeconds)
            const parts = [
              multiSeries ? formatEventTypeLabel(point.event.eventType) : '',
              `${point.event.emoji ? `${point.event.emoji} ` : ''}${point.event.name}`,
              t('results.chartPaceTooltip', { pace }),
            ].filter(Boolean)

            if (point.event.time) {
              parts.push(t('results.chartTimeTooltip', { time: point.event.time }))
            }
            return parts
          },
        },
      },
    },
    scales: {
      y: {
        reverse: true,
        title: {
          display: true,
          text: t('results.chartPaceAxis'),
        },
        ticks: {
          callback: (value: string | number) => formatPaceSeconds(Number(value)),
        },
      },
      x: multiSeries
        ? {
            type: 'linear' as const,
            title: {
              display: true,
              text: t('results.chartDateAxis'),
            },
            ticks: {
              maxRotation: 45,
              autoSkip: true,
              callback: (value: string | number) => formatDatePt(new Date(Number(value))),
            },
          }
        : {
            title: {
              display: true,
              text: t('results.chartDateAxis'),
            },
          },
    },
  }

  return (
    <div className="h-48 w-full sm:h-56">
      <Line key={effectiveTheme} data={data} options={options} />
    </div>
  )
}
