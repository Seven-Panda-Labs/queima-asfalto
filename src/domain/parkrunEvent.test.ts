import { describe, expect, it } from 'vitest'
import { isKnownParkrun, parkrunSite, parkrunSiteNeedsCatalog } from './parkrunEvent'

describe('isKnownParkrun', () => {
  it('counts an event linked by slug or by results platform', () => {
    expect(isKnownParkrun({ parkrunEventSlug: 'cardiff' })).toBe(true)
    expect(isKnownParkrun({ resultsPlatform: 'parkrun' })).toBe(true)
  })

  it('does not count an unlinked race', () => {
    expect(isKnownParkrun({})).toBe(false)
    expect(isKnownParkrun({ resultsPlatform: 'sporthive' })).toBe(false)
  })
})

describe('parkrunSite', () => {
  it('is the country site and the slug the picker saved', () => {
    expect(
      parkrunSite({ parkrunEventSlug: 'bushy', parkrunCountryUrl: 'https://www.parkrun.org.uk/' }),
    ).toBe('https://www.parkrun.org.uk/bushy/')
  })

  it('reads an imported results page when nothing else was saved', () => {
    expect(
      parkrunSite({
        resultsPlatform: 'parkrun',
        resultsUrl: 'https://www.parkrun.pt/oeiras/results/2026-09-12/',
      }),
    ).toBe('https://www.parkrun.pt/oeiras/')
  })

  it('asks the catalog for a slug saved without its country', () => {
    const event = { parkrunEventSlug: 'oeiras' }
    expect(parkrunSiteNeedsCatalog(event)).toBe(true)
    expect(parkrunSite(event, () => 'https://www.parkrun.pt')).toBe('https://www.parkrun.pt/oeiras/')
    expect(parkrunSite(event)).toBeUndefined()
  })

  it('is nothing for a race that is not a parkrun', () => {
    expect(parkrunSite({ resultsUrl: 'https://www.parkrun.pt/oeiras/results/' })).toBeUndefined()
    expect(parkrunSiteNeedsCatalog({})).toBe(false)
  })
})
