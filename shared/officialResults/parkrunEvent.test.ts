import { describe, expect, it } from 'vitest'
import {
  buildParkrunDateResultsUrl,
  buildParkrunEventLookupUrls,
  buildParkrunLatestResultsUrl,
  parkrunEventSlug,
  parkrunSlugFromResultsUrl,
  resolveParkrunEventSlug,
} from './parkrunEvent'

describe('parkrunEvent', () => {
  it('derives slug from event name', () => {
    expect(parkrunEventSlug('Hasenheide parkrun')).toBe('hasenheide')
    expect(parkrunEventSlug('PARKRUN HASENHEIDE')).toBe('hasenheide')
    expect(parkrunEventSlug('parkrun')).toBeNull()
  })

  it('parses slug from results url', () => {
    expect(
      parkrunSlugFromResultsUrl('https://www.parkrun.com.de/hasenheide/results/latestresults/'),
    ).toBe('hasenheide')
    expect(
      parkrunSlugFromResultsUrl('https://www.parkrun.org.uk/bushy/results/1/'),
    ).toBe('bushy')
  })

  it('prefers explicit slug over results url and event name', () => {
    expect(
      resolveParkrunEventSlug('Wrong name', {
        parkrunEventSlug: 'hasenheide',
        resultsUrl: 'https://www.parkrun.org.uk/bushy/results/',
      }),
    ).toBe('hasenheide')
  })

  it('prefers slug from results url over event name', () => {
    expect(
      resolveParkrunEventSlug('Wrong name', {
        resultsUrl: 'https://www.parkrun.com.de/hasenheide/results/',
      }),
    ).toBe('hasenheide')
  })

  it('builds latest and date results urls', () => {
    expect(buildParkrunLatestResultsUrl('https://www.parkrun.com.de', 'hasenheide')).toBe(
      'https://www.parkrun.com.de/hasenheide/results/latestresults/',
    )
    expect(
      buildParkrunDateResultsUrl('https://www.parkrun.com.de', 'hasenheide', '2026-06-28'),
    ).toBe('https://www.parkrun.com.de/hasenheide/results/2026-06-28/')
  })

  it('builds lookup urls with country base first', () => {
    expect(
      buildParkrunEventLookupUrls('hasenheide', {
        countryUrl: 'https://www.parkrun.com.de',
        eventDateIsoCandidates: ['2026-06-28'],
      }),
    ).toEqual([
      'https://www.parkrun.com.de/hasenheide/results/2026-06-28/',
      'https://www.parkrun.org.uk/hasenheide/results/2026-06-28/',
      'https://www.parkrun.com.de/hasenheide/results/latestresults/',
      'https://www.parkrun.org.uk/hasenheide/results/latestresults/',
    ])
  })
})
