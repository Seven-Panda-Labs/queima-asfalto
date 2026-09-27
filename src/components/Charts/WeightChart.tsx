import { useTranslation } from 'react-i18next'
import { Line } from 'react-chartjs-2'
import './chartConfig'
import { useTheme } from '../../contexts/ThemeContext'
import type { WeightEntry } from '../../types/WeightEntry'
import { formatDatePt, parseDateInput } from '../../utils/date'

const LINE_COLOR = '#2563EB'

export function WeightChart({ entries }: { entries: Pick<WeightEntry, 'date' | 'weightKg'>[] }) {
  const { t, i18n } = useTranslation()
  const { effectiveTheme } = useTheme()
  const kg = new Intl.NumberFormat(i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 1 })

  const data = entries.map((entry) => ({ x: parseDateInput(entry.date).getTime(), y: entry.weightKg }))

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
          label: (context: { raw: unknown }) =>
            t('tools.weightLog.kg', { weight: kg.format((context.raw as { y: number }).y) }),
        },
      },
    },
    scales: {
      // A weight moves by a kilo or two; an axis from zero would draw a flat line.
      y: { grace: 1, ticks: { callback: (value: string | number) => kg.format(Number(value)) } },
      x: {
        type: 'linear' as const,
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          callback: (value: string | number) => formatDatePt(new Date(Number(value))),
        },
      },
    },
  }

  return (
    <div className="h-64 w-full sm:h-72">
      <Line
        key={effectiveTheme}
        data={{
          datasets: [
            {
              label: t('tools.weightLog.title'),
              data,
              borderColor: LINE_COLOR,
              backgroundColor: LINE_COLOR,
              pointRadius: 4,
              // Monotone never overshoots: a plain curve drew weights nobody logged.
              cubicInterpolationMode: 'monotone' as const,
            },
          ],
        }}
        options={options}
      />
    </div>
  )
}
