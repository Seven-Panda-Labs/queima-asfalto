import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { readRacesFromHtml } from './schemaOrg'

/**
 * running.life needs no reader of its own: it publishes schema.org. What it
 * needed was for the reader to walk an ItemList, to turn "Deutschland" into a
 * country code, and to look at the description for a distance nobody sells on
 * the page.
 */
const races = readRacesFromHtml(
  readFileSync(resolve(import.meta.dirname, 'fixtures/running-life-calendar.html'), 'utf8'),
)

describe('a calendar page of schema.org events', () => {
  it('finds the events nested in the ItemList', () => {
    expect(races.length).toBe(6)
    expect(races.map((race) => race.name)).toContain('Firmenlauf Hamm')
  })

  it('reads the place, and the country as a code', () => {
    const hamm = races.find((race) => race.name === 'Firmenlauf Hamm')
    expect(hamm).toMatchObject({
      startDate: '2026-09-03',
      city: 'Hamm',
      region: 'Nordrhein-Westfalen',
      country: 'DE',
      sourceUrl: 'https://running.life/de/termine/firmenlauf-hamm',
    })
  })

  it('takes the distance from the description, which is the only place it is', () => {
    // "Teamlauf in Hamm über 5,5 km durch Innenstadt".
    expect(races.find((race) => race.name === 'Firmenlauf Hamm')?.distancesKm).toEqual([5.5])
  })

  it('reads all three of a shared unit list', () => {
    // "mit drei Strecken (3,3 / 6,6 / 9,9 km)".
    const magenta = races.find((race) => race.name.includes('Magenta'))
    expect(magenta?.distancesKm).toEqual([3.3, 6.6, 9.9])
  })

  it('leaves a race whose description names no distance without one', () => {
    // The harvest drops it later: an event with no distance is not a candidate.
    expect(races.some((race) => race.distancesKm.length === 0)).toBe(true)
  })
})

describe('a distance read out of prose', () => {
  it('leaves the lap of a track and the children\'s dash alone', () => {
    const page = `<script type="application/ld+json">${JSON.stringify({
      '@type': 'SportsEvent',
      name: 'Pütt-Tage-Lauf',
      url: 'https://running.life/de/termine/puett-tage-lauf',
      startDate: '2026-09-04',
      description: 'Stadtlauf in Beckum mit Rennangeboten von 400 m bis 10 km.',
      location: { '@type': 'Place', address: { addressLocality: 'Beckum', addressCountry: 'Deutschland' } },
    })}</script>`
    // The 400 m is the kids' race in a programme, not a distance to file.
    expect(readRacesFromHtml(page)[0]?.distancesKm).toEqual([10])
  })

  it('still trusts a distance an offer names, however short', () => {
    const page = `<script type="application/ld+json">${JSON.stringify({
      '@type': 'SportsEvent',
      name: 'Bahnserie',
      url: 'https://example.test/x',
      startDate: '2026-09-04',
      offers: [{ '@type': 'Offer', name: '1500 m' }],
      location: { '@type': 'Place', address: { addressLocality: 'Berlin', addressCountry: 'DE' } },
    })}</script>`
    expect(readRacesFromHtml(page)[0]?.distancesKm).toEqual([1.5])
  })
})
