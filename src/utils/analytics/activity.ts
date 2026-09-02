import type { AnalysableResult } from './results'
import { totalDistanceKm, totalTimeSeconds } from './results'

const MS_PER_DAY = 24 * 60 * 60 * 1000

export type CareerTotals = {
  races: number
  /** Races started and not finished. Real races, with no comparable time. */
  dnf: number
  distanceKm: number
  timeSeconds: number
  firstRace: AnalysableResult
  lastRace: AnalysableResult
  seasons: number
  locations: number
}

/** Expects `results` in chronological order. */
export function computeCareerTotals(
  results: AnalysableResult[],
  dnf = 0,
): CareerTotals | null {
  if (results.length === 0) return null

  const locations = new Set(
    results
      .map((result) => result.event.location?.trim().toLowerCase())
      .filter((location): location is string => Boolean(location)),
  )

  return {
    races: results.length,
    dnf,
    distanceKm: totalDistanceKm(results),
    timeSeconds: totalTimeSeconds(results),
    firstRace: results[0]!,
    lastRace: results[results.length - 1]!,
    seasons: new Set(results.map((result) => result.year)).size,
    locations: locations.size,
  }
}

export type ActivityCell = {
  year: number
  /** 0 is January. */
  month: number
  races: number
  distanceKm: number
}

export type ActivityCalendar = {
  years: number[]
  cells: ActivityCell[]
  maxRaces: number
  maxDistanceKm: number
}

/** Year by month. Shows what no average shows: dead seasons and whether the habit is steadying. */
export function buildActivityCalendar(results: AnalysableResult[]): ActivityCalendar {
  if (results.length === 0) return { years: [], cells: [], maxRaces: 0, maxDistanceKm: 0 }

  const firstYear = results[0]!.year
  const lastYear = results[results.length - 1]!.year
  const years: number[] = []
  for (let year = lastYear; year >= firstYear; year -= 1) years.push(year)

  const counts = new Map<string, ActivityCell>()
  for (const result of results) {
    const month = result.date.getMonth()
    const key = `${result.year}-${month}`
    const cell = counts.get(key)
    if (cell) {
      cell.races += 1
      cell.distanceKm += result.distanceKm
    } else {
      counts.set(key, {
        year: result.year,
        month,
        races: 1,
        distanceKm: result.distanceKm,
      })
    }
  }

  const cells: ActivityCell[] = []
  for (const year of years) {
    for (let month = 0; month < 12; month += 1) {
      cells.push(counts.get(`${year}-${month}`) ?? { year, month, races: 0, distanceKm: 0 })
    }
  }

  return {
    years,
    cells,
    maxRaces: Math.max(...cells.map((cell) => cell.races)),
    maxDistanceKm: Math.max(...cells.map((cell) => cell.distanceKm)),
  }
}

export type ActivityRhythm = {
  /** Longest gap between races, in days. `null` below two races. */
  longestGapDays: number | null
  daysSinceLastRace: number
  activeMonths: number
  /** Consecutive months with a race, counting back from the last. */
  currentMonthStreak: number
}

function monthIndex(date: Date): number {
  return date.getFullYear() * 12 + date.getMonth()
}

export function computeActivityRhythm(
  results: AnalysableResult[],
  today: Date = new Date(),
): ActivityRhythm | null {
  if (results.length === 0) return null

  let longestGapDays: number | null = null
  for (let index = 1; index < results.length; index += 1) {
    const gap = Math.round(
      (results[index]!.date.getTime() - results[index - 1]!.date.getTime()) / MS_PER_DAY,
    )
    if (longestGapDays === null || gap > longestGapDays) longestGapDays = gap
  }

  const months = new Set(results.map((result) => monthIndex(result.date)))
  const lastRace = results[results.length - 1]!

  let currentMonthStreak = 0
  let cursor = monthIndex(lastRace.date)
  while (months.has(cursor)) {
    currentMonthStreak += 1
    cursor -= 1
  }

  return {
    longestGapDays,
    daysSinceLastRace: Math.max(
      0,
      Math.round((today.getTime() - lastRace.date.getTime()) / MS_PER_DAY),
    ),
    activeMonths: months.size,
    currentMonthStreak,
  }
}
