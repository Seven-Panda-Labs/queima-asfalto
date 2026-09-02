import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseSccDate, readSccCalendar } from './sccEvents'

const html = readFileSync('shared/eventDiscovery/fixtures/scc-calendar.html', 'utf8')
const options = { city: 'Berlin', country: 'DE', baseUrl: 'https://www.scc-events.com' }

describe('parseSccDate', () => {
  it('reads a single day', () => {
    expect(parseSccDate('23.08.2026')).toBe('2026-08-23')
  })

  it('takes the first day of an event that lasts a weekend', () => {
    expect(parseSccDate('24. bis 26.09.2026')).toBe('2026-09-24')
  })

  it('has nothing for a card with no date yet', () => {
    expect(parseSccDate('')).toBeNull()
    expect(parseSccDate('Termin folgt')).toBeNull()
  })
})

describe('readSccCalendar', () => {
  const races = readSccCalendar(html, options)

  it('reads the race, with the distances the calendar names', () => {
    const generalprobe = races.find((race) => race.name.includes('Generalprobe'))!

    expect(generalprobe.startDate).toBe('2026-08-23')
    expect(generalprobe.city).toBe('Berlin')
    expect(generalprobe.country).toBe('DE')
    // "Halbmarathon (21,0975 km)" and "Viertelmarathon (ca 10,5 km)".
    expect(generalprobe.distancesKm).toEqual([10.5, 21.0975])
    expect(generalprobe.sourceUrl).toBe('https://www.berliner-generalprobe.de/')
  })

  it('leaves out the children s series, whatever distance it names', () => {
    expect(races.map((race) => race.name)).not.toContain(
      'Bambini-Laufserie presented by ADAC',
    )
  })

  it('leaves out the school race, which the app would file as a 4 km', () => {
    // The mini-MARATHON is 4.2195 km, run by school teams.
    expect(races.some((race) => race.name.includes('mini-MARATHON'))).toBe(false)
  })

  it('has nothing to say about a page that is not the calendar', () => {
    expect(readSccCalendar('<html><body>403</body></html>', options)).toEqual([])
  })
})
