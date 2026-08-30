import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Line } from 'react-chartjs-2'
import './chartConfig'
import { useTheme } from '../../contexts/ThemeContext'
import { buildSeasonEnvelope, type CumulativeSeason } from '../../utils/analytics/season'

const CURRENT_COLOR = '#2563EB'
const PREVIOUS_COLOR = '#10B981'
const ENVELOPE_COLOR = '#94A3B8'

const MONTH_STARTS = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335]

/** Seasons drawn as lines; the rest become the band. */
const LINE_SEASONS = 2

type Dataset = { data: { x: number; y: number }[] } & Record<string, unknown>

/**
 * Only this season and the last are lines, because that is the comparison worth
 * following. Older seasons collapse into a band, keeping the information as
 * context instead of six crossing step curves.
 */
export function CumulativeSeasonChart({ seasons }: { seasons: CumulativeSeason[] }) {
  const { t, i18n } = useTranslation()
  const { effectiveTheme } = useTheme()

  const monthLabel = new Intl.DateTimeFormat(i18n.language, { month: 'short' })

  // Seasons arrive oldest first.
  const recent = seasons.slice(-LINE_SEASONS).reverse()
  const older = seasons.slice(0, Math.max(0, seasons.length - LINE_SEASONS))
  const envelope = useMemo(() => buildSeasonEnvelope(older), [older])

  const envelopeLabel =
    older.length === 0
      ? ''
      : older.length === 1
        ? String(older[0]!.year)
        : `${older[0]!.year}-${older[older.length - 1]!.year}`

  const datasets: Dataset[] = []

  if (envelope.length > 0) {
    datasets.push({
      label: envelopeLabel,
      data: envelope.map((point) => ({ x: point.dayOfYear, y: point.maxKm })),
      borderColor: `${ENVELOPE_COLOR}66`,
      backgroundColor: `${ENVELOPE_COLOR}26`,
      borderWidth: 1,
      pointRadius: 0,
      // Fills down to the next dataset, the band's lower edge.
      fill: '+1',
      order: 4,
    })
    datasets.push({
      label: `${envelopeLabel}​`,
      data: envelope.map((point) => ({ x: point.dayOfYear, y: point.minKm })),
      borderColor: `${ENVELOPE_COLOR}66`,
      borderWidth: 1,
      pointRadius: 0,
      fill: false,
      order: 5,
    })
  }

  recent.forEach((season, position) => {
    datasets.push({
      label: String(season.year),
      data: season.points.map((point) => ({ x: point.dayOfYear, y: point.distanceKm })),
      borderColor: position === 0 ? CURRENT_COLOR : PREVIOUS_COLOR,
      backgroundColor: position === 0 ? CURRENT_COLOR : PREVIOUS_COLOR,
      borderWidth: position === 0 ? 3 : 2,
      pointRadius: 3,
      stepped: 'after' as const,
      fill: false,
      // Lets the marker draw over the edge instead of being clipped.
      clip: false as const,
      order: position + 1,
    })
  })

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    // A closed season's last mark sits on 31 December, right on the edge.
    // Without room Chart.js cuts the point in half.
    layout: { padding: { right: 10, left: 2 } },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          // The band's lower edge is half a fill, not a series.
          filter: (item: { text?: string }) => !item.text?.endsWith('​'),
        },
      },
      tooltip: {
        callbacks: {
          label: (context: { dataset: { label?: string }; raw: unknown }) => {
            const raw = context.raw as { y?: number } | undefined
            return t('analysis.tooltipCumulative', {
              year: context.dataset.label?.replace('​', '') ?? '',
              km: (raw?.y ?? 0).toFixed(1),
            })
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: t('analysis.cumulativeAxis') },
      },
      x: {
        type: 'linear' as const,
        min: 0,
        max: 366,
        title: { display: true, text: t('analysis.dayOfYearAxis') },
        ticks: {
          autoSkip: false,
          // Ticks on month starts: "day 213" means nothing to anyone.
          callback: (value: string | number) => {
            const month = MONTH_STARTS.indexOf(Number(value))
            return month === -1 ? '' : monthLabel.format(new Date(2026, month, 1))
          },
        },
        afterBuildTicks: (axis: { ticks: { value: number }[] }) => {
          axis.ticks = MONTH_STARTS.map((value) => ({ value }))
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
