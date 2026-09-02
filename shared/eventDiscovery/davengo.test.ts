import { describe, expect, it } from 'vitest'
import search from './fixtures/davengo-search.json'
import { readFileSync } from 'node:fs'
import {
  davengoStarterUrl,
  parseGermanDate,
  readDavengoCompetitions,
  readDavengoSearch,
  withDavengoDistances,
} from './davengo'

const starter = readFileSync('shared/eventDiscovery/fixtures/davengo-starter.html', 'utf8')

describe('parseGermanDate', () => {
  it('reads the format davengo publishes', () => {
    expect(parseGermanDate('19.10.2025')).toBe('2025-10-19')
    expect(parseGermanDate('6.9.2026')).toBe('2026-09-06')
  })

  it('refuses anything else', () => {
    expect(parseGermanDate('2026-09-06')).toBeNull()
    expect(parseGermanDate('bald')).toBeNull()
  })
})

describe('readDavengoSearch', () => {
  const races = readDavengoSearch(search)

  it('takes the future races and leaves the past ones', () => {
    // The fixture holds one past entry, which the same endpoint serves.
    expect(races).toHaveLength(3)
    expect(races.map((race) => race.name)).not.toContain('19. Müggelsee-Halbmarathon 2025')
  })

  it('reads the date, the town and the country out of what it publishes', () => {
    const kiel = races.find((race) => race.name.includes('Kiel'))!
    expect(kiel.startDate).toBe('2026-09-13')
    expect(kiel.city).toBe('Kiel')
    expect(kiel.country).toBe('DE')
    expect(kiel.sourceUrl).toMatch(/davengo\.com/)
  })

  it('takes the distance from the name when the name says it', () => {
    const flensburg = races.find((race) => race.name.includes('Flensburg'))!
    expect(flensburg.distancesKm).toEqual([42.195])
  })

  it('says nothing about a deadline it was never told', () => {
    // The page says "Anmeldung" or "Geschlossen", never a date. Writing the
    // race date as the deadline would be inventing one.
    expect(races.every((race) => race.registrationClosesAt === undefined)).toBe(true)
  })

  it('has no distance for a name that does not say one', () => {
    const firmenlauf = races.find((race) => race.name.includes('Firmenlauf'))!
    expect(firmenlauf.distancesKm).toEqual([])
  })

  it('knows where the starter list is', () => {
    expect(davengoStarterUrl(search.eventEntries[1]!)).toContain('/event/starter/')
  })
})

describe('readDavengoCompetitions', () => {
  it('keeps each competition whole, and skips the DEFAULT one', () => {
    const competitions = readDavengoCompetitions(starter)

    expect(competitions.map((competition) => competition.id)).toEqual([
      '5km',
      '5km_Teamwertung',
      '10km',
      'Halbmarathon',
      '25km',
      '2km',
    ])
    // The id says 2km and only the title says who it is for.
    expect(competitions.at(-1)).toEqual({ id: '2km', titles: ['Kinderlauf'] })
  })
})

describe('withDavengoDistances', () => {
  const race = {
    sourceUrl: 'https://www.davengo.com/event/overview/s-25-berlin-2027',
    name: 'S 25 Berlin 2027',
    startDate: '2027-04-18',
    distancesKm: [],
    cancelled: false,
  }

  it('fills the distances in from the starter list, and drops the children s race', () => {
    const filled = withDavengoDistances(race, starter)

    expect(filled.distancesKm).toEqual([5, 10, 21.0975, 25])
    // "Kinderlauf" is the 2 km one.
    expect(filled.distancesKm).not.toContain(2)
  })

  it('leaves the race alone when the page says nothing', () => {
    expect(withDavengoDistances(race, '<html></html>').distancesKm).toEqual([])
  })
})
