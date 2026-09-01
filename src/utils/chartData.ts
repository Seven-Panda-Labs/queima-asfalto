import type { Event, EventType } from '../types/Event'
import { EVENT_TYPES } from '../types/Event'
import { formatDatePt } from './date'

const PACE_PATTERN = /^(\d{1,2}):(\d{2})$/

function parsePaceToSeconds(pace: string): number | null {
  const match = PACE_PATTERN.exec(pace.trim())
  if (!match) return null

  const minutes = Number(match[1])
  const seconds = Number(match[2])
  if (seconds > 59) return null

  return minutes * 60 + seconds
}

export type PaceChartPoint = {
  date: Date
  label: string
  paceSeconds: number
  event: Event
}

export type PaceChartSeries = {
  eventType: EventType
  points: PaceChartPoint[]
}

/**
 * One hue per distance family, and a lightness step per discipline inside it:
 * within a family, darker is longer. The four disciplines the app shipped with
 * keep their exact colours, so nothing an existing chart shows repaints.
 *
 * This is not a 13 slot categorical palette and must not be read as one. Across
 * families the hue does the identity work; inside a family the steps are ordinal,
 * and two neighbouring steps are deliberately close. Exact identity comes from
 * the legend and the tooltip, never from the colour alone, which is also why the
 * point charts carry `PACE_CHART_POINT_STYLES`.
 *
 * Validated against a white and a `#1e1e1e` surface: every step sits in the
 * light band with chroma above the 0.10 floor, and adjacent families clear the
 * colour vision separation floor. Two knowingly kept exceptions, both older than
 * this palette: `#10B981` and `#F97316` sit above the dark mode lightness band
 * and below 3:1 on white, and `km_5` against `km_42_2` collapses under
 * protanopia, which is what the point styles exist to answer.
 */
export const PACE_CHART_COLORS: Record<EventType, string> = {
  // Track and under 5K
  m_1500: '#0091ff',
  m_3000: '#007afd',
  km_5: '#2563EB',
  // Short road
  km_10: '#10B981',
  km_15: '#1e9f5a',
  mi_10: '#298631',
  // Long road
  km_21_1: '#F97316',
  km_30: '#d15d00',
  // Marathon and ultra
  km_42_2: '#8B5CF6',
  km_50: '#9a46db',
  mi_50: '#a42fba',
  // Long ultra
  km_100: '#d63d99',
  mi_100: '#c61f75',
}

/**
 * Shape per family, so a chart that mixes disciplines does not rely on colour
 * for identity. Chart.js point styles.
 */
export const PACE_CHART_POINT_STYLES: Record<EventType, string> = {
  m_1500: 'circle',
  m_3000: 'circle',
  km_5: 'circle',
  km_10: 'triangle',
  km_15: 'triangle',
  mi_10: 'triangle',
  km_21_1: 'rect',
  km_30: 'rect',
  km_42_2: 'rectRot',
  km_50: 'rectRot',
  mi_50: 'rectRot',
  km_100: 'star',
  mi_100: 'star',
}

export function buildPaceChartData(events: Event[], eventType: EventType): PaceChartPoint[] {
  return events
    .filter(
      (event) =>
        event.status === 'completed' &&
        event.eventType === eventType &&
        event.pace !== undefined &&
        event.pace !== null &&
        event.pace !== '',
    )
    .map((event) => {
      const paceSeconds = parsePaceToSeconds(event.pace!)
      if (paceSeconds === null) return null

      return {
        date: event.date,
        label: formatDatePt(event.date),
        paceSeconds,
        event,
      }
    })
    .filter((point): point is PaceChartPoint => point !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

export function buildPaceChartSeries(
  events: Event[],
  eventType: EventType | 'all',
): PaceChartSeries[] {
  if (eventType !== 'all') {
    const points = buildPaceChartData(events, eventType)
    return points.length > 0 ? [{ eventType, points }] : []
  }

  return EVENT_TYPES.map((type) => ({
    eventType: type,
    points: buildPaceChartData(events, type),
  })).filter((series) => series.points.length > 0)
}

export function formatPaceSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function pacePointColor(paceSeconds: number, averageSeconds: number): string {
  if (paceSeconds <= averageSeconds * 0.98) return '#10B981'
  if (paceSeconds <= averageSeconds * 1.02) return '#F97316'
  return '#EF4444'
}
