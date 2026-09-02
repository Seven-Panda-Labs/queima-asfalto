import { describe, expect, it } from 'vitest'
import type { RaceCatalogEntry } from '../raceCatalog/types'
import { mergeIntoCatalog, toCatalogEntry } from './toCatalogEntry'
import type { DiscoveredRace } from './types'

const PROVENANCE = { source: 'acorrer.pt', harvestedAt: '2026-09-02' }

function race(overrides: Partial<DiscoveredRace> = {}): DiscoveredRace {
  return {
    sourceUrl: 'https://acorrer.pt/eventos/10-run-castle',
    name: 'XI Run Castle',
    startDate: '2026-09-06T09:00:00+01:00',
    city: 'Montemor-o-Novo',
    region: 'Évora',
    country: 'PT',
    distancesKm: [8, 10, 17],
    registrationClosesAt: '2026-08-30T23:59:00+01:00',
    lowPrice: 10,
    highPrice: 14,
    currency: 'EUR',
    cancelled: false,
    ...overrides,
  }
}

describe('toCatalogEntry', () => {
  it('arrives unreviewed, harvested, and says where from', () => {
    const entry = toCatalogEntry(race(), PROVENANCE)

    expect(entry.review).toBe('unreviewed')
    expect(entry.producer).toBe('harvest')
    expect(entry.source).toBe('acorrer.pt')
    expect(entry.updatedBy).toBe('harvest')
  })

  it('carries the edition it read, with its own provenance', () => {
    const entry = toCatalogEntry(race(), PROVENANCE)

    expect(entry.editions).toEqual([
      {
        year: 2026,
        raceDate: '2026-09-06',
        registrationClosesAt: '2026-08-30T23:59:00+01:00',
        typicalFee: 10,
        feeCurrency: 'EUR',
        source: 'acorrer.pt',
        confirmedAt: '2026-09-02',
      },
    ])
    expect(entry.typicalRaceMonth).toBe(9)
  })

  it('holds no undefined value, which Firestore refuses outright', () => {
    const bare = toCatalogEntry(
      race({ city: undefined, registrationClosesAt: undefined, lowPrice: undefined, currency: undefined }),
      PROVENANCE,
    )

    const undefinedKeys = (value: object) =>
      Object.entries(value).filter(([, item]) => item === undefined).map(([key]) => key)

    expect(undefinedKeys(bare)).toEqual([])
    expect(undefinedKeys(bare.editions![0]!)).toEqual([])
  })

  it('never guesses how you get in', () => {
    expect(toCatalogEntry(race(), PROVENANCE).entryMethod).toBe('unknown')
  })

  it('files the distances under presets and keeps the id stable', () => {
    const entry = toCatalogEntry(race(), PROVENANCE)
    expect(entry.disciplines).toEqual(['km_10', 'mi_10'])
    expect(entry.id).toBe('pt-montemor-o-novo-run-castle')
  })
})

describe('mergeIntoCatalog', () => {
  const harvested = toCatalogEntry(race({ startDate: '2027-09-05T09:00:00+01:00' }), PROVENANCE)

  function stored(overrides: Partial<RaceCatalogEntry> = {}): RaceCatalogEntry {
    return {
      id: 'pt-montemor-o-novo-run-castle',
      name: 'Run Castle',
      country: 'PT',
      city: 'Montemor-o-Novo',
      disciplines: ['km_10'],
      entryMethod: 'first_come',
      review: 'reviewed',
      source: 'organiser',
      producer: 'curated',
      editions: [
        { year: 2026, raceDate: '2026-09-06', source: 'organiser', confirmedAt: '2026-01-10' },
      ],
      ...overrides,
    }
  }

  it('writes a race nobody had', () => {
    expect(mergeIntoCatalog(undefined, harvested)).toBe(harvested)
  })

  it('adds an edition to a curated entry and touches nothing else', () => {
    const merged = mergeIntoCatalog(stored(), harvested)!

    expect(merged.name).toBe('Run Castle')
    expect(merged.entryMethod).toBe('first_come')
    expect(merged.review).toBe('reviewed')
    expect(merged.editions?.map((edition) => edition.year)).toEqual([2026, 2027])
  })

  it('leaves a curated entry alone when it already has the edition', () => {
    const same = toCatalogEntry(race(), PROVENANCE)
    expect(mergeIntoCatalog(stored(), same)).toBeNull()
  })

  it('refreshes an entry the harvest itself wrote', () => {
    const previous = toCatalogEntry(race({ lowPrice: 8 }), {
      source: 'acorrer.pt',
      harvestedAt: '2026-07-01',
    })
    const merged = mergeIntoCatalog(previous, toCatalogEntry(race(), PROVENANCE))!

    expect(merged.producer).toBe('harvest')
    expect(merged.editions).toHaveLength(1)
    expect(merged.editions?.[0]?.typicalFee).toBe(10)
    expect(merged.editions?.[0]?.confirmedAt).toBe('2026-09-02')
  })

  it('keeps a retired entry retired: somebody took it out on purpose', () => {
    const previous = { ...toCatalogEntry(race(), PROVENANCE), retired: true }
    expect(mergeIntoCatalog(previous, toCatalogEntry(race(), PROVENANCE))!.retired).toBe(true)
  })

  it('leaves no `retired: undefined` behind on an entry that was never retired', () => {
    const previous = toCatalogEntry(race(), PROVENANCE)
    const merged = mergeIntoCatalog(previous, toCatalogEntry(race(), PROVENANCE))!

    expect('retired' in merged).toBe(false)
  })
})
