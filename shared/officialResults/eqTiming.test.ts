import { describe, expect, it } from 'vitest'
import searchItem from './fixtures/eqtiming-midnight-sun-search-item.json'
import csvFixture from './fixtures/eqtiming-midnight-sun-report220-sample.csv?raw'
import { detectPlatformFromUrl } from './detectPlatform'
import { parseEqTimingUrl } from './parseUrls'
import {
  buildEqTimingReportUrl,
  buildEqTimingSearchUrl,
  countEqTimingCategoryFinishers,
  countEqTimingStageFinishers,
  parseEqTimingCsv,
  parseEqTimingHash,
  parseEqTimingSearchItem,
  parseEqTimingSearchResponse,
  parseEqTimingTime,
} from './eqTiming'
import { buildEqTimingSearchTerm } from './eqTimingSearch'
import { namesMatch } from './matchName'
import { resultsPlatformLabel } from './types'

const eventUrl = 'https://live.eqtiming.com/62417#result:231574-0-1204621-1-1-'

describe('detectPlatformFromUrl', () => {
  it('detects eqtiming from live results url', () => {
    expect(detectPlatformFromUrl(eventUrl)).toBe('eqtiming')
  })
})

describe('parseEqTimingHash', () => {
  it('extracts etappe and station ids from hash', () => {
    expect(parseEqTimingHash('#result:231574-0-1204621-1-1-')).toEqual({
      etappeId: '231574',
      stationId: '1204621',
    })
  })
})

describe('parseEqTimingUrl', () => {
  it('extracts event and hash ids', () => {
    expect(parseEqTimingUrl(eventUrl)).toEqual({
      eventId: '62417',
      etappeId: '231574',
      stationId: '1204621',
      pageUrl: eventUrl,
      origin: 'https://live.eqtiming.com',
    })
  })

  it('accepts event url without hash', () => {
    expect(parseEqTimingUrl('https://live.eqtiming.com/62417')).toEqual({
      eventId: '62417',
      etappeId: undefined,
      stationId: undefined,
      pageUrl: 'https://live.eqtiming.com/62417',
      origin: 'https://live.eqtiming.com',
    })
  })
})

describe('buildEqTimingSearchUrl', () => {
  it('builds search endpoint', () => {
    expect(buildEqTimingSearchUrl('62417', 'neves')).toContain(
      '/api/Result/Search/62417?justTimeData=true',
    )
    expect(buildEqTimingSearchUrl('62417', 'neves')).toContain('query=neves')
  })
})

describe('buildEqTimingReportUrl', () => {
  it('builds csv report endpoint', () => {
    expect(buildEqTimingReportUrl('62417', 220)).toBe(
      'https://live.eqtiming.com/api//Report/220?eventId=62417',
    )
  })
})

describe('parseEqTimingTime', () => {
  it('parses hour and minute formats', () => {
    expect(parseEqTimingTime('2:05:09')).toBe('02:05:09')
    expect(parseEqTimingTime('54:43')).toBe('54:43:00')
  })
})

describe('parseEqTimingSearchItem', () => {
  it('parses athlete, stage, class, and time from search item', () => {
    expect(parseEqTimingSearchItem(searchItem)).toEqual({
      firstName: 'Dag',
      lastName: 'Nese',
      stage: 'Mizuno Halvmaraton',
      stageId: 231574,
      className: 'M 55-59',
      position: 443,
      classPosition: 11,
      time: '01:50:23',
    })
  })
})

describe('parseEqTimingSearchResponse', () => {
  it('parses items array', () => {
    const matches = parseEqTimingSearchResponse({ Items: [searchItem] })
    expect(matches).toHaveLength(1)
    expect(matches[0]?.lastName).toBe('Nese')
  })
})

describe('parseEqTimingCsv', () => {
  it('parses report 220 csv rows', () => {
    const rows = parseEqTimingCsv(csvFixture)
    expect(rows).toHaveLength(3)
    expect(rows[1]).toMatchObject({
      stage: 'Mizuno Halvmaraton',
      className: 'M 55-59',
      firstName: 'Dag',
      lastName: 'Nese',
      totalTime: '1:50:23',
    })
  })
})

describe('countEqTimingStageFinishers', () => {
  it('counts finishers in stage across classes', () => {
    const rows = parseEqTimingCsv(csvFixture)
    expect(countEqTimingStageFinishers(rows, 'Mizuno Halvmaraton')).toBe(2)
  })
})

describe('countEqTimingCategoryFinishers', () => {
  it('counts only finishers in stage and class', () => {
    const rows = parseEqTimingCsv(csvFixture)
    expect(countEqTimingCategoryFinishers(rows, 'Mizuno Halvmaraton', 'M 55-59')).toBe(2)
  })
})

describe('buildEqTimingSearchTerm', () => {
  it('prefers last name', () => {
    expect(
      buildEqTimingSearchTerm({ resultFirstName: 'Dag', resultLastName: 'Nese' }),
    ).toBe('Nese')
  })
})

describe('profile matching', () => {
  it('matches parsed search item against profile', () => {
    const match = parseEqTimingSearchItem(searchItem)!
    const profile = { resultFirstName: 'Dag', resultLastName: 'Nese' }
    expect(namesMatch(profile, match.firstName, match.lastName)).toBe(true)
  })
})

describe('resultsPlatformLabel', () => {
  it('formats eqtiming as EQ Timing', () => {
    expect(resultsPlatformLabel('eqtiming')).toBe('EQ Timing')
  })
})
