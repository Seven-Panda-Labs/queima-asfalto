import { describe, expect, it } from 'vitest'
import type { RaceCatalogEntry } from '../../shared/raceCatalog'
import { centreFromEntries, withinRadius } from './raceRadius'

/** Berlin, Potsdam (26 km out) and Hamburg (255 km out). */
const BERLIN = { lat: 52.52, lng: 13.405 }

function entry(
  id: string,
  city: string,
  point?: { latitude: number; longitude: number },
): RaceCatalogEntry {
  return {
    id,
    name: id,
    country: 'DE',
    city,
    disciplines: ['km_10'],
    entryMethod: 'unknown',
    review: 'unreviewed',
    source: 'x',
    ...point,
  }
}

const berlin = entry('berlin', 'Berlin', { latitude: 52.52, longitude: 13.405 })
const potsdam = entry('potsdam', 'Potsdam', { latitude: 52.4, longitude: 13.066 })
const hamburg = entry('hamburg', 'Hamburg', { latitude: 53.55, longitude: 9.993 })
const nowhere = entry('nowhere', 'Kleinkleckersdorf')

describe('withinRadius', () => {
  it('keeps what is inside the circle, nearest first', () => {
    const found = withinRadius([hamburg, potsdam, berlin], BERLIN, 40)
    expect(found.entries.map((race) => race.id)).toEqual(['berlin', 'potsdam'])
  })

  it('lets a wider circle reach further', () => {
    expect(withinRadius([hamburg, berlin], BERLIN, 250).entries.map((r) => r.id)).toEqual([
      'berlin',
    ])
    expect(withinRadius([hamburg, berlin], BERLIN, 300).entries.map((r) => r.id)).toEqual([
      'berlin',
      'hamburg',
    ])
  })

  it('counts what it could not place instead of calling it far away', () => {
    // A race with no coordinates may be next door. Hiding it silently would be
    // the filter lying about what it knows.
    const found = withinRadius([berlin, nowhere], BERLIN, 40)
    expect(found.entries.map((race) => race.id)).toEqual(['berlin'])
    expect(found.unplaced).toBe(1)
  })
})

describe('centreFromEntries', () => {
  it('takes the centre from a race in that town', () => {
    expect(centreFromEntries([hamburg, berlin], 'berlin')).toEqual({ lat: 52.52, lng: 13.405 })
  })

  it('ignores accents and case, like the rest of the search', () => {
    const munich = entry('m', 'München', { latitude: 48.14, longitude: 11.58 })
    expect(centreFromEntries([munich], 'munchen')).toEqual({ lat: 48.14, lng: 11.58 })
  })

  it('has no centre for a place nothing matches, or one with no point', () => {
    expect(centreFromEntries([berlin], 'Lisboa')).toBeNull()
    expect(centreFromEntries([nowhere], 'Kleinkleckersdorf')).toBeNull()
    expect(centreFromEntries([berlin], '  ')).toBeNull()
  })
})
