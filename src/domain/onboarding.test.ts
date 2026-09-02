import { describe, expect, it } from 'vitest'
import {
  onboardingProgress,
  onboardingStepPath,
  onboardingSteps,
  shouldShowOnboarding,
  type OnboardingFacts,
} from './onboarding'

const NOTHING: OnboardingFacts = {
  disciplinesChosen: false,
  hasAnchor: false,
  hasEntry: false,
  hasResult: false,
}

describe('onboardingSteps', () => {
  it('runs the lifecycle order, anchor before anything about results', () => {
    expect(onboardingSteps(NOTHING).map((step) => step.id)).toEqual([
      'disciplines',
      'anchor',
      'entry',
      'result',
    ])
  })

  it('ticks a step off its own fact', () => {
    const steps = onboardingSteps({ ...NOTHING, hasAnchor: true })
    expect(steps.find((step) => step.id === 'anchor')?.done).toBe(true)
    expect(steps.find((step) => step.id === 'entry')?.done).toBe(false)
  })
})

describe('onboardingProgress', () => {
  it('counts what is done and points at the next one', () => {
    const progress = onboardingProgress({ ...NOTHING, disciplinesChosen: true })
    expect(progress).toEqual({ done: 1, total: 4, complete: false, next: 'anchor' })
  })

  it('is complete with nothing left to point at', () => {
    const progress = onboardingProgress({
      disciplinesChosen: true,
      hasAnchor: true,
      hasEntry: true,
      hasResult: true,
    })
    expect(progress.complete).toBe(true)
    expect(progress.next).toBeNull()
  })

  it('does not care in what order they were done', () => {
    expect(onboardingProgress({ ...NOTHING, hasResult: true }).next).toBe('disciplines')
  })
})

describe('shouldShowOnboarding', () => {
  it('shows while there is something left', () => {
    expect(shouldShowOnboarding(NOTHING, null)).toBe(true)
  })

  it('goes when everything is done', () => {
    expect(
      shouldShowOnboarding(
        { disciplinesChosen: true, hasAnchor: true, hasEntry: true, hasResult: true },
        null,
      ),
    ).toBe(false)
  })

  it('goes when the runner said so, however little is done', () => {
    expect(shouldShowOnboarding(NOTHING, new Date('2026-09-02'))).toBe(false)
  })
})

describe('onboardingStepPath', () => {
  it('sends the entry step at the anchor it is about', () => {
    expect(onboardingStepPath('entry', { anchorItemId: 'item-1' })).toBe(
      '/bucket-list/item-1/inscricao',
    )
  })

  it('falls back to the list when there is no anchor yet', () => {
    expect(onboardingStepPath('entry')).toBe('/bucket-list')
  })

  it('knows where the other steps live', () => {
    expect(onboardingStepPath('disciplines')).toBe('/definicoes?tab=disciplinas')
    expect(onboardingStepPath('anchor')).toBe('/bucket-list/novo')
    expect(onboardingStepPath('result')).toBe('/eventos/novo')
  })
})
