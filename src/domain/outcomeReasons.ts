/**
 * Why a race produced no result.
 *
 * `missed` fires by itself two days after any planned or confirmed race with no
 * time, so one state covers "I did not go", "I got injured", "I dropped out at
 * km 30" and "I ran it and forgot to type the time". The reason is what makes
 * the difference readable, and what anything can react to.
 *
 * The list is the minimum something reacts to, not a complete vocabulary.
 */
export const OUTCOME_REASONS = [
  'dnf',
  'injury',
  'did_not_go',
  'cancelled_by_organiser',
  'travel',
  'other',
] as const

export type OutcomeReason = (typeof OUTCOME_REASONS)[number]

export function isOutcomeReason(value: string): value is OutcomeReason {
  return (OUTCOME_REASONS as readonly string[]).includes(value)
}

/**
 * A DNF is a race that happened.
 *
 * It has no comparable time, so it stays out of pace, records and predictions,
 * but a race started and not finished should not read as a race never run.
 */
export function countsAsStarted(reason: OutcomeReason | undefined): boolean {
  return reason === 'dnf'
}

/**
 * Failures the runner did not choose, and where next year is the obvious answer.
 *
 * `did_not_go` and `travel` are decisions, and offering the next edition on top
 * of a decision is the app arguing with the runner. `cancelled_by_organiser`
 * overlaps the `cancelled` status on purpose: the status is set before race day,
 * the reason after it, and a runner who never touched the status still gets the
 * offer.
 */
export function offersNextEdition(reason: OutcomeReason | undefined): boolean {
  return reason === 'injury' || reason === 'dnf' || reason === 'cancelled_by_organiser'
}

type RaceOutcome = {
  status: string
  time?: string
  pace?: string
  outcomeReason?: OutcomeReason
}

/**
 * A race that is over, produced no result, and has not said why.
 *
 * `cancelled` is left out: the app already knows what happened to a race that
 * was called off before it was run.
 */
export function needsOutcomeReason(event: RaceOutcome): boolean {
  if (event.outcomeReason) return false
  if (event.time?.trim() || event.pace?.trim()) return false
  return event.status === 'missed' || event.status === 'completed'
}
