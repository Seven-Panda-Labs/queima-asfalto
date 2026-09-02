import { describe, expect, it } from 'vitest'
import runCastle from './fixtures/acorrer-run-castle.json'
import trailDao from './fixtures/acorrer-trail-dao-mondego.json'
import { extractJsonLd, readRacesFromHtml, readRacesFromJsonLd } from './schemaOrg'

describe('readRacesFromJsonLd', () => {
  it('reads a race out of a real @graph, distances and all', () => {
    const [race] = readRacesFromJsonLd([trailDao])

    expect(race).toBeDefined()
    expect(race!.name).toBe('IV Trail Entre o Dão e o Mondego')
    expect(race!.startDate).toBe('2026-11-08T08:45:00+00:00')
    expect(race!.city).toBe('Carregal do Sal')
    expect(race!.region).toBe('Viseu')
    expect(race!.country).toBe('PT')
    expect(race!.sourceUrl).toBe(
      'https://acorrer.pt/eventos/4-trail-entre-o-dao-e-o-mondego-carregal-do-sal',
    )
    // "Trail Longo 24km", "Trail Curto 14km" and the rest.
    expect(race!.distancesKm).toContain(24)
    expect(race!.distancesKm).toContain(14)
    expect(race!.cancelled).toBe(false)
  })

  it('carries the entry deadline and the price range', () => {
    const [race] = readRacesFromJsonLd([trailDao])

    expect(race!.registrationClosesAt).toBe('2026-11-01T23:59:00+00:00')
    expect(race!.lowPrice).toBe(5)
    expect(race!.highPrice).toBe(10)
    expect(race!.currency).toBe('EUR')
  })

  it('says when the source says the race is off', () => {
    const [race] = readRacesFromJsonLd([runCastle])

    expect(race!.name).toBe('XI Run Castle')
    expect(race!.cancelled).toBe(true)
    expect(race!.distancesKm).toEqual([8, 10, 17])
  })

  it('ignores the organisation, website and breadcrumb nodes beside it', () => {
    expect(readRacesFromJsonLd([runCastle])).toHaveLength(1)
  })
})

describe('extractJsonLd', () => {
  it('reads every block and survives a broken one', () => {
    const html = `
      <html><head>
      <script type="application/ld+json">{"@type":"WebSite"}</script>
      <script type="application/ld+json">not json at all</script>
      <script type="application/ld+json">
        {"@type":"SportsEvent","name":"Meia de Cascais","startDate":"2027-01-10",
         "url":"https://example.invalid/meia","offers":[{"@type":"Offer","name":"Meia maratona 21km"}]}
      </script>
      </head></html>`

    expect(extractJsonLd(html)).toHaveLength(2)

    const races = readRacesFromHtml(html)
    expect(races).toHaveLength(1)
    expect(races[0]!.name).toBe('Meia de Cascais')
    expect(races[0]!.distancesKm).toEqual([21])
  })

  it('has nothing to say about a page with no events', () => {
    expect(readRacesFromHtml('<html><body>Redirecting</body></html>')).toEqual([])
  })

  it('needs a name, a date and a url before it will believe a node', () => {
    expect(readRacesFromJsonLd([{ '@type': 'Event', name: 'Sem data' }])).toEqual([])
  })
})
