import type { Event } from '../../types/Event'
import { countsAsStarted } from '../../domain/outcomeReasons'
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
  /** Races started and not finished, which is an outcome and not a gap. */
  dnf: number
  /** Races left out, so the page can ask for the missing fields. */
  excluded: Event[]
}

/** Keeps the page from claiming 12 races count when only 8 have a time. */
export function computeDataQuality(events: Event[]): DataQuality {
  const completed = events.filter((event) => event.status === 'completed')
  const analysable = completed.filter(isAnalysableResult)
  // A DNF has no time to ask for, so it is counted, never chased.
  const dnf = completed.filter((event) => countsAsStarted(event.outcomeReason))
  const excluded = completed.filter(
    (event) => !isAnalysableResult(event) && !countsAsStarted(event.outcomeReason),
  )

  const verified = completed.filter((event) => event.resultsVerified).length
  const missingClassification = analysable.filter(
    (event) => parseFieldPlacing(event.classification) === null,
  ).length

  return {
    completed: completed.length,
    analysable: analysable.length,
    missingTime: completed.filter(
      (event) => !event.time?.trim() && !countsAsStarted(event.outcomeReason),
    ).length,
    missingDistance: completed.filter(
      (event) => !Number.isFinite(event.realDistance) || event.realDistance <= 0,
    ).length,
    missingClassification,
    dnf: dnf.length,
    verified,
    verifiedPercent:
      completed.length > 0 ? Math.round((verified / completed.length) * 100) : 0,
    excluded,
  }
}
