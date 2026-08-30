import { useTranslation } from 'react-i18next'
import { Bar } from 'react-chartjs-2'
import './chartConfig'
import { useTheme } from '../../contexts/ThemeContext'
import type { Seasonality } from '../../utils/analytics/seasonality'

/** Months with no races stay empty rather than zero: zero would be a claim about form there is no data for. */
export function SeasonalityChart({ seasonality }: { seasonality: Seasonality }) {
  const { t, i18n } = useTranslation()
  const { effectiveTheme } = useTheme()

  const monthLabel = new Intl.DateTimeFormat(i18n.language, { month: 'short' })
  const values = seasonality.months.map((month) => month.averageIndex)
  const known = values.filter((value): value is number => value !== null)
  const floor = Math.max(0, Math.floor(Math.min(...known) - 2))

  const data = {
    labels: seasonality.months.map((month) => monthLabel.format(new Date(2026, month.month, 1))),
    datasets: [
      {
        label: t('analysis.seasonalitySeries'),
        data: values,
        backgroundColor: seasonality.months.map((month) =>
          month.month === seasonality.bestMonth?.month
            ? '#10B981'
            : month.month === seasonality.worstMonth?.month
              ? '#EF4444'
              : '#94A3B8',
        ),
        borderRadius: 4,
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
          label: (context: { dataIndex: number }) => {
            const month = seasonality.months[context.dataIndex]
            if (!month || month.averageIndex === null) return t('analysis.seasonalityNoRaces')
            return [
              t('analysis.tooltipIndex', { index: month.averageIndex.toFixed(1) }),
              t('analysis.tooltipRaces', { count: month.races }),
            ]
          },
        },
      },
    },
    scales: {
      y: {
        // Starting at zero squashes every bar against the top; the whole
        // difference that matters lives between 88 and 100.
        min: floor,
        title: { display: true, text: t('analysis.formAxis') },
      },
    },
  }

  return (
    <div className="h-56 w-full sm:h-64">
      <Bar key={effectiveTheme} data={data} options={options} />
    </div>
  )
}
