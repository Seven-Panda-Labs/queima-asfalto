import type { Event } from '../types/Event'

export type DashboardStats = {
  totalEvents: number
  completedCount: number
  missedCount: number
  averagePace: string | null
}

const PACE_PATTERN = /^(\d{1,2}):(\d{2})$/

function parsePaceToSeconds(pace: string): number | null {
  const match = PACE_PATTERN.exec(pace.trim())
  if (!match) return null

  const minutes = Number(match[1])
  const seconds = Number(match[2])
  if (seconds > 59) return null

  return minutes * 60 + seconds
}

function formatPaceFromSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function eventsInYear(events: Event[], year: number): Event[] {
  return events.filter(
    (event) => event.date.getFullYear() === year && event.status !== 'cancelled',
  )
}

export function computeDashboardStats(events: Event[], year: number): DashboardStats {
  const yearEvents = eventsInYear(events, year)
  const completed = yearEvents.filter((event) => event.status === 'completed')
  const missed = yearEvents.filter((event) => event.status === 'missed')

  const paceValues = completed
    .map((event) => (event.pace ? parsePaceToSeconds(event.pace) : null))
    .filter((value): value is number => value !== null)

  let averagePace: string | null = null
  if (paceValues.length > 0) {
    const averageSeconds = Math.round(
      paceValues.reduce((sum, value) => sum + value, 0) / paceValues.length,
    )
    averagePace = formatPaceFromSeconds(averageSeconds)
  }

  return {
    totalEvents: yearEvents.length,
    completedCount: completed.length,
    missedCount: missed.length,
    averagePace,
  }
}
