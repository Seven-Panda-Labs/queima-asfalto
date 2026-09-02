import { describe, expect, it } from 'vitest'
import {
  onboardingFactsFrom,
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

describe('onboardingFactsFrom', () => {
  const empty = {
    disciplinesChosen: false,
    anchorRaceIds: new Set<string>(),
    entries: [],
    events: [],
  }

  it('reads the anchor off the races, not off any wish', () => {
    expect(onboardingFactsFrom({ ...empty, anchorRaceIds: new Set(['race-1']) }).hasAnchor).toBe(
      true,
    )
    expect(onboardingFactsFrom(empty).hasAnchor).toBe(false)
  })

  it('takes an anchor already on the calendar as booked', () => {
    // The production case: a season planned as confirmed events, with no entry
    // documents at all. Asking that runner to plan an entry is not looking.
    const facts = onboardingFactsFrom({
      ...empty,
      anchorRaceIds: new Set(['race-lisboa']),
      events: [{ raceId: 'race-lisboa', status: 'confirmed' }],
    })
    expect(facts.hasEntry).toBe(true)
  })

  it('still takes an entry as booked, whatever race it is for', () => {
    expect(onboardingFactsFrom({ ...empty, entries: [{ id: 'entry-1' }] }).hasEntry).toBe(true)
  })

  it('does not take a merely planned anchor as booked', () => {
    const facts = onboardingFactsFrom({
      ...empty,
      anchorRaceIds: new Set(['race-lisboa']),
      events: [{ raceId: 'race-lisboa', status: 'planned' }],
    })
    expect(facts.hasEntry).toBe(false)
  })

  it('does not take somebody else s race as the anchor being booked', () => {
    const facts = onboardingFactsFrom({
      ...empty,
      anchorRaceIds: new Set(['race-lisboa']),
      events: [{ raceId: 'race-sintra', status: 'confirmed' }],
    })
    expect(facts.hasEntry).toBe(false)
  })

  it('needs a time before it calls a race a result', () => {
    expect(
      onboardingFactsFrom({ ...empty, events: [{ status: 'completed', time: '00:47:12' }] })
        .hasResult,
    ).toBe(true)
    // A DNF is completed and has no time: nothing for the analysis to read yet.
    expect(
      onboardingFactsFrom({ ...empty, events: [{ status: 'completed' }] }).hasResult,
    ).toBe(false)
  })
})

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

  it('sends it at the anchor event when the anchor was never a wish', () => {
    expect(onboardingStepPath('entry', { anchorEventId: 'event-1' })).toBe('/eventos/event-1')
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
