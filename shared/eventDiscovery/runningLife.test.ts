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

  /**
   * Every description here is a real one from a September calendar page, and
   * every one of them was reaching the catalog with no distance at all.
   */
  it('reads the distances the description does publish', () => {
    const page = (name: string, description: string) =>
      `<script type="application/ld+json">${JSON.stringify({
        '@type': 'SportsEvent',
        name,
        url: 'https://running.life/de/termine/x',
        startDate: '2026-09-11',
        description,
        location: { '@type': 'Place', address: { addressLocality: 'X', addressCountry: 'DE' } },
      })}</script>`
    const distances = (name: string, description: string) =>
      readRacesFromHtml(page(name, description))[0]?.distancesKm

    // The unit written as a word.
    expect(
      distances(
        'Emder Sparkassen Delftlauf',
        'Angeboten werden 6 Kilometer Walking, 6 Kilometer Laufen und 10 Kilometer.',
      ),
    ).toEqual([6, 10])
    // A charity's name was deleting the two measured races beside it.
    expect(
      distances(
        'Citylauf Xanten',
        'Citylauf mit Kinder- und Jugendläufen sowie amtlich vermessenen 5 km und 10 km.',
      ),
    ).toEqual([5, 10])
    // A single lap is how a company run publishes its distance.
    expect(
      distances('fem.RUN', 'Ein frauenorientierter Lauf am Maschsee mit einer 6 km Runde, Yoga und Zeitmessung.'),
    ).toEqual([6])
    // And the run of a triathlon is the only leg of it that is a run.
    expect(
      distances(
        'Ironman 5150 Erkner',
        'Triathlon über die olympische Distanz mit 1,5 km Schwimmen, 40 km Radfahren und 10 km Laufen.',
      ),
    ).toEqual([10])
  })

  it('files nothing for a race the description does not measure', () => {
    const page = (name: string, description: string) =>
      `<script type="application/ld+json">${JSON.stringify({
        '@type': 'SportsEvent',
        name,
        url: 'https://running.life/de/termine/y',
        startDate: '2026-09-11',
        description,
        location: { '@type': 'Place', address: { addressLocality: 'X', addressCountry: 'DE' } },
      })}</script>`
    const distances = (name: string, description: string) =>
      readRacesFromHtml(page(name, description))[0]?.distancesKm

    // Six hours of running on a 7,5 km loop is not a 7,5 km race.
    expect(
      distances('6-Stunden-Lauf Werl', '6 Stunden Lauf in Werl: 7,5 km Runde durch den Stadtwald.'),
    ).toEqual([])
    // Nor is a relay leg a race anybody enters.
    expect(
      distances('FI Fun Run', 'Ein Staffellauf über 4 mal 3 Kilometer rund um den FI-Standort.'),
    ).toEqual([])
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

describe('the coordinates a source publishes', () => {
  it('reads the geo node, which is what a radius search needs', () => {
    const hamm = races.find((race) => race.name === 'Firmenlauf Hamm')
    expect(hamm).toMatchObject({ latitude: 51.6738583, longitude: 7.8159816 })
  })

  it('refuses a pair that cannot be a place', () => {
    const page = (geo: unknown) =>
      `<script type="application/ld+json">${JSON.stringify({
        '@type': 'SportsEvent',
        name: 'Lauf',
        url: 'https://example.test/x',
        startDate: '2026-09-04',
        offers: [{ '@type': 'Offer', name: '10 km' }],
        location: { '@type': 'Place', address: { addressCountry: 'DE', addressLocality: 'X' }, geo },
      })}</script>`

    // An empty field serialises to zero, which is the Atlantic.
    expect(readRacesFromHtml(page({ latitude: 0, longitude: 0 }))[0]?.latitude).toBeUndefined()
    expect(readRacesFromHtml(page({ latitude: 91, longitude: 7 }))[0]?.latitude).toBeUndefined()
    expect(readRacesFromHtml(page({ latitude: 'x', longitude: 7 }))[0]?.latitude).toBeUndefined()
    // Strings that are numbers are numbers.
    expect(readRacesFromHtml(page({ latitude: '51.5', longitude: '7.1' }))[0]).toMatchObject({
      latitude: 51.5,
      longitude: 7.1,
    })
  })
})
