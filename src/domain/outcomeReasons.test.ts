import { describe, expect, it } from 'vitest'
import {
  countsAsStarted,
  isOutcomeReason,
  needsOutcomeReason,
  offersNextEdition,
} from './outcomeReasons'

describe('isOutcomeReason', () => {
  it('accepts the shipped list and nothing else', () => {
    expect(isOutcomeReason('dnf')).toBe(true)
    expect(isOutcomeReason('injury')).toBe(true)
    expect(isOutcomeReason('bad_weather')).toBe(false)
    expect(isOutcomeReason('')).toBe(false)
  })
})

describe('countsAsStarted', () => {
  it('counts a DNF and nothing else', () => {
    expect(countsAsStarted('dnf')).toBe(true)
    expect(countsAsStarted('injury')).toBe(false)
    expect(countsAsStarted(undefined)).toBe(false)
  })
})

describe('offersNextEdition', () => {
  it('offers next year for what the runner did not choose', () => {
    expect(offersNextEdition('injury')).toBe(true)
    expect(offersNextEdition('dnf')).toBe(true)
    expect(offersNextEdition('cancelled_by_organiser')).toBe(true)
  })

  it('does not argue with a decision', () => {
    expect(offersNextEdition('did_not_go')).toBe(false)
    expect(offersNextEdition('travel')).toBe(false)
    expect(offersNextEdition('other')).toBe(false)
    expect(offersNextEdition(undefined)).toBe(false)
  })
})

describe('needsOutcomeReason', () => {
  it('asks a missed race what happened', () => {
    expect(needsOutcomeReason({ status: 'missed' })).toBe(true)
  })

  it('asks a completed race with no time', () => {
    expect(needsOutcomeReason({ status: 'completed' })).toBe(true)
  })

  it('stops asking once the reason is there', () => {
    expect(needsOutcomeReason({ status: 'missed', outcomeReason: 'injury' })).toBe(false)
  })

  it('does not ask a race that has a result', () => {
    expect(needsOutcomeReason({ status: 'completed', time: '00:52:10' })).toBe(false)
    // A pace with no time is what an imported result can look like.
    expect(needsOutcomeReason({ status: 'completed', pace: '05:12' })).toBe(false)
  })

  it('leaves the future and the called-off alone', () => {
    expect(needsOutcomeReason({ status: 'planned' })).toBe(false)
    expect(needsOutcomeReason({ status: 'confirmed' })).toBe(false)
    expect(needsOutcomeReason({ status: 'cancelled' })).toBe(false)
  })
})
