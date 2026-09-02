import { describe, expect, it } from 'vitest'
import { dedupeRaces } from './dedup'
import type { DiscoveredRace } from './types'

function race(overrides: Partial<DiscoveredRace> = {}): DiscoveredRace {
  return {
    sourceUrl: 'https://one.invalid/berlin',
    name: 'BMW Berlin Marathon',
    startDate: '2027-09-26T09:15:00+02:00',
    city: 'Berlin',
    country: 'DE',
    distancesKm: [42.195],
    cancelled: false,
    ...overrides,
  }
}

describe('dedupeRaces', () => {
  it('merges the same race off two sources into one', () => {
    const merged = dedupeRaces([
      race(),
      race({
        sourceUrl: 'https://two.invalid/berlin-marathon',
        name: '53 BMW Berlin Marathon',
        distancesKm: [42.195, 10],
        registrationClosesAt: '2027-05-28T23:59:00+02:00',
        lowPrice: 89,
        currency: 'EUR',
      }),
    ])

    expect(merged).toHaveLength(1)
    expect(merged[0]!.distancesKm).toEqual([10, 42.195])
    // Patchy in different places: the deadline came from the second listing.
    expect(merged[0]!.registrationClosesAt).toBe('2027-05-28T23:59:00+02:00')
    expect(merged[0]!.lowPrice).toBe(89)
  })

  it('keeps a race that only one source says is off, off', () => {
    const merged = dedupeRaces([race(), race({ cancelled: true })])
    expect(merged[0]!.cancelled).toBe(true)
  })

  it('leaves two different races alone', () => {
    expect(dedupeRaces([race(), race({ name: 'Berlin Half', city: 'Berlin' })])).toHaveLength(2)
  })
})
