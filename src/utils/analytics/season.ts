import { recordsSetIn } from './records'
import {
  totalDistanceKm,
  totalTimeSeconds,
  weightedAveragePaceSeconds,
  type AnalysableResult,
} from './results'

/** Season is the calendar year, as in `Goal.year` and every filter. */
export type SeasonSummary = {
  year: number
  races: number
  distanceKm: number
  timeSeconds: number
  averagePaceSeconds: number | null
  recordsSet: number
}

export type SeasonDelta = {
  races: number
  distanceKm: number
  timeSeconds: number
  /** Negative is faster. `null` when either side has no pace. */
  averagePaceSeconds: number | null
  recordsSet: number
}

export type SeasonComparison = {
  current: SeasonSummary
  /** Previous season cut to the same point of the year, or `null`. */
  previous: SeasonSummary | null
  delta: SeasonDelta | null
  /** Where the cut falls; `null` for a closed season. */
  throughDayOfYear: number | null
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1)
  const current = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.round((current.getTime() - start.getTime()) / MS_PER_DAY) + 1
}

export function resultsInSeason(
  results: AnalysableResult[],
  year: number,
  throughDayOfYear?: number | null,
): AnalysableResult[] {
  return results.filter((result) => {
    if (result.year !== year) return false
    if (throughDayOfYear == null) return true
    return dayOfYear(result.date) <= throughDayOfYear
  })
}

export function computeSeasonSummary(
  results: AnalysableResult[],
  year: number,
  throughDayOfYear?: number | null,
): SeasonSummary {
  const seasonResults = resultsInSeason(results, year, throughDayOfYear)

  return {
    year,
    races: seasonResults.length,
    distanceKm: totalDistanceKm(seasonResults),
    timeSeconds: totalTimeSeconds(seasonResults),
    averagePaceSeconds: weightedAveragePaceSeconds(seasonResults),
    // A record counts in the year it fell, which needs the whole history:
    // the same time can be a record in 2024 and ordinary in 2026.
    recordsSet: recordsSetIn(
      throughDayOfYear == null
        ? results
        : results.filter(
            (result) => result.year < year || dayOfYear(result.date) <= throughDayOfYear,
          ),
      year,
    ),
  }
}

/** In a running season the previous one is cut to the same day, or March would always lose to twelve full months. */
export function compareSeasons(
  results: AnalysableResult[],
  year: number,
  today: Date = new Date(),
): SeasonComparison {
  const isOngoing = today.getFullYear() === year
  const throughDay = isOngoing ? dayOfYear(today) : null

  const current = computeSeasonSummary(results, year, throughDay)
  const hasPrevious = results.some((result) => result.year === year - 1)
  const previous = hasPrevious ? computeSeasonSummary(results, year - 1, throughDay) : null

  const delta: SeasonDelta | null = previous
    ? {
        races: current.races - previous.races,
        distanceKm: current.distanceKm - previous.distanceKm,
        timeSeconds: current.timeSeconds - previous.timeSeconds,
        averagePaceSeconds:
          current.averagePaceSeconds !== null && previous.averagePaceSeconds !== null
            ? current.averagePaceSeconds - previous.averagePaceSeconds
            : null,
        recordsSet: current.recordsSet - previous.recordsSet,
      }
    : null

  return { current, previous, delta, throughDayOfYear: throughDay }
}

export type CumulativePoint = { dayOfYear: number; distanceKm: number }

export type CumulativeSeason = {
  year: number
  points: CumulativePoint[]
  totalKm: number
}

const LAST_DAY_OF_YEAR = 366

/**
 * Cumulative km per season. Each line runs past the last race: to 31 December
 * for a closed season, to today for the running one. A total never falls, so
 * the flat stretch is true rather than invented, and the running season stops
 * at today because December would claim races that have not happened.
 */
export function buildCumulativeSeasons(
  results: AnalysableResult[],
  today: Date = new Date(),
): CumulativeSeason[] {
  const byYear = new Map<number, AnalysableResult[]>()
  for (const result of results) {
    const bucket = byYear.get(result.year)
    if (bucket) bucket.push(result)
    else byYear.set(result.year, [result])
  }

  return [...byYear.entries()]
    .sort(([left], [right]) => left - right)
    .map(([year, seasonResults]) => {
      let running = 0
      const points: CumulativePoint[] = [{ dayOfYear: 0, distanceKm: 0 }]

      for (const result of seasonResults) {
        running += result.distanceKm
        points.push({ dayOfYear: dayOfYear(result.date), distanceKm: running })
      }

      const endsAt =
        year === today.getFullYear() ? dayOfYear(today) : year < today.getFullYear()
          ? LAST_DAY_OF_YEAR
          : points[points.length - 1]!.dayOfYear

      if (endsAt > points[points.length - 1]!.dayOfYear) {
        points.push({ dayOfYear: endsAt, distanceKm: running })
      }

      return { year, points, totalKm: running }
    })
}

export function availableSeasons(results: AnalysableResult[]): number[] {
  return [...new Set(results.map((result) => result.year))].sort((left, right) => right - left)
}

export type SeasonEnvelopePoint = {
  dayOfYear: number
  minKm: number
  maxKm: number
}

/** Cumulative km on any day: the last mark up to that day. */
export function cumulativeKmAt(season: CumulativeSeason, day: number): number {
  let value = 0
  for (const point of season.points) {
    if (point.dayOfYear > day) break
    value = point.distanceKm
  }
  return value
}

/** The range the older seasons ran in. Past the third line, crossing step curves are noise; a band keeps the information as context. */
export function buildSeasonEnvelope(
  seasons: CumulativeSeason[],
  stepDays = 7,
): SeasonEnvelopePoint[] {
  if (seasons.length === 0) return []

  const points: SeasonEnvelopePoint[] = []
  for (let day = 0; day <= 366; day += stepDays) {
    const values = seasons.map((season) => cumulativeKmAt(season, day))
    points.push({
      dayOfYear: day,
      minKm: Math.min(...values),
      maxKm: Math.max(...values),
    })
  }

  return points
}
