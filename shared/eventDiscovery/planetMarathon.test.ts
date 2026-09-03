import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { readPlanetMarathonCalendar } from './planetMarathon'

const CALENDAR = 'http://www.planet-marathon.de/marathon_d.html'

function fixture(name: string): string {
  return readFileSync(resolve(import.meta.dirname, 'fixtures', name), 'utf8')
}

describe('readPlanetMarathonCalendar, the German page', () => {
  const races = readPlanetMarathonCalendar(fixture('planet-marathon-de.html'), {
    sourceUrl: CALENDAR,
    country: 'DE',
  })

  it('reads the rows and nothing else', () => {
    expect(races.length).toBeGreaterThan(5)
    expect(races.every((race) => race.country === 'DE')).toBe(true)
    // The page's own rule: only the official distance is listed here.
    expect(races.every((race) => race.distancesKm[0] === 42.195)).toBe(true)
  })

  it('takes the city from the column after the postal code', () => {
    const usedom = races.find((race) => race.name.includes('Usedom'))
    expect(usedom).toMatchObject({ city: 'Wolgast', startDate: '2026-09-05' })
    expect(usedom?.name).toBe('46. Usedom Marathon')
  })

  it("prefers the organiser's own site to the calendar page", () => {
    const usedom = races.find((race) => race.name.includes('Usedom'))
    expect(usedom?.sourceUrl).toBe('http://usedom-marathon.de')
    // Uppercase HREF, because half this site was written by hand in the 90s.
    expect(races.every((race) => race.sourceUrl.startsWith('http'))).toBe(true)
  })

  it('drops the site\'s own footnote from the name', () => {
    const names = races.map((race) => race.name)
    expect(names.some((name) => name.includes('*'))).toBe(false)
    expect(names.some((name) => name.includes('privater'))).toBe(false)
  })

  it('falls back to the calendar page for a race with no link', () => {
    const row = `<table><tr>
      <td>05.09.2026</td><td>7. Dorflauf Marathon</td><td>12345</td><td>Kleinkleckersdorf</td>
    </tr></table>`
    const [race] = readPlanetMarathonCalendar(row, { sourceUrl: CALENDAR, country: 'DE' })
    expect(race?.sourceUrl).toBe(CALENDAR)
  })

  it('leaves the marathon that is a leg of a triathlon relay out', () => {
    expect(races.some((race) => /triathlon/i.test(race.name))).toBe(false)
  })

  it('reads the umlauts once the page is decoded', () => {
    // The site is ISO-8859-1 and says so nowhere, which is fetchPage's problem,
    // but the entities in the markup are this parser's.
    const all = races.map((race) => race.name).join(' ')
    expect(all).not.toContain('&')
  })
})

describe('readPlanetMarathonCalendar, the pages abroad', () => {
  const races = readPlanetMarathonCalendar(fixture('planet-marathon-europa.html'), {
    sourceUrl: 'http://www.planet-marathon.de/marathon_europa.html',
  })

  it('maps the hand typed country code to ISO', () => {
    const czech = races.find((race) => race.city === 'Plasy')
    expect(czech).toMatchObject({ country: 'CZ', name: '19. Baroko Maraton' })
    // The site writes DEN for Denmark, which is not the ISO code.
    expect(races.some((race) => race.country === 'DK')).toBe(true)
  })

  it('takes the city from the column before the code', () => {
    expect(races.every((race) => race.city && !/^[A-Z]{3}$/.test(race.city))).toBe(true)
  })

  it('drops a row whose country code it cannot resolve', () => {
    const invented = `<table><tr>
      <td>05.09.2026</td><td>1. Lauf am Ende der Welt</td>
      <td>Nirgendwo</td><td>ZZZ</td><td>Nirgendwoland</td>
    </tr></table>`
    expect(
      readPlanetMarathonCalendar(invented, { sourceUrl: CALENDAR }),
    ).toEqual([])
  })

  it('leaves a marathon run over three days out', () => {
    expect(races.some((race) => /etappen/i.test(race.name))).toBe(false)
  })

  it('has nothing to say about a page with no calendar', () => {
    expect(readPlanetMarathonCalendar('<html><body>weg</body></html>', {
      sourceUrl: CALENDAR,
    })).toEqual([])
  })
})
