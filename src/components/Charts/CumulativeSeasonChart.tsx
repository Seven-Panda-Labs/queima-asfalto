import { useTranslation } from 'react-i18next'
import { Line } from 'react-chartjs-2'
import './chartConfig'
import { useTheme } from '../../contexts/ThemeContext'
import type { CumulativeSeason } from '../../utils/analytics/season'

/**
 * A época mais recente fica a cheio; as anteriores esbatem-se para trás. São
 * oito cores porque com menos as épocas voltam ao princípio da lista, e a
 * repetição que sai é sempre entre a mais recente e a mais antiga.
 */
const SEASON_COLORS = [
  '#2563EB',
  '#10B981',
  '#F97316',
  '#8B5CF6',
  '#EC4899',
  '#EAB308',
  '#06B6D4',
  '#94A3B8',
]

const MONTH_STARTS = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335]

/**
 * Km acumulados ao longo do ano, uma linha por época. É a leitura mais directa
 * de «estou à frente do ano passado»: as linhas separam-se no dia exacto em que
 * uma época passou a outra.
 */
export function CumulativeSeasonChart({ seasons }: { seasons: CumulativeSeason[] }) {
  const { t, i18n } = useTranslation()
  const { effectiveTheme } = useTheme()

  const monthLabel = new Intl.DateTimeFormat(i18n.language, { month: 'short' })

  const data = {
    datasets: seasons
      .slice()
      .reverse()
      .map((season, position) => ({
        label: String(season.year),
        data: season.points.map((point) => ({ x: point.dayOfYear, y: point.distanceKm })),
        borderColor: SEASON_COLORS[position % SEASON_COLORS.length],
        backgroundColor: SEASON_COLORS[position % SEASON_COLORS.length],
        borderWidth: position === 0 ? 3 : 2,
        pointRadius: 3,
        stepped: 'after' as const,
      })),
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' as const },
      tooltip: {
        callbacks: {
          label: (context: { dataset: { label?: string }; raw: unknown }) => {
            const raw = context.raw as { y?: number } | undefined
            return t('analysis.tooltipCumulative', {
              year: context.dataset.label ?? '',
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
          // Marcas nos inícios de mês: «dia 213» não diz nada a ninguém.
          callback: (value: string | number) => {
            const day = Number(value)
            const month = MONTH_STARTS.indexOf(day)
            if (month === -1) return ''
            return monthLabel.format(new Date(2026, month, 1))
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
      <Line key={effectiveTheme} data={data} options={options} />
    </div>
  )
}
