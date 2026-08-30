import type { EventType } from '../../types/Event'
import { EVENT_TYPES } from '../../types/Event'
import { NOMINAL_DISTANCE_KM, type AnalysableResult } from './results'

/**
 * Expoente de Riegel. 1.06 é o valor clássico e serve bem entre distâncias
 * vizinhas; extrapolações longas (5K → maratona) são optimistas para quem não
 * tem base de resistência. Por isso estes valores aparecem sempre rotulados
 * como estimativa e nunca substituem um recorde real.
 */
export const RIEGEL_EXPONENT = 1.06

/** T2 = T1 × (D2 / D1) ^ 1.06 */
export function equivalentTimeSeconds(
  timeSeconds: number,
  fromKm: number,
  toKm: number,
): number | null {
  if (!(timeSeconds > 0) || !(fromKm > 0) || !(toKm > 0)) return null
  return timeSeconds * Math.pow(toKm / fromKm, RIEGEL_EXPONENT)
}

export type EquivalentPoint = {
  result: AnalysableResult
  /** Tempo que este resultado vale à distância de referência. */
  equivalentSeconds: number
  /** 100 = a melhor marca de sempre; 95 = 5% mais lento em tempo equivalente. */
  index: number
}

/**
 * A distância de referência escolhe-se pela disciplina mais corrida, com a mais
 * longa a desempatar — quem tem 4 dez-quilómetros e 4 maratonas pensa em
 * maratonas. Vale a pena notar que a escolha **não** altera o índice nem a
 * forma da curva: no rácio entre dois tempos equivalentes o factor da distância
 * de referência cancela-se. Só muda a unidade em que os tempos são lidos.
 */
export function pickReferenceEventType(results: AnalysableResult[]): EventType | null {
  if (results.length === 0) return null

  const counts = new Map<EventType, number>()
  for (const result of results) {
    counts.set(result.eventType, (counts.get(result.eventType) ?? 0) + 1)
  }

  let best: EventType | null = null
  let bestCount = 0
  for (const eventType of EVENT_TYPES) {
    const count = counts.get(eventType) ?? 0
    if (count === 0) continue
    // EVENT_TYPES está ordenado do mais curto ao mais longo, portanto `>=`
    // deixa a distância mais longa ganhar os empates.
    if (count >= bestCount) {
      best = eventType
      bestCount = count
    }
  }

  return best
}

/**
 * Curva de forma: todos os resultados no mesmo eixo, independentemente da
 * distância. É o que permite responder a «estou melhor do que no ano passado»
 * a quem corre distâncias diferentes — comparar ritmos não permitiria.
 */
export function buildEquivalentSeries(
  results: AnalysableResult[],
  referenceKm: number,
): EquivalentPoint[] {
  const equivalents = results
    .map((result) => ({
      result,
      equivalentSeconds: equivalentTimeSeconds(
        result.timeSeconds,
        result.distanceKm,
        referenceKm,
      ),
    }))
    .filter(
      (point): point is { result: AnalysableResult; equivalentSeconds: number } =>
        point.equivalentSeconds !== null,
    )

  if (equivalents.length === 0) return []

  const best = Math.min(...equivalents.map((point) => point.equivalentSeconds))

  return equivalents.map((point) => ({
    ...point,
    index: (best / point.equivalentSeconds) * 100,
  }))
}

export type RacePrediction = {
  eventType: EventType
  distanceKm: number
  predictedSeconds: number
  /** A prova de onde a estimativa saiu, para a página poder ser honesta sobre a base. */
  basedOn: AnalysableResult
}

/**
 * Estimativas a partir da melhor marca recente. A base é a prova com o melhor
 * tempo equivalente dentro da janela, não a mais recente: uma prova de treino
 * mal corrida não deve baixar a previsão de todas as distâncias.
 */
export function predictRaceTimes(
  results: AnalysableResult[],
  referenceKm: number,
): RacePrediction[] {
  const series = buildEquivalentSeries(results, referenceKm)
  if (series.length === 0) return []

  const base = series.reduce((best, point) =>
    point.equivalentSeconds < best.equivalentSeconds ? point : best,
  )

  return EVENT_TYPES.map((eventType) => {
    const distanceKm = NOMINAL_DISTANCE_KM[eventType]
    const predictedSeconds = equivalentTimeSeconds(
      base.result.timeSeconds,
      base.result.distanceKm,
      distanceKm,
    )
    if (predictedSeconds === null) return null
    return { eventType, distanceKm, predictedSeconds, basedOn: base.result }
  }).filter((prediction): prediction is RacePrediction => prediction !== null)
}
