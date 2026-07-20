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

export const PACE_CHART_COLORS: Record<EventType, string> = {
  km_5: '#2563EB',
  km_10: '#10B981',
  km_21_1: '#F97316',
  km_42_2: '#8B5CF6',
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
