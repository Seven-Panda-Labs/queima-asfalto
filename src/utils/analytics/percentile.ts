import { parseClassification } from '../classification'
import type { AnalysableResult } from './results'

/**
 * Posição no pelotão. A classificação é guardada como texto e pode trazer
 * várias linhas (geral, escalão, …); nada no modelo diz qual é qual, por isso
 * assume-se a primeira como geral — a mesma leitura que
 * `formatClassificationDisplay` já faz na tabela.
 */
export type FieldPlacing = {
  position: number
  total: number
  /** 0 = vencedor, 1 = último. Menor é melhor. */
  fraction: number
  /** Percentagem do pelotão que ficou atrás, arredondada. */
  topPercent: number
}

export function parseFieldPlacing(classification?: string | null): FieldPlacing | null {
  if (!classification?.trim()) return null

  const firstLine = classification.split('\n')[0]?.replace(/^\d+\.\s*/, '').trim() ?? ''
  const parsed = parseClassification(firstLine)
  if (!parsed) return null
  if (parsed.position > parsed.total) return null

  const fraction = parsed.position / parsed.total
  return {
    position: parsed.position,
    total: parsed.total,
    fraction,
    topPercent: Math.max(1, Math.round(fraction * 100)),
  }
}

export type PercentilePoint = {
  result: AnalysableResult
  placing: FieldPlacing
}

/**
 * Complemento ao ritmo: o percentil é quase imune ao percurso e ao tempo que
 * fez nesse dia. Uma prova lenta num percurso duro continua a mostrar-se boa
 * aqui, e é por isso que vale a pena ter os dois gráficos.
 */
export function buildPercentileSeries(results: AnalysableResult[]): PercentilePoint[] {
  return results
    .map((result) => {
      const placing = parseFieldPlacing(result.event.classification)
      return placing ? { result, placing } : null
    })
    .filter((point): point is PercentilePoint => point !== null)
}

export type PercentileSummary = {
  races: number
  bestTopPercent: number
  averageTopPercent: number
  best: PercentilePoint
}

export function summarisePercentiles(points: PercentilePoint[]): PercentileSummary | null {
  if (points.length === 0) return null

  const best = points.reduce((current, point) =>
    point.placing.fraction < current.placing.fraction ? point : current,
  )
  const average =
    points.reduce((sum, point) => sum + point.placing.fraction, 0) / points.length

  return {
    races: points.length,
    bestTopPercent: best.placing.topPercent,
    averageTopPercent: Math.max(1, Math.round(average * 100)),
    best,
  }
}
