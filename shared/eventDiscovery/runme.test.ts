import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { readRunmeCalendar } from './runme'

const BASE = 'https://www.runme.de/laufkalender'

const races = readRunmeCalendar(
  readFileSync(resolve(import.meta.dirname, 'fixtures/runme-laufkalender.html'), 'utf8'),
  { baseUrl: BASE },
)

describe('readRunmeCalendar', () => {
  it('reads the distances off what the event sells', () => {
    const abendlauf = races.find((race) => race.name.includes('Abendlauf'))
    expect(abendlauf).toMatchObject({
      startDate: '2026-09-04',
      city: 'Hamminkeln',
      region: 'Nordrhein-Westfalen',
      country: 'DE',
      distancesKm: [5, 10],
    })
  })

  it('takes the postcode off the town, wherever the source puts it', () => {
    // Germany writes "46499 Hamminkeln", the United States "Mountain Home 83647".
    expect(races.find((race) => race.country === 'US')?.city).toBe('Mountain Home')
  })

  it('reads a race abroad, miles and all', () => {
    const us = races.find((race) => race.country === 'US')
    // "1 Meilen", "5 km-Laufen & Walking", "21,1 km".
    expect(us?.distancesKm).toEqual([1.6093, 5, 21.1])
  })

  it('keeps a race that can also be walked', () => {
    // "5 km-Laufen & Walking" is a run; "5 km-W/NW" beside it is not.
    const us = races.find((race) => race.country === 'US')
    expect(us?.distancesKm).toContain(5)
  })

  it('drops an event that only sells a walk', () => {
    // "12 km-W" and "12 km" on the same event: the run is what we keep.
    const walk = races.find((race) => race.name.includes('IHK'))
    expect(walk?.distancesKm).toEqual([12])
  })

  it('links to the event on the calendar it came from', () => {
    expect(races.find((race) => race.name.includes('Abendlauf'))?.sourceUrl).toBe(
      'https://www.runme.de/deutschland/abendlauf-hamminkeln/',
    )
  })

  it('reads a country that is not Germany or the United States', () => {
    expect(races.find((race) => race.name.includes('Südtiroler'))).toMatchObject({
      country: 'IT',
      city: 'Neumarkt',
      distancesKm: [5.2],
    })
  })

  it('has nothing to say about a page with no events', () => {
    expect(readRunmeCalendar('<div class="event-list"></div>', { baseUrl: BASE })).toEqual([])
  })
})

describe('the postcode, wherever a country puts it', () => {
  function place(value: string) {
    const block = `<div class="event-header__description">
      <h2 class="event-header__title"><a href="/x/y/">Lauf</a></h2>
      <div class="distance-promo"><span class="glyphicon glyphicon-map-marker"></span> ${value}</div>
      <div class="notepad-actions" d-n="10 km" d-d="2026-09-04"></div>`
    return readRunmeCalendar(block, { baseUrl: BASE })[0]
  }

  it('takes it off the front, the back, and with letters in it', () => {
    expect(place('46499 Hamminkeln, Nordrhein-Westfalen, DE')?.city).toBe('Hamminkeln')
    expect(place('Mountain Home 83647, Idaho, US')?.city).toBe('Mountain Home')
    expect(place('AD300 Ordino, Ordino, AD')?.city).toBe('Ordino')
    expect(place('Q8370 San Martín de los Andes, Neuquén, AR')?.city).toBe(
      'San Martín de los Andes',
    )
  })

  it('leaves a number that belongs to the town alone', () => {
    expect(place('Kranj, Gorenjska, SI')?.city).toBe('Kranj')
  })
})
