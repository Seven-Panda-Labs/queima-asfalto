import { describe, expect, it } from 'vitest'
import chicagoFixture from './fixtures/mikatiming-chicago-search-neves.html?raw'
import { detectPlatformFromUrl } from './detectPlatform'
import { matchesResultsProfile } from './matchName'
import {
  buildMikaTimingSearchFormFields,
  parseMikaTimingDisplayName,
  parseMikaTimingMaxListPage,
  parseMikaTimingSearchRows,
  parseMikaTimingTime,
  parseMikaTimingUrl,
} from './mikaTiming'
import { buildMikaTimingSearchTerm } from './mikaTimingSearch'
import { getSortedResultsPlatforms, resultsPlatformLabel } from './types'

const chicagoUrl = 'https://results.chicagomarathon.com/2025/?pid=search'
const londonUrl = 'https://results.tcslondonmarathon.com/2026/'

describe('detectPlatformFromUrl', () => {
  it('detects mikatiming from custom marathon results domain', () => {
    expect(detectPlatformFromUrl(chicagoUrl)).toBe('mikatiming')
    expect(detectPlatformFromUrl(londonUrl)).toBe('mikatiming')
  })

  it('detects mikatiming subdomains', () => {
    expect(detectPlatformFromUrl('https://birkebeiner.r.mikatiming.com/?pid=search')).toBe(
      'mikatiming',
    )
  })
})

describe('parseMikaTimingUrl', () => {
  it('parses year-based custom results urls', () => {
    expect(parseMikaTimingUrl(chicagoUrl)).toEqual({
      baseUrl: 'https://results.chicagomarathon.com/2025/',
      pageUrl: chicagoUrl,
      event: undefined,
      lang: 'EN_CAP',
    })
  })
})

describe('parseMikaTimingTime', () => {
  it('normalizes HH:MM:SS', () => {
    expect(parseMikaTimingTime('3:25:50')).toBe('03:25:50')
  })
})

describe('parseMikaTimingDisplayName', () => {
  it('parses last, first format with country code', () => {
    expect(parseMikaTimingDisplayName('Neves, Sónia (POR)')).toEqual({
      displayName: 'Sónia Neves',
      firstName: 'Sónia',
      lastName: 'Neves',
    })
  })

  it('parses compound surnames', () => {
    expect(parseMikaTimingDisplayName('Neves De Oliveira, Carlos Magno (BRA)')).toEqual({
      displayName: 'Carlos Magno Neves De Oliveira',
      firstName: 'Carlos Magno',
      lastName: 'Neves De Oliveira',
    })
  })
})

describe('parseMikaTimingSearchRows', () => {
  it('parses Chicago Marathon search results', () => {
    const rows = parseMikaTimingSearchRows(chicagoFixture)
    const sonia = rows.find((row) => row.displayName === 'Sónia Neves')

    expect(sonia).toEqual({
      position: 10918,
      displayName: 'Sónia Neves',
      firstName: 'Sónia',
      lastName: 'Neves',
      time: '03:25:50',
      event: 'MAR',
    })
  })
})

describe('matchesResultsProfile', () => {
  it('matches Sónia Neves from issue #158', () => {
    const rows = parseMikaTimingSearchRows(chicagoFixture)
    const sonia = rows.find((row) => row.displayName === 'Sónia Neves')
    expect(sonia).toBeDefined()
    expect(
      matchesResultsProfile(
        { resultFirstName: 'Sónia', resultLastName: 'Neves' },
        sonia!.displayName,
      ),
    ).toBe(true)
  })
})

describe('buildMikaTimingSearchTerm', () => {
  it('prefers last name', () => {
    expect(buildMikaTimingSearchTerm({ resultFirstName: 'Sónia', resultLastName: 'Neves' })).toBe(
      'Neves',
    )
  })
})

describe('buildMikaTimingSearchFormFields', () => {
  it('builds search form without forcing event', () => {
    expect(buildMikaTimingSearchFormFields({ lang: 'EN_CAP' }, 'neves')).toEqual({
      lang: 'EN_CAP',
      startpage: 'start_responsive',
      startpage_type: 'search',
      event_main_group: 'runner',
      'search[name]': 'neves',
      'search[firstname]': '',
      'search[start_no]': '',
      submit: '',
    })
  })
})

describe('parseMikaTimingMaxListPage', () => {
  it('reads max page from pagination silver links', () => {
    expect(parseMikaTimingMaxListPage(chicagoFixture)).toBeGreaterThanOrEqual(1)
  })
})

describe('resultsPlatformLabel', () => {
  it('formats mikatiming label', () => {
    expect(resultsPlatformLabel('mikatiming')).toBe('mika:timing')
  })
})

describe('getSortedResultsPlatforms', () => {
  it('returns platforms sorted alphabetically by label', () => {
    const labels = getSortedResultsPlatforms().map((platform) => resultsPlatformLabel(platform))
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b, 'en')))
  })
})
