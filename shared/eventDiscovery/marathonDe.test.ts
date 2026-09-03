import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { readMarathonDePage } from './marathonDe'

const PAGE = 'https://www.marathon.de/laufevent/usedom-marathon/'

function fixture(name: string): string {
  return readFileSync(resolve(import.meta.dirname, 'fixtures', name), 'utf8')
}

describe('readMarathonDePage', () => {
  it('reads the city, the distances and the fee range', () => {
    const race = readMarathonDePage(fixture('marathon-de-usedom.html'), { sourceUrl: PAGE })

    expect(race).toMatchObject({
      name: 'Usedom Marathon',
      startDate: '2026-09-05',
      city: 'Wolgast',
      country: 'DE',
      distancesKm: [21, 42],
      cancelled: false,
    })
    // Cheapest and dearest across every distance on the page, which is what
    // those two fields mean: 16 EUR for the half, 80 for the relay team.
    expect(race).toMatchObject({ lowPrice: 16, highPrice: 80, currency: 'EUR' })
  })

  it("points at the organiser's own site, not at the directory", () => {
    const race = readMarathonDePage(fixture('marathon-de-usedom.html'), { sourceUrl: PAGE })
    expect(race?.sourceUrl).toBe('https://usedom-marathon.com')
  })

  it('takes the first day of a race that runs over two', () => {
    const race = readMarathonDePage(fixture('marathon-de-jungfrau.html'), { sourceUrl: PAGE })
    expect(race).toMatchObject({
      startDate: '2026-09-04',
      city: 'Interlaken',
      country: 'CH',
      currency: 'CHF',
      lowPrice: 179,
    })
  })

  it('reads a race abroad, in its own currency', () => {
    const race = readMarathonDePage(fixture('marathon-de-tokyo.html'), { sourceUrl: PAGE })
    expect(race).toMatchObject({ city: 'Tokio', country: 'JP', currency: 'USD' })
    // "10,7 km / 42 km", with the decimal comma this directory writes.
    expect(race?.distancesKm).toEqual([10, 42])
  })

  it('drops a page whose country it cannot resolve', () => {
    const page = `<h1>Lauf am Ende der Welt</h1>
      <strong>Datum:</strong> Samstag, 05.09.2026<br>
      <strong>Ort:</strong> Nirgendwo, Nirgendwoland<br>
      <strong>Distanzen:</strong> 42 km<br>`
    expect(readMarathonDePage(page, { sourceUrl: PAGE })).toBeNull()
  })

  it('drops a page with no date, which is a race nobody can plan around', () => {
    const page = `<h1>Irgendwann Marathon</h1>
      <strong>Datum:</strong> noch offen<br>
      <strong>Ort:</strong> Kassel, Deutschland<br>
      <strong>Distanzen:</strong> 42 km<br>`
    expect(readMarathonDePage(page, { sourceUrl: PAGE })).toBeNull()
  })

  it('says so when the page says the race is off', () => {
    const page = `<h1>Abgesagt Marathon</h1>
      <strong>Datum:</strong> Samstag, 05.09.2026<br>
      <strong>Ort:</strong> Kassel, Deutschland<br>
      <strong>Distanzen:</strong> 42 km<br>
      <p>Der Marathon wurde abgesagt.</p>`
    expect(readMarathonDePage(page, { sourceUrl: PAGE })?.cancelled).toBe(true)
  })

  it('takes the country from the last part, whatever sits in the middle', () => {
    // Real page: "Ort: Dalt Vila, Ibiza, Spanien".
    const page = `<h1>Ibiza Marathon</h1>
      <strong>Datum:</strong> Samstag, 10.04.2027<br>
      <strong>Ort:</strong> Dalt Vila, Ibiza, Spanien<br>
      <strong>Distanzen:</strong> 12 km / 22 km / 42 km<br>`
    expect(readMarathonDePage(page, { sourceUrl: PAGE })).toMatchObject({
      city: 'Dalt Vila',
      country: 'ES',
    })
  })

  it('knows the country names this directory actually writes', () => {
    // "London, UK", not "Großbritannien", on the London Marathon's page.
    const page = `<h1>London Marathon</h1>
      <strong>Datum:</strong> Sonntag, 25.04.2027<br>
      <strong>Ort:</strong> London, UK<br>
      <strong>Distanzen:</strong> 42 km<br>`
    expect(readMarathonDePage(page, { sourceUrl: PAGE })?.country).toBe('GB')
  })

  it('drops a race with no distance, because there is nothing to offer', () => {
    // Wings for Life: you run until the catcher car passes you.
    const page = `<h1>Wings for Life World Run</h1>
      <strong>Datum:</strong> Sonntag, 09.05.2027<br>
      <strong>Ort:</strong> München, Deutschland<br>
      <strong>Distanzen:</strong> -<br>`
    expect(readMarathonDePage(page, { sourceUrl: PAGE })).toBeNull()
  })

  it('has nothing to say about a page that is not an event', () => {
    expect(readMarathonDePage('<html><body>Impressum</body></html>', { sourceUrl: PAGE })).toBeNull()
  })
})
