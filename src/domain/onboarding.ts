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
  /** An attempt at getting into a race: the thing that turns a wish into a plan. */
  hasEntry: boolean
  /** One finished race with a time, which is all the analysis needs to start. */
  hasResult: boolean
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
  context: { anchorItemId?: string } = {},
): string {
  switch (id) {
    case 'disciplines':
      return '/definicoes?tab=disciplinas'
    case 'anchor':
      return '/bucket-list/novo'
    case 'entry':
      // Straight to the anchor's entry when there is one: the step is about
      // that race, not about entries in general.
      return context.anchorItemId
        ? `/bucket-list/${context.anchorItemId}/inscricao`
        : '/bucket-list'
    case 'result':
      return '/eventos/novo'
  }
}
