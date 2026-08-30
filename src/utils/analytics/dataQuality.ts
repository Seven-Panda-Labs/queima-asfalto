import type { Event } from '../../types/Event'
import { parseFieldPlacing } from './percentile'
import { isAnalysableResult } from './results'

export type DataQuality = {
  completed: number
  /** Completed races the analysis can use. */
  analysable: number
  missingTime: number
  missingDistance: number
  missingClassification: number
  verified: number
  verifiedPercent: number
  /** Races left out, so the page can ask for the missing fields. */
  excluded: Event[]
}

/** Keeps the page from claiming 12 races count when only 8 have a time. */
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
