import { recordsSetIn } from './records'
import {
  totalDistanceKm,
  totalTimeSeconds,
  weightedAveragePaceSeconds,
  type AnalysableResult,
} from './results'

/** Época = ano civil, em toda a app (`Goal.year`, `PerformanceGoal.year`, filtros). */
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
  /** Negativo = mais rápido. `null` quando falta ritmo de um dos lados. */
  averagePaceSeconds: number | null
  recordsSet: number
}

export type SeasonComparison = {
  current: SeasonSummary
  /** Época anterior truncada ao mesmo ponto do ano, ou `null` se não houver. */
  previous: SeasonSummary | null
  delta: SeasonDelta | null
  /** Dia do ano até onde a época anterior foi cortada; `null` em épocas fechadas. */
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
    // Um recorde conta no ano em que caiu, e para isso é preciso o histórico
    // todo: o mesmo tempo pode ser recorde em 2024 e banal em 2026.
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

/**
 * Compara uma época com a anterior. Numa época a decorrer, a anterior é cortada
 * no mesmo dia do ano — senão Março estaria sempre a perder contra doze meses
 * inteiros e o delta só ficaria justo em Dezembro.
 */
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

/**
 * Km acumulados ao longo do ano, uma linha por época. É a leitura mais directa
 * de «estou à frente do ano passado»: as linhas separam-se no dia em que
 * passaste à frente.
 */
export function buildCumulativeSeasons(results: AnalysableResult[]): CumulativeSeason[] {
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

      return { year, points, totalKm: running }
    })
}

export function availableSeasons(results: AnalysableResult[]): number[] {
  return [...new Set(results.map((result) => result.year))].sort((left, right) => right - left)
}
