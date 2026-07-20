import { describe, expect, it } from 'vitest'
import {
  OFFICIAL_RESULTS_LOOKUP_COOLDOWN_MS,
  officialResultsLookupCooldownSeconds,
  officialResultsLookupRemainingMs,
} from './lookupCooldown'

describe('officialResultsLookupRemainingMs', () => {
  it('returns remaining cooldown time', () => {
    expect(officialResultsLookupRemainingMs(1_000, 3_000)).toBe(8_000)
    expect(officialResultsLookupRemainingMs(1_000, 11_500)).toBe(0)
  })
})

describe('officialResultsLookupCooldownSeconds', () => {
  it('rounds up to whole seconds', () => {
    expect(officialResultsLookupCooldownSeconds(4_200)).toBe(5)
    expect(officialResultsLookupCooldownSeconds(1_000)).toBe(1)
  })
})

describe('OFFICIAL_RESULTS_LOOKUP_COOLDOWN_MS', () => {
  it('is 10 seconds', () => {
    expect(OFFICIAL_RESULTS_LOOKUP_COOLDOWN_MS).toBe(10_000)
  })
})
