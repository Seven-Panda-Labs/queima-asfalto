import type { Event, EventType } from '../../types/Event'
import { parsePaceSeconds } from '../pace'
import { parseTime } from '../time'

/** Official distances, used only to convert between disciplines. A race's own pace always uses its measured `realDistance`. */
export const NOMINAL_DISTANCE_KM: Record<EventType, number> = {
  km_5: 5,
  km_10: 10,
  km_21_1: 21.0975,
  km_42_2: 42.195,
}

/**
 * A completed race with enough data to analyse.
 *
 * Pace is derived from `time / realDistance`, not read from `event.pace`: the
 * stored field is filled in separately and rounded to the second, so the two
 * disagree. Only time can be summed without bias.
 */
export type AnalysableResult = {
  event: Event
  date: Date
  year: number
  eventType: EventType
  distanceKm: number
  timeSeconds: number
  paceSeconds: number
  /** Time was rebuilt from pace because none was stored. */
  timeFromPace: boolean
}

type Timing = { timeSeconds: number; paceSeconds: number; timeFromPace: boolean }

/** Races imported from a spreadsheet can carry a pace and no time. Rebuilding the time beats dropping the race. */
function resolveTiming(event: Event, distanceKm: number): Timing | null {
  const storedTime = event.time ? parseTime(event.time) : null
  if (storedTime !== null && storedTime > 0) {
    return {
      timeSeconds: storedTime,
      paceSeconds: storedTime / distanceKm,
      timeFromPace: false,
    }
  }

  const storedPace = event.pace ? parsePaceSeconds(event.pace) : null
  if (storedPace !== null && storedPace > 0) {
    return {
      timeSeconds: storedPace * distanceKm,
      paceSeconds: storedPace,
      timeFromPace: true,
    }
  }

  return null
}

export function isAnalysableResult(event: Event): boolean {
  if (event.status !== 'completed') return false
  if (!Number.isFinite(event.realDistance) || event.realDistance <= 0) return false
  return resolveTiming(event, event.realDistance) !== null
}

function toAnalysableResult(event: Event): AnalysableResult | null {
  if (event.status !== 'completed') return null
  if (!Number.isFinite(event.realDistance) || event.realDistance <= 0) return null

  const timing = resolveTiming(event, event.realDistance)
  if (timing === null) return null

  return {
    event,
    date: event.date,
    year: event.date.getFullYear(),
    eventType: event.eventType,
    distanceKm: event.realDistance,
    ...timing,
  }
}

/** Analysable races, oldest first. */
export function toAnalysableResults(events: Event[]): AnalysableResult[] {
  return events
    .map(toAnalysableResult)
    .filter((result): result is AnalysableResult => result !== null)
    .sort((left, right) => left.date.getTime() - right.date.getTime())
}

export function formatPaceSeconds(paceSeconds: number): string {
  const rounded = Math.round(paceSeconds)
  const minutes = Math.floor(rounded / 60)
  const seconds = rounded % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/** Signed, for deltas: "-0:06" reads as six seconds faster. */
export function formatPaceDelta(deltaSeconds: number): string {
  const rounded = Math.round(deltaSeconds)
  if (rounded === 0) return `0:00`
  return `${rounded < 0 ? '-' : '+'}${formatPaceSeconds(Math.abs(rounded))}`
}

export function formatDurationSeconds(totalSeconds: number): string {
  const rounded = Math.round(totalSeconds)
  const hours = Math.floor(rounded / 3600)
  const minutes = Math.floor((rounded % 3600) / 60)
  const seconds = rounded % 60
  if (hours === 0) return `${minutes}:${String(seconds).padStart(2, '0')}`
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/** Hours to one decimal, for "14.5h racing". */
export function formatHours(totalSeconds: number): string {
  return (Math.round((totalSeconds / 3600) * 10) / 10).toString()
}

/** Total time over total distance. Averaging per-race paces would weigh a 5K like a marathon. */
export function weightedAveragePaceSeconds(results: AnalysableResult[]): number | null {
  if (results.length === 0) return null

  let time = 0
  let distance = 0
  for (const result of results) {
    time += result.timeSeconds
    distance += result.distanceKm
  }

  return distance > 0 ? time / distance : null
}

export function totalDistanceKm(results: AnalysableResult[]): number {
  return results.reduce((sum, result) => sum + result.distanceKm, 0)
}

export function totalTimeSeconds(results: AnalysableResult[]): number {
  return results.reduce((sum, result) => sum + result.timeSeconds, 0)
}
