import { describe, expect, it } from 'vitest'
import { isHarvestCollapse, isHarvestStale, isHarvestable } from './guards'

const TODAY = new Date('2026-09-02T12:00:00Z')

describe('isHarvestCollapse', () => {
  it('refuses a harvest that lost a fifth of the catalog', () => {
    expect(isHarvestCollapse(100, 79)).toBe(true)
    expect(isHarvestCollapse(100, 80)).toBe(false)
  })

  it('lets a catalog be filled from nothing', () => {
    expect(isHarvestCollapse(0, 1)).toBe(false)
  })

  it('lets a catalog grow', () => {
    expect(isHarvestCollapse(100, 140)).toBe(false)
  })
})

describe('isHarvestStale', () => {
  it('is stale past the threshold, and never synced counts as stale', () => {
    expect(isHarvestStale(new Date('2026-07-01'), TODAY)).toBe(true)
    expect(isHarvestStale(new Date('2026-08-20'), TODAY)).toBe(false)
    expect(isHarvestStale(undefined, TODAY)).toBe(true)
  })
})

describe('isHarvestable', () => {
  const race = { startDate: '2026-10-11T09:00:00Z', cancelled: false, distancesKm: [10] }

  it('takes a race still ahead', () => {
    expect(isHarvestable(race, TODAY)).toBe(true)
  })

  it('leaves the past and the cancelled', () => {
    expect(isHarvestable({ ...race, startDate: '2026-05-10T09:00:00Z' }, TODAY)).toBe(false)
    expect(isHarvestable({ ...race, cancelled: true }, TODAY)).toBe(false)
  })

  it('keeps a race whose distance nobody publishes', () => {
    // The date, the town and the entry link are worth having on their own. The
    // runner is asked for the distance when they add it.
    expect(isHarvestable({ startDate: race.startDate, cancelled: false }, TODAY)).toBe(true)
  })

  it('leaves a date it cannot read', () => {
    expect(isHarvestable({ ...race, startDate: 'em breve' }, TODAY)).toBe(false)
  })
})
