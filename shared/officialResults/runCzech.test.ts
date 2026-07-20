import { describe, expect, it } from 'vitest'
import searchFixture from './fixtures/runczech-prague-half-2025-search-sample.html?raw'
import pageFixture from './fixtures/runczech-prague-half-2025-page1-sample.html?raw'
import { detectPlatformFromUrl } from './detectPlatform'
import { parseRunCzechUrl } from './parseUrls'
import {
  buildRunCzechSearchUrl,
  parseRunCzechResultRows,
  parseRunCzechTime,
  parseRunCzechTotalParticipants,
} from './runCzech'
import { buildRunCzechSearchTerm } from './runCzechSearch'
import { namesMatch } from './matchName'
import { resultsPlatformLabel } from './types'

const pragueHalfUrl =
  'https://www.runczech.com/en/results/generali-1-2maraton-praha-2025'

describe('detectPlatformFromUrl', () => {
  it('detects runczech from results url', () => {
    expect(detectPlatformFromUrl(pragueHalfUrl)).toBe('runczech')
  })

  it('detects runczech from czech results url', () => {
    expect(
      detectPlatformFromUrl(
        'https://www.runczech.com/cs/vysledky-zavodu/generali-1-2maraton-praha-2025',
      ),
    ).toBe('runczech')
  })
})

describe('parseRunCzechUrl', () => {
  it('extracts event slug from results url', () => {
    expect(parseRunCzechUrl(pragueHalfUrl)).toEqual({
      eventSlug: 'generali-1-2maraton-praha-2025',
      locale: 'en',
      pageUrl: pragueHalfUrl,
      origin: 'https://www.runczech.com',
      race: undefined,
    })
  })

  it('preserves race filter from url', () => {
    expect(
      parseRunCzechUrl(`${pragueHalfUrl}?race=53309&current_page=2&filter_search=test`),
    ).toEqual({
      eventSlug: 'generali-1-2maraton-praha-2025',
      locale: 'en',
      pageUrl: pragueHalfUrl,
      origin: 'https://www.runczech.com',
      race: '53309',
    })
  })

  it('rejects unrelated urls', () => {
    expect(parseRunCzechUrl('https://www.runczech.com/en/results')).toBeNull()
  })
})

describe('parseRunCzechTime', () => {
  it('normalizes h:mm:ss', () => {
    expect(parseRunCzechTime('2:46:12')).toBe('02:46:12')
    expect(parseRunCzechTime('0:58:54')).toBe('00:58:54')
  })
})

describe('parseRunCzechTotalParticipants', () => {
  it('reads finisher count from page header', () => {
    expect(parseRunCzechTotalParticipants(pageFixture)).toBe(14172)
  })
})

describe('parseRunCzechResultRows', () => {
  it('parses search result row', () => {
    const rows = parseRunCzechResultRows(searchFixture)
    expect(rows).toEqual([
      {
        position: 2,
        name: 'Isaia Kipkoech Lasoi',
        firstName: 'Isaia',
        lastName: 'Kipkoech Lasoi',
        time: '00:58:56',
      },
    ])
  })

  it('parses elite finisher row', () => {
    const rows = parseRunCzechResultRows(pageFixture)
    expect(rows[0]).toEqual({
      position: 1,
      name: 'Rodrigue Kwizera',
      firstName: 'Rodrigue',
      lastName: 'Kwizera',
      time: '00:58:54',
    })
  })

  it('matches isaia kipkoech lasoi from fixture', () => {
    const rows = parseRunCzechResultRows(searchFixture)
    const profile = { resultFirstName: 'Isaia', resultLastName: 'Kipkoech Lasoi' }
    const match = rows.find((row) => namesMatch(profile, row.firstName, row.lastName))
    expect(match?.position).toBe(2)
    expect(match?.time).toBe('00:58:56')
  })
})

describe('buildRunCzechSearchUrl', () => {
  it('builds search url with filter_search', () => {
    const parts = parseRunCzechUrl(pragueHalfUrl)!
    expect(buildRunCzechSearchUrl(parts, 'Isaia Kipkoech Lasoi')).toBe(
      'https://www.runczech.com/en/results/generali-1-2maraton-praha-2025?current_page=1&filter_search=Isaia+Kipkoech+Lasoi',
    )
  })
})

describe('buildRunCzechSearchTerm', () => {
  it('uses first and last name when available', () => {
    expect(
      buildRunCzechSearchTerm({ resultFirstName: 'Isaia', resultLastName: 'Kipkoech Lasoi' }),
    ).toBe('Isaia Kipkoech Lasoi')
  })
})

describe('resultsPlatformLabel', () => {
  it('formats runczech as RunCzech', () => {
    expect(resultsPlatformLabel('runczech')).toBe('RunCzech')
  })
})
