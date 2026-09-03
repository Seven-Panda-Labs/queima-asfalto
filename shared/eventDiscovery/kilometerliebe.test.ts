import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { readKilometerliebeCalendar } from './kilometerliebe'

const BASE = 'https://www.kilometerliebe.de/events/'

const races = readKilometerliebeCalendar(
  readFileSync(resolve(import.meta.dirname, 'fixtures/kilometerliebe-events.html'), 'utf8'),
  { baseUrl: BASE },
)

describe('readKilometerliebeCalendar', () => {
  it('reads the distances the race offers, not the site\'s filter buckets', () => {
    // The card says data-event-distances="5k,10k" and shows 4, 5 and 10 km.
    const fohlenhof = races.find((race) => race.name.includes('Fohlenhoflauf'))
    expect(fohlenhof).toMatchObject({
      startDate: '2026-09-03',
      city: 'Homburg',
      region: 'Saarland',
      country: 'DE',
      distancesKm: [4, 5, 10],
      cancelled: false,
    })
  })

  it('links each race to its page on the calendar', () => {
    const fohlenhof = races.find((race) => race.name.includes('Fohlenhoflauf'))
    expect(fohlenhof?.sourceUrl).toBe('https://www.kilometerliebe.de/events/34-fohlenhoflauf')
  })

  it('reads a decimal comma in a pill', () => {
    expect(races.find((race) => race.name.includes('Hamm'))?.distancesKm).toEqual([5.5])
  })

  it('takes the trails and leaves the triathlons out', () => {
    expect(races.some((race) => race.name.includes('Brockenlauf'))).toBe(true)
    expect(races.some((race) => /triathlon/i.test(race.name))).toBe(false)
  })

  it('drops a run measured in hours, which has no distance at all', () => {
    // "24 h" is a pill, not a distance: you run for a day, as far as you get.
    expect(races.some((race) => race.name.includes('24-Stunden'))).toBe(false)
  })

  it('has nothing to say about a page with no cards', () => {
    expect(readKilometerliebeCalendar('<main></main>', { baseUrl: BASE })).toEqual([])
  })
})
