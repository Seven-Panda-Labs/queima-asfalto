import { useTranslation } from 'react-i18next'
import { Line } from 'react-chartjs-2'
import type { Plugin } from 'chart.js'
import './chartConfig'
import { useTheme } from '../../contexts/ThemeContext'
import type { WeightEntry } from '../../types/WeightEntry'
import { formatDatePt, parseDateInput } from '../../utils/date'
import { weighIns } from '../../utils/weightLog'

const LINE_COLOR = '#2563EB'
const NOTE_COLOR = '#F97316'
const NOTE_LINE_COLOR = 'rgba(249, 115, 22, 0.5)'
const TOOLTIP_LINE_LENGTH = 32

/** Chart.js tooltips do not wrap, and a note runs to 80 characters. */
function wrap(text: string): string[] {
  const lines: string[] = []
  for (const word of text.split(/\s+/)) {
    const last = lines.at(-1)
    if (last !== undefined && last.length + word.length < TOOLTIP_LINE_LENGTH) lines[lines.length - 1] = `${last} ${word}`
    else lines.push(word)
  }
  return lines
}

export function WeightChart({ entries }: { entries: Pick<WeightEntry, 'date' | 'weightKg' | 'note'>[] }) {
  const { t, i18n } = useTranslation()
  const { effectiveTheme } = useTheme()
  const kg = new Intl.NumberFormat(i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const dayMs = (date: string) => parseDateInput(date).getTime()

  const weights = weighIns(entries).map((entry) => ({ x: dayMs(entry.date), y: entry.weightKg }))
  // Flags sit near the top of their own 0..1 axis, so a note never stretches the weight scale.
  const notes = entries.flatMap((entry) => (entry.note ? [{ x: dayMs(entry.date), y: 0.95, note: entry.note }] : []))

  const noteLines: Plugin<'line'> = {
    id: 'weightNoteLines',
    beforeDatasetsDraw(chart) {
      const { ctx, chartArea, scales } = chart
      ctx.save()
      ctx.strokeStyle = NOTE_LINE_COLOR
      ctx.setLineDash([4, 4])
      for (const { x } of notes) {
        const pixel = scales.x!.getPixelForValue(x)
        ctx.beginPath()
        ctx.moveTo(pixel, chartArea.top)
        ctx.lineTo(pixel, chartArea.bottom)
        ctx.stroke()
      }
      ctx.restore()
    },
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
          label: (context: { raw: unknown }) => {
            const raw = context.raw as { y: number; note?: string }
            return raw.note ? wrap(raw.note) : t('tools.weightLog.kg', { weight: kg.format(raw.y) })
          },
        },
      },
    },
    scales: {
      // A weight moves by a kilo or two; an axis from zero would draw a flat line.
      y: { grace: 1, ticks: { callback: (value: string | number) => kg.format(Number(value)) } },
      notes: { display: false, min: 0, max: 1 },
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
        plugins={[noteLines]}
        data={{
          datasets: [
            {
              label: t('tools.weightLog.title'),
              data: weights,
              borderColor: LINE_COLOR,
              backgroundColor: LINE_COLOR,
              pointRadius: 4,
              // Monotone never overshoots: a plain curve drew weights nobody logged.
              cubicInterpolationMode: 'monotone' as const,
            },
            {
              label: t('tools.weightLog.note'),
              data: notes,
              yAxisID: 'notes',
              showLine: false,
              borderColor: NOTE_COLOR,
              backgroundColor: NOTE_COLOR,
              pointStyle: 'triangle' as const,
              pointRotation: 180,
              pointRadius: 7,
              pointHoverRadius: 9,
              // Easy to hit with a finger: there is no hover on a phone.
              pointHitRadius: 12,
            },
          ],
        }}
        options={options}
      />
    </div>
  )
}
