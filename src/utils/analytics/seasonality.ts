import { buildEquivalentSeries } from './equivalence'
import type { AnalysableResult } from './results'

export type SeasonalityMonth = {
  /** 0 is January. */
  month: number
  races: number
  /** Mean form index for that month across every year. */
  averageIndex: number | null
}

export type Seasonality = {
  months: SeasonalityMonth[]
  bestMonth: SeasonalityMonth | null
  worstMonth: SeasonalityMonth | null
  /** Distinct months with races. Below 8 the reading is worthless. */
  coveredMonths: number
}

/** Patterns a chronological line hides: summer, the weeks after a marathon, the autumn peak. Uses the index because months mix distances. */
export function computeSeasonality(
  results: AnalysableResult[],
  referenceKm: number,
): Seasonality {
  const series = buildEquivalentSeries(results, referenceKm)

  const buckets = Array.from({ length: 12 }, (_, month) => ({
    month,
    races: 0,
    indexSum: 0,
  }))

  for (const point of series) {
    const bucket = buckets[point.result.date.getMonth()]!
    bucket.races += 1
    bucket.indexSum += point.index
  }

  const months: SeasonalityMonth[] = buckets.map((bucket) => ({
    month: bucket.month,
    races: bucket.races,
    averageIndex: bucket.races > 0 ? bucket.indexSum / bucket.races : null,
  }))

  const ranked = months.filter(
    (month): month is SeasonalityMonth & { averageIndex: number } => month.averageIndex !== null,
  )

  return {
    months,
    bestMonth:
      ranked.length > 0
        ? ranked.reduce((best, month) => (month.averageIndex > best.averageIndex ? month : best))
        : null,
    worstMonth:
      ranked.length > 0
        ? ranked.reduce((worst, month) => (month.averageIndex < worst.averageIndex ? month : worst))
        : null,
    coveredMonths: ranked.length,
  }
}
