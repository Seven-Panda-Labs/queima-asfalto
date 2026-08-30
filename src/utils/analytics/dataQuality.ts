import type { Event } from '../../types/Event'
import { parseFieldPlacing } from './percentile'
import { isAnalysableResult } from './results'

export type DataQuality = {
  completed: number
  /** Provas concluídas que a análise consegue usar. */
  analysable: number
  missingTime: number
  missingDistance: number
  missingClassification: number
  verified: number
  verifiedPercent: number
  /** Provas que a análise deixou de fora, para a página poder pedir os dados. */
  excluded: Event[]
}

/**
 * A análise vale o que valem os dados. Este painel existe para a página não
 * fingir que 12 provas contam quando só 8 têm tempo — e para dizer quais
 * faltam preencher.
 */
export function computeDataQuality(events: Event[]): DataQuality {
  const completed = events.filter((event) => event.status === 'completed')
  const analysable = completed.filter(isAnalysableResult)
  const excluded = completed.filter((event) => !isAnalysableResult(event))

  const verified = completed.filter((event) => event.resultsVerified).length
  const missingClassification = analysable.filter(
    (event) => parseFieldPlacing(event.classification) === null,
  ).length

  return {
    completed: completed.length,
    analysable: analysable.length,
    missingTime: completed.filter((event) => !event.time?.trim()).length,
    missingDistance: completed.filter(
      (event) => !Number.isFinite(event.realDistance) || event.realDistance <= 0,
    ).length,
    missingClassification,
    verified,
    verifiedPercent:
      completed.length > 0 ? Math.round((verified / completed.length) * 100) : 0,
    excluded,
  }
}
