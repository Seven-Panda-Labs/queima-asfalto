import { useTranslation } from 'react-i18next'
import { Line } from 'react-chartjs-2'
import type { Plugin } from 'chart.js'
import './chartConfig'
import { useTheme } from '../../contexts/ThemeContext'
import type { WeightEntry } from '../../types/WeightEntry'
import { formatDatePt, parseDateInput } from '../../utils/date'
import { weighIns, type WeightRace } from '../../utils/weightLog'

const LINE_COLOR = '#2563EB'
const NOTE_COLOR = '#F97316'
const NOTE_LINE_COLOR = 'rgba(249, 115, 22, 0.5)'
const RACE_COLOR = '#10B981'
const RACE_LINE_COLOR = 'rgba(16, 185, 129, 0.6)'
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

export function WeightChart({
  entries,
  races,
}: {
  entries: Pick<WeightEntry, 'date' | 'weightKg' | 'note'>[]
  races: WeightRace[]
}) {
  const { t, i18n } = useTranslation()
  const { effectiveTheme } = useTheme()
  const kg = new Intl.NumberFormat(i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const dayMs = (date: string) => parseDateInput(date).getTime()

  const weights = weighIns(entries).map((entry) => ({ x: dayMs(entry.date), y: entry.weightKg }))
  // Markers sit on their own 0..1 axis, so they never stretch the weight scale.
  const notes = entries.flatMap((entry) => (entry.note ? [{ x: dayMs(entry.date), y: 0.95, text: entry.note }] : []))
  const racePoints = races.map((race) => ({
    x: dayMs(race.date),
    y: 0.05,
    text: race.emoji ? `${race.emoji} ${race.name}` : race.name,
  }))

  const markerLines: Plugin<'line'> = {
    id: 'weightMarkerLines',
    beforeDatasetsDraw(chart) {
      const { ctx, chartArea, scales } = chart
      const draw = (points: { x: number }[], color: string, dash: number[]) => {
        ctx.strokeStyle = color
        ctx.setLineDash(dash)
        for (const { x } of points) {
          const pixel = scales.x!.getPixelForValue(x)
          ctx.beginPath()
          ctx.moveTo(pixel, chartArea.top)
          ctx.lineTo(pixel, chartArea.bottom)
          ctx.stroke()
        }
      }
      ctx.save()
      draw(notes, NOTE_LINE_COLOR, [4, 4])
      draw(racePoints, RACE_LINE_COLOR, [])
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
            const raw = context.raw as { y: number; text?: string }
            return raw.text ? wrap(raw.text) : t('tools.weightLog.kg', { weight: kg.format(raw.y) })
          },
        },
      },
    },
    scales: {
      // A weight moves by a kilo or two; an axis from zero would draw a flat line.
      y: { grace: 1, ticks: { callback: (value: string | number) => kg.format(Number(value)) } },
      markers: { display: false, min: 0, max: 1 },
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
        plugins={[markerLines]}
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
              yAxisID: 'markers',
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
            {
              label: t('tools.weightLog.race'),
              data: racePoints,
              yAxisID: 'markers',
              showLine: false,
              borderColor: RACE_COLOR,
              backgroundColor: RACE_COLOR,
              pointStyle: 'rectRot' as const,
              pointRadius: 6,
              pointHoverRadius: 8,
              pointHitRadius: 12,
            },
          ],
        }}
        options={options}
      />
    </div>
  )
}
