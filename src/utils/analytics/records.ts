import type { EventType } from '../../types/Event'
import { EVENT_TYPES } from '../../types/Event'
import type { AnalysableResult } from './results'

/**
 * Um recorde por disciplina, medido pelo ritmo — a mesma definição que
 * `bestPerformances` usa no Dashboard. A equivalência de Riegel serve para
 * comparar disciplinas **entre si**; dentro da mesma disciplina traria uma
 * segunda definição de «recorde pessoal» que contradiria o resto da app.
 */
export type RecordMark = {
  result: AnalysableResult
  /** Segundos por km ganhos ao recorde anterior; `null` no primeiro da disciplina. */
  improvementSeconds: number | null
  /** Ordem do recorde dentro da disciplina, a começar em 1. */
  ordinal: number
}

export type RecordProgression = {
  eventType: EventType
  /** Só as provas que bateram o recorde, por ordem cronológica. */
  marks: RecordMark[]
  current: RecordMark
}

/** As provas que, no momento em que aconteceram, bateram o recorde da disciplina. */
export function recordMarksFor(
  results: AnalysableResult[],
  eventType: EventType,
): RecordMark[] {
  const marks: RecordMark[] = []
  let best: AnalysableResult | null = null

  for (const result of results) {
    if (result.eventType !== eventType) continue
    if (best !== null && result.paceSeconds >= best.paceSeconds) continue

    marks.push({
      result,
      improvementSeconds: best === null ? null : best.paceSeconds - result.paceSeconds,
      ordinal: marks.length + 1,
    })
    best = result
  }

  return marks
}

/** Espera `results` já ordenado cronologicamente (`toAnalysableResults`). */
export function buildRecordProgressions(results: AnalysableResult[]): RecordProgression[] {
  return EVENT_TYPES.map((eventType) => {
    const marks = recordMarksFor(results, eventType)
    if (marks.length === 0) return null
    return { eventType, marks, current: marks[marks.length - 1]! }
  }).filter((progression): progression is RecordProgression => progression !== null)
}

/** Ids das provas que bateram um recorde, para destacar pontos nos gráficos. */
export function recordResultIds(results: AnalysableResult[]): Set<string> {
  return new Set(
    buildRecordProgressions(results).flatMap((progression) =>
      progression.marks.map((mark) => mark.result.event.id),
    ),
  )
}

/** Quantos recordes caíram num ano — inclui o primeiro de cada disciplina. */
export function recordsSetIn(results: AnalysableResult[], year: number): number {
  return buildRecordProgressions(results).reduce(
    (count, progression) =>
      count + progression.marks.filter((mark) => mark.result.year === year).length,
    0,
  )
}
