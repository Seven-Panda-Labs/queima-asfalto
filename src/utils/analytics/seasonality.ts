import { buildEquivalentSeries } from './equivalence'
import type { AnalysableResult } from './results'

export type SeasonalityMonth = {
  /** 0 = Janeiro. */
  month: number
  races: number
  /** Média do índice de forma das provas desse mês, em todos os anos. */
  averageIndex: number | null
}

export type Seasonality = {
  months: SeasonalityMonth[]
  bestMonth: SeasonalityMonth | null
  worstMonth: SeasonalityMonth | null
  /** Meses distintos com provas: abaixo de 8 a leitura não vale nada. */
  coveredMonths: number
}

/**
 * Índice médio por mês, agregado em todos os anos. Serve para ver padrões que
 * uma linha cronológica esconde — o Verão, as semanas a seguir a uma maratona,
 * o pico de Outono. Usa o índice e não o ritmo porque os meses têm misturas de
 * distâncias diferentes.
 */
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
