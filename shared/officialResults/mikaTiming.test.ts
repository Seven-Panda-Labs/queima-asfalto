import { describe, expect, it } from 'vitest'
import chicagoFixture from './fixtures/mikatiming-chicago-search-neves.html?raw'
import cityNightFixture from './fixtures/mikatiming-city-night-search-neves.html?raw'
import munichDetailFixture from './fixtures/mikatiming-munich-detail-snippet.html?raw'
import munichLandingFixture from './fixtures/mikatiming-munich-landing-snippet.html?raw'
import munichSearchFixture from './fixtures/mikatiming-munich-search-snippet.html?raw'
import { detectPlatformFromUrl } from './detectPlatform'
import { matchesResultsProfile } from './matchName'
import {
  buildMikaTimingDetailUrl,
  buildMikaTimingSearchFormFields,
  parseMikaTimingDetailEvent,
  parseMikaTimingDetailResult,
  parseMikaTimingDisplayName,
  parseMikaTimingEventCodesFromSelect,
  parseMikaTimingEventMainGroup,
  buildMikaTimingListFormFields,
  parseMikaTimingListParticipantCount,
  parseMikaTimingMaxListPage,
  parseMikaTimingOverallPlaceColumn,
  parseMikaTimingSearchEventCodesFromHtml,
  parseMikaTimingSearchRows,
  parseMikaTimingTime,
  parseMikaTimingUrl,
} from './mikaTiming'
import { buildMikaTimingSearchTerm } from './mikaTimingSearch'
import { getSupportedLookupPlatforms, resultsPlatformLabel } from './types'

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
      runnerId: '9TGG96382B8531',
    })
  })

  it('parses SCC City Night netto time labels', () => {
    const rows = parseMikaTimingSearchRows(cityNightFixture)
    expect(rows).toMatchObject([
      {
        position: 3273,
        displayName: 'Rodrigo Neves',
        firstName: 'Rodrigo',
        lastName: 'Neves',
        time: '00:54:38',
        event: 'CN10',
      },
    ])
  })

  it('keeps a row whose name is not a link and whose list shows no time', () => {
    expect(parseMikaTimingSearchRows(munichSearchFixture)).toEqual([
      {
        position: 401,
        displayName: 'Zé Ninguém',
        firstName: 'Zé',
        lastName: 'Ninguém',
        time: undefined,
        event: undefined,
        runnerId: 'QAFIX3374',
      },
    ])
  })
})

describe('parseMikaTimingEventCodesFromSelect', () => {
  it('reads the race codes the class names do not carry', () => {
    expect(parseMikaTimingEventCodesFromSelect(munichLandingFixture)).toEqual([
      'M_QAFIX',
      'HM_QAFIX',
      '10_QAFIX',
      'KR1_QAFIX',
    ])
  })

  it('ignores the season picker', () => {
    expect(parseMikaTimingEventCodesFromSelect(munichLandingFixture)).not.toContain('2025')
  })
})

describe('parseMikaTimingDetailResult', () => {
  it('reads the net time and overall place the search list omitted', () => {
    expect(parseMikaTimingDetailResult(munichDetailFixture)).toEqual({
      time: '03:12:23',
      position: 401,
    })
  })

  it('returns null when the page holds no result', () => {
    expect(parseMikaTimingDetailResult('<div class="detail">Not found</div>')).toBeNull()
  })
})

describe('buildMikaTimingDetailUrl', () => {
  it('addresses the runner on their event', () => {
    const url = new URL(
      buildMikaTimingDetailUrl(
        { baseUrl: 'https://muenchen.r.mikatiming.com/2025/', lang: 'EN_CAP', event: 'M_QAFIX' },
        'QAFIX3374',
      ),
    )

    expect(url.origin + url.pathname).toBe('https://muenchen.r.mikatiming.com/2025/')
    expect(url.searchParams.get('content')).toBe('detail')
    expect(url.searchParams.get('idp')).toBe('QAFIX3374')
    expect(url.searchParams.get('event')).toBe('M_QAFIX')
  })
})

describe('parseMikaTimingOverallPlaceColumn', () => {
  it('uses secondary column for Chicago overall place', () => {
    expect(parseMikaTimingOverallPlaceColumn(chicagoFixture)).toBe('secondary')
  })

  it('uses primary column for City Night overall place', () => {
    expect(parseMikaTimingOverallPlaceColumn(cityNightFixture)).toBe('primary')
  })
})

describe('parseMikaTimingSearchEventCodesFromHtml', () => {
  it('reads event codes from multi-discipline search shells', () => {
    expect(parseMikaTimingSearchEventCodesFromHtml(cityNightFixture).sort()).toEqual(['CN10', 'CN5M'])
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

describe('parseMikaTimingListParticipantCount', () => {
  it('reads finisher count from list header', () => {
    const html = '<span class="list-info__text str_num">9371 Results</span>'
    expect(parseMikaTimingListParticipantCount(html)).toBe(9371)
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

describe('getSupportedLookupPlatforms', () => {
  it('returns platforms sorted alphabetically by label', () => {
    const labels = getSupportedLookupPlatforms().map((platform) => resultsPlatformLabel(platform))
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b, 'en')))
  })

  it('leaves out the platforms the search can no longer reach', () => {
    expect(getSupportedLookupPlatforms()).not.toContain('parkrun')
    expect(getSupportedLookupPlatforms()).not.toContain('maxfunsports')
    expect(getSupportedLookupPlatforms()).toContain('mikatiming')
  })
})

describe('parseMikaTimingEventMainGroup', () => {
  it('reads the group the race picker is paired with', () => {
    expect(parseMikaTimingEventMainGroup(munichLandingFixture)).toBe('2025')
  })

  it('returns nothing when the page has no picker', () => {
    expect(parseMikaTimingEventMainGroup('<form></form>')).toBeUndefined()
  })
})

describe('buildMikaTimingListFormFields', () => {
  it('sends the season group and a sex when the event splits its ranking', () => {
    expect(
      buildMikaTimingListFormFields({ lang: 'EN_CAP', event: 'M_QAFIX', mainGroup: '2025' }, '100', 'M'),
    ).toMatchObject({
      event_main_group: '2025',
      event: 'M_QAFIX',
      'search[sex]': 'M',
      num_results: '100',
    })
  })

  it('falls back to the runner group the older instances use', () => {
    expect(buildMikaTimingListFormFields({ lang: 'EN_CAP', event: 'CN10' })).toMatchObject({
      event_main_group: 'runner',
      'search[sex]': '',
    })
  })
})

describe('parseMikaTimingDetailEvent', () => {
  it('picks the race the picker offered, not the season', () => {
    expect(
      parseMikaTimingDetailEvent(munichDetailFixture, ['M_QAFIX', 'HM_QAFIX']),
    ).toBe('M_QAFIX')
  })

  it('returns nothing when no offered race is mentioned', () => {
    expect(parseMikaTimingDetailEvent(munichDetailFixture, ['CN10'])).toBeUndefined()
  })
})
