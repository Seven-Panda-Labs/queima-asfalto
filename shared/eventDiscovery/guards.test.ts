import { describe, expect, it } from 'vitest'
import { storedForSources, isHarvestCollapse, isHarvestStale, isHarvestable } from './guards'

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

describe('storedForSources', () => {
  const catalog = [
    { producer: 'harvest', source: 'kilometerliebe.de' },
    { producer: 'harvest', source: 'kilometerliebe.de' },
    { producer: 'harvest', source: 'running.life' },
    { producer: 'curated', source: 'organiser, confirmed 2026-09-01' },
  ]

  it('counts what this run\'s source wrote, and nothing else', () => {
    expect(storedForSources(catalog, ['kilometerliebe.de'])).toBe(2)
    expect(storedForSources(catalog, ['running.life'])).toBe(1)
  })

  it('never counts an entry a person wrote', () => {
    expect(storedForSources(catalog, ['organiser'])).toBe(0)
  })

  it('reads an entry from back when a run joined its sources', () => {
    const older = [{ producer: 'harvest', source: 'acorrer.pt,davengo.com' }]
    expect(storedForSources(older, ['davengo.com'])).toBe(1)
  })

  it('lets a first run through, because nothing is stored yet', () => {
    expect(isHarvestCollapse(storedForSources(catalog, ['marathon.de']), 400)).toBe(false)
  })
})

describe('isHarvestCollapse and a source read in part', () => {
  it('does not call a slice a collapse', () => {
    // marathon.de reads 150 of its 406 pages each run: fewer races than the
    // catalog holds for it is the design, not an outage.
    expect(isHarvestCollapse(46, 30, { partial: true })).toBe(false)
  })

  it('does not call a run the site cut short a collapse', () => {
    // running.life answers 429 partway through and the run keeps what it read.
    expect(isHarvestCollapse(226, 180, { partial: true })).toBe(false)
  })

  it('still refuses a whole read that came back gutted', () => {
    expect(isHarvestCollapse(226, 180)).toBe(true)
    expect(isHarvestCollapse(226, 180, { partial: false })).toBe(true)
  })

  it('keeps taking a floor of its own', () => {
    expect(isHarvestCollapse(100, 60, { floor: 0.5 })).toBe(false)
  })
})
