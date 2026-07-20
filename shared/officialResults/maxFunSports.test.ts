import { describe, expect, it } from 'vitest'
import wwwFixture from './fixtures/maxfun-b2run-neves-search.html?raw'
import iframeFixture from './fixtures/maxfun-b2run-iframe-neves-search.html?raw'
import {
  buildMaxFunSportsSearchUrl,
  buildMaxFunSportsWwwSummaryUrl,
  parseMaxFunSportsResultRows,
  parseMaxFunSportsSummaryTotal,
} from './maxFunSports'
import { buildMaxFunSportsSearchTerm } from './maxFunSportsSearch'
import { detectPlatformFromUrl } from './detectPlatform'
import { parseMaxFunSportsUrl } from './parseUrls'
import { resultsPlatformLabel } from './types'

const wwwParts = {
  competitionId: '4220',
  pageUrl: 'https://www.maxfunsports.com/result/competition?id=4220',
  fetchBasePath: '/result/competition' as const,
  origin: 'https://www.maxfunsports.com',
}

describe('detectPlatformFromUrl', () => {
  it('detects maxfunsports from www results url', () => {
    expect(detectPlatformFromUrl('https://www.maxfunsports.com/result/competition?id=4220')).toBe(
      'maxfunsports',
    )
  })

  it('detects maxfunsports from iframe url', () => {
    expect(
      detectPlatformFromUrl('https://b2run-iframe.maxfunsports.com/event/competition?id=4220&lang=de'),
    ).toBe('maxfunsports')
  })
})

describe('parseMaxFunSportsUrl', () => {
  it('parses www competition url', () => {
    expect(parseMaxFunSportsUrl('https://www.maxfunsports.com/result/competition?id=4220&page=2')).toEqual({
      competitionId: '4220',
      pageUrl: 'https://www.maxfunsports.com/result/competition?id=4220&page=2',
      fetchBasePath: '/result/competition',
      origin: 'https://www.maxfunsports.com',
      lang: undefined,
    })
  })

  it('parses iframe competition url', () => {
    expect(
      parseMaxFunSportsUrl('https://b2run-iframe.maxfunsports.com/event/competition?id=4220&lang=de'),
    ).toEqual({
      competitionId: '4220',
      pageUrl: 'https://b2run-iframe.maxfunsports.com/event/competition?id=4220&lang=de',
      fetchBasePath: '/event/competition',
      origin: 'https://b2run-iframe.maxfunsports.com',
      lang: 'de',
    })
  })
})

describe('buildMaxFunSportsSearchUrl', () => {
  it('builds last name filter url', () => {
    const url = buildMaxFunSportsSearchUrl(wwwParts, 'Graumann')
    expect(url).toContain('ResultSearch%5Blast_name%5D=Graumann')
    expect(url).toContain('id=4220')
  })

  it('builds www summary url for totals regardless of iframe origin', () => {
    expect(buildMaxFunSportsWwwSummaryUrl('4220')).toBe(
      'https://www.maxfunsports.com/result/competition?id=4220&page=1&per-page=50',
    )
  })
})

describe('parseMaxFunSportsResultRows', () => {
  it('parses www results table', () => {
    const rows = parseMaxFunSportsResultRows(wwwFixture)
    expect(rows[0]).toEqual({
      position: 2857,
      firstName: 'Bernd',
      lastName: 'Graumann',
      time: '00:29:11.0',
    })
  })

  it('parses iframe results table with net time column', () => {
    const rows = parseMaxFunSportsResultRows(iframeFixture)
    expect(rows[0]?.time).toBe('00:29:11.0')
    expect(rows[0]?.lastName).toBe('Graumann')
  })
})

describe('parseMaxFunSportsSummaryTotal', () => {
  it('parses german thousands separator', () => {
    expect(parseMaxFunSportsSummaryTotal('von <b>12.828</b> Einträgen')).toBe(12828)
    expect(parseMaxFunSportsSummaryTotal(wwwFixture)).toBe(1)
  })
})

describe('buildMaxFunSportsSearchTerm', () => {
  it('prefers last name', () => {
    expect(buildMaxFunSportsSearchTerm({ resultFirstName: 'Bernd', resultLastName: 'Graumann' })).toBe(
      'Graumann',
    )
  })
})

describe('resultsPlatformLabel', () => {
  it('formats maxfunsports as MaxFunSports', () => {
    expect(resultsPlatformLabel('maxfunsports')).toBe('MaxFunSports')
  })
})
