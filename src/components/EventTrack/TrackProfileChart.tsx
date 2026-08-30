import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Line } from 'react-chartjs-2'
import '../Charts/chartConfig'
import { useTheme } from '../../contexts/ThemeContext'
import type { TrackProfilePoint } from '../../domain/activityTrack'
import { formatPaceSeconds } from '../../utils/analytics/results'

type TrackProfileChartProps = {
  profile: TrackProfilePoint[]
}

const PACE_COLOR = '#F97316'
const ELEVATION_COLOR = '#94A3B8'

/** Below this the chart is two or three points and says less than the splits table. */
const MIN_PLOTTABLE_POINTS = 5

export function TrackProfileChart({ profile }: TrackProfileChartProps) {
  const { t } = useTranslation()
  const { effectiveTheme } = useTheme()

  const hasElevation = profile.some((point) => point.elevationMeters !== undefined)

  const data = useMemo(
    () => ({
      labels: profile.map((point) => (point.distanceMeters / 1000).toFixed(2)),
      datasets: [
        {
          label: t('eventTrack.chartPace'),
          data: profile.map((point) => point.paceSecondsPerKm),
          borderColor: PACE_COLOR,
          backgroundColor: PACE_COLOR,
          pointRadius: 0,
          borderWidth: 2,
          tension: 0.3,
          yAxisID: 'pace',
          order: 1,
        },
        ...(hasElevation
          ? [
              {
                label: t('eventTrack.chartElevation'),
                data: profile.map((point) => point.elevationMeters ?? null),
                borderColor: ELEVATION_COLOR,
                // Sits behind the pace line as context, not as a second reading.
                backgroundColor:
                  effectiveTheme === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.25)',
                fill: true,
                pointRadius: 0,
                borderWidth: 1,
                tension: 0.3,
                yAxisID: 'elevation',
                order: 2,
              },
            ]
          : []),
      ],
    }),
    [profile, hasElevation, effectiveTheme, t],
  )

  if (profile.length < MIN_PLOTTABLE_POINTS) return null

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { display: true, position: 'top' as const },
      tooltip: {
        callbacks: {
          title: (items: { label?: string }[]) =>
            t('eventTrack.chartDistanceTooltip', { distance: items[0]?.label ?? '' }),
          label: (context: { datasetIndex: number; parsed: { y: number | null } }) => {
            // Elevation is null wherever the file had no altitude for that stretch.
            if (context.parsed.y === null) return ''
            return context.datasetIndex === 0
              ? `${t('eventTrack.chartPace')}: ${formatPaceSeconds(context.parsed.y)}`
              : `${t('eventTrack.chartElevation')}: ${Math.round(context.parsed.y)} m`
          },
        },
      },
    },
    scales: {
      pace: {
        type: 'linear' as const,
        position: 'left' as const,
        // Faster reads as higher, the way a pace chart is expected to.
        reverse: true,
        title: { display: true, text: t('eventTrack.chartPaceAxis') },
        ticks: {
          callback: (value: string | number) => formatPaceSeconds(Number(value)),
        },
      },
      elevation: {
        type: 'linear' as const,
        position: 'right' as const,
        display: hasElevation,
        title: { display: true, text: t('eventTrack.chartElevationAxis') },
        grid: { drawOnChartArea: false },
      },
      x: {
        title: { display: true, text: t('eventTrack.chartDistanceAxis') },
        ticks: { maxTicksLimit: 8, autoSkip: true },
      },
    },
  }

  return (
    <div className="h-64 w-full sm:h-72">
      <Line data={data} options={options} />
    </div>
  )
}
