/**
 * The first session, in the order the lifecycle actually runs.
 *
 * The anchor comes first because that is where the interviews say a season
 * starts, and because it is what unlocks the rest of the app: the countdown,
 * the deadline reminders, the tune-up window, and a search with a window in it.
 * A past race comes last, and it is the step that makes the analysis worth
 * opening.
 *
 * Each step teaches. A checklist that only says "add a race" is decoration; the
 * copy for each step says what the app will do with it, which is the part a
 * first-run screen would have taught and then been dismissed.
 */
export const ONBOARDING_STEPS = ['disciplines', 'anchor', 'entry', 'result'] as const

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number]

export type OnboardingFacts = {
  /** The runner has been through the discipline switches, whatever they chose. */
  disciplinesChosen: boolean
  hasAnchor: boolean
  /**
   * The place in the anchor is sorted, however it was recorded.
   *
   * An entry is the planning story of getting in, and it is what the deadline
   * reminders read. But a runner who is already registered says so by putting
   * the race on the calendar as confirmed, and asking them to plan an entry for
   * a race they are in would be the app not looking.
   */
  hasEntry: boolean
  /** One finished race with a time, which is all the analysis needs to start. */
  hasResult: boolean
}

type OnboardingSource = {
  disciplinesChosen: boolean
  /** The races that are anchors, by identity. */
  anchorRaceIds: ReadonlySet<string>
  entries: readonly { id: string }[]
  events: readonly { raceId?: string; status: string; time?: string }[]
}

/**
 * What the account already says, read once.
 *
 * In the domain rather than in the page because getting these wrong is what
 * makes a checklist ask for something the runner has already done: the anchor
 * step asked the wish, which a season planned as events never had, and the
 * entry step asked for a document that a registered runner has no reason to
 * create.
 */
export function onboardingFactsFrom(source: OnboardingSource): OnboardingFacts {
  const bookedAnchor = source.events.some(
    (event) =>
      event.raceId &&
      source.anchorRaceIds.has(event.raceId) &&
      (event.status === 'confirmed' || event.status === 'completed'),
  )

  return {
    disciplinesChosen: source.disciplinesChosen,
    hasAnchor: source.anchorRaceIds.size > 0,
    hasEntry: source.entries.length > 0 || bookedAnchor,
    hasResult: source.events.some(
      (event) => event.status === 'completed' && Boolean(event.time?.trim()),
    ),
  }
}

export type OnboardingStep = {
  id: OnboardingStepId
  done: boolean
}

function isDone(id: OnboardingStepId, facts: OnboardingFacts): boolean {
  switch (id) {
    case 'disciplines':
      return facts.disciplinesChosen
    case 'anchor':
      return facts.hasAnchor
    case 'entry':
      return facts.hasEntry
    case 'result':
      return facts.hasResult
  }
}

export function onboardingSteps(facts: OnboardingFacts): OnboardingStep[] {
  return ONBOARDING_STEPS.map((id) => ({ id, done: isDone(id, facts) }))
}

export type OnboardingProgress = {
  done: number
  total: number
  complete: boolean
  /** The first step still to do, which is the one to point at. */
  next: OnboardingStepId | null
}

export function onboardingProgress(facts: OnboardingFacts): OnboardingProgress {
  const steps = onboardingSteps(facts)
  const done = steps.filter((step) => step.done).length
  return {
    done,
    total: steps.length,
    complete: done === steps.length,
    next: steps.find((step) => !step.done)?.id ?? null,
  }
}

/**
 * Whether the card has anything left to say.
 *
 * It goes when every step is done, and it goes when the runner says so. Nothing
 * about a checklist is worth arguing with somebody who already knows the app.
 */
export function shouldShowOnboarding(
  facts: OnboardingFacts,
  dismissedAt: Date | null,
): boolean {
  if (dismissedAt) return false
  return !onboardingProgress(facts).complete
}

/** Where a step is done, given what the runner already has. */
export function onboardingStepPath(
  id: OnboardingStepId,
  context: { anchorItemId?: string; anchorEventId?: string } = {},
): string {
  switch (id) {
    case 'disciplines':
      return '/definicoes?tab=disciplinas'
    case 'anchor':
      return '/bucket-list/novo'
    case 'entry':
      // Straight at the anchor: the step is about that race, not about entries
      // in general. An anchor that exists only as an event has no entry form to
      // send anybody to, and its own page is where its status is set.
      if (context.anchorItemId) return `/bucket-list/${context.anchorItemId}/inscricao`
      if (context.anchorEventId) return `/eventos/${context.anchorEventId}`
      return '/bucket-list'
    case 'result':
      return '/eventos/novo'
  }
}
