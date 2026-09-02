import type { Event } from '../../types/Event'
import { equivalentTimeSeconds, predictRaceTimes, FORM_WINDOW_DAYS } from './equivalence'
import { toAnalysableResults, type AnalysableResult } from './results'

const MS_PER_DAY = 24 * 60 * 60 * 1000

export type RaceProjection = {
  predictedSeconds: number
  paceSeconds: number
  /** The race the estimate came from, so the page can name it. */
  basedOn: AnalysableResult
  /** `false` when the basis is more than a year old. */
  fromRecentForm: boolean
  /** The basis is a race the runner declared as preparing this one. */
  fromBuildUp: boolean
}

/** The race identities declared as preparing this anchor. */
export function racesPreparing(
  anchorRaceId: string | undefined,
  items: readonly { raceId?: string; servesRaceId?: string }[],
): string[] {
  if (!anchorRaceId) return []
  return items
    .filter((item) => item.servesRaceId === anchorRaceId && item.raceId)
    .map((item) => item.raceId!)
}

/**
 * What the runner's form says about a race still ahead.
 *
 * The build-up race is the point of this: somebody who races a 10K four weeks
 * out is asking exactly one question, and the arithmetic to answer it already
 * exists. Nothing new is computed here, `equivalence.ts` does the work, so the
 * number cannot drift from the one the analysis page shows.
 *
 * With no declared build-up it falls back to what the predictor already does,
 * the strongest race in the last twelve months.
 */
export function projectRaceTime(
  target: { distanceKm: number; date: Date },
  events: readonly Event[],
  buildUpRaceIds: readonly string[] = [],
  today: Date = new Date(),
): RaceProjection | null {
  if (!Number.isFinite(target.distanceKm) || target.distanceKm <= 0) return null

  // Only what happened before the race in question: a result from after it says
  // nothing about how it was going to go.
  const results = toAnalysableResults([...events]).filter(
    (result) => result.date.getTime() < target.date.getTime(),
  )
  if (results.length === 0) return null

  const preparing = new Set(buildUpRaceIds)
  const buildUps = results.filter(
    (result) => result.event.raceId && preparing.has(result.event.raceId),
  )
  // The latest, not the strongest: a build-up is a measurement taken on purpose,
  // and the most recent one is the current answer.
  const buildUp = buildUps[buildUps.length - 1]

  const basedOn = buildUp ?? predictRaceTimes(results, target.distanceKm, today)?.basedOn
  if (!basedOn) return null

  const predictedSeconds = equivalentTimeSeconds(
    basedOn.timeSeconds,
    basedOn.distanceKm,
    target.distanceKm,
  )
  if (predictedSeconds === null) return null

  return {
    predictedSeconds,
    paceSeconds: predictedSeconds / target.distanceKm,
    basedOn,
    fromRecentForm:
      today.getTime() - basedOn.date.getTime() <= FORM_WINDOW_DAYS * MS_PER_DAY,
    fromBuildUp: buildUp !== undefined,
  }
}
