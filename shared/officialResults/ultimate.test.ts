import { describe, expect, it } from 'vitest'
import searchFixture from './fixtures/ultimate-cph-half-search-neves-sample.txt?raw'
import participantFixture from './fixtures/ultimate-cph-half-participant-21800-sample.txt?raw'
import resultsStatusFixture from './fixtures/ultimate-cph-half-results-status-sample.txt?raw'
import { detectPlatformFromUrl } from './detectPlatform'
import { parseUltimateUrl } from './parseUrls'
import {
  buildUltimateParticipantInfoUrl,
  buildUltimateResultsUrl,
  buildUltimateSearchUrl,
  parseUltimateParticipantCount,
  parseUltimateParticipantRanking,
  parseUltimateSearchRows,
  parseUltimateTime,
} from './ultimate'
import { buildUltimateSearchTerms } from './ultimateSearch'
import { matchesResultsProfile } from './matchName'
import { resultsPlatformLabel } from './types'

const cphHalfUrl = 'https://live.ultimate.dk/desktop/front/index.php?eventid=6736'
const cphHalfResultsUrl =
  'https://live.ultimate.dk/desktop/front/data.php?eventid=6736&mode=results&distance=1&category=&language=us'

describe('detectPlatformFromUrl', () => {
  it('detects ultimate from event url', () => {
    expect(detectPlatformFromUrl(cphHalfUrl)).toBe('ultimate')
  })

  it('detects ultimate from data url', () => {
    expect(detectPlatformFromUrl(cphHalfResultsUrl)).toBe('ultimate')
  })
})

describe('parseUltimateUrl', () => {
  it('extracts event id from index url', () => {
    expect(parseUltimateUrl(cphHalfUrl)).toEqual({
      eventId: '6736',
      pageUrl: cphHalfUrl,
      origin: 'https://live.ultimate.dk',
      language: 'us',
      distance: undefined,
      category: undefined,
    })
  })

  it('preserves distance and language from data url', () => {
    expect(parseUltimateUrl(cphHalfResultsUrl)).toEqual({
      eventId: '6736',
      pageUrl: cphHalfUrl,
      origin: 'https://live.ultimate.dk',
      language: 'us',
      distance: '1',
      category: undefined,
    })
  })

  it('rejects unrelated urls', () => {
    expect(parseUltimateUrl('https://live.ultimate.dk/desktop/front/index.php')).toBeNull()
  })
})

describe('parseUltimateTime', () => {
  it('normalizes h:mm:ss', () => {
    expect(parseUltimateTime('2:12:03')).toBe('02:12:03')
  })
})

describe('parseUltimateParticipantCount', () => {
  it('reads finisher count from results status', () => {
    expect(parseUltimateParticipantCount(resultsStatusFixture)).toBe(31644)
  })
})

describe('parseUltimateSearchRows', () => {
  it('parses search result row', () => {
    const rows = parseUltimateSearchRows(searchFixture)
    expect(rows).toEqual([
      {
        participantId: 21861,
        bib: '21861',
        name: 'Inga-Lill Strand',
        firstName: 'Inga-Lill',
        lastName: 'Strand',
        time: '02:57:15',
      },
    ])
  })

  it('matches inga strand from fixture', () => {
    const rows = parseUltimateSearchRows(searchFixture)
    const profile = { resultFirstName: 'Inga', resultLastName: 'Strand' }
    const match = rows.find((row) => matchesResultsProfile(profile, row.name))
    expect(match?.time).toBe('02:57:15')
  })
})

describe('parseUltimateParticipantRanking', () => {
  it('reads overall rank and net time from participant info', () => {
    expect(parseUltimateParticipantRanking(participantFixture)).toEqual({
      position: 31426,
      totalParticipants: 31935,
      time: '02:57:15',
    })
  })
})

describe('buildUltimateParticipantInfoUrl', () => {
  it('builds participant info url', () => {
    const parts = parseUltimateUrl(cphHalfUrl)!
    expect(buildUltimateParticipantInfoUrl(parts, 21861)).toBe(
      'https://live.ultimate.dk/desktop/front/data.php?eventid=6736&mode=participantinfo&pid=21861&language=us',
    )
  })
})

describe('buildUltimateSearchUrl', () => {
  it('builds quick search url', () => {
    const parts = parseUltimateUrl(cphHalfUrl)!
    expect(buildUltimateSearchUrl(parts, 'neves')).toBe(
      'https://live.ultimate.dk/desktop/front/data.php?eventid=6736&mode=search&searchmode=quick&search_quick=neves&language=us&search_bib=&search_firstname=&search_lastname=&search_club=&search_city=&search_nation=&search_distance=&search_category=&search_time=Finish&search_sortby=%5BTIMEFIELD%5D&search_sorttype=ASC',
    )
  })
})

describe('buildUltimateResultsUrl', () => {
  it('builds results listing url when distance is known', () => {
    const parts = parseUltimateUrl(cphHalfResultsUrl)!
    expect(buildUltimateResultsUrl(parts)).toBe(
      'https://live.ultimate.dk/desktop/front/data.php?eventid=6736&mode=results&distance=1&category=&language=us',
    )
  })

  it('returns null without distance', () => {
    const parts = parseUltimateUrl(cphHalfUrl)!
    expect(buildUltimateResultsUrl(parts)).toBeNull()
  })
})

describe('buildUltimateSearchTerms', () => {
  it('uses last name, full name, and aliases', () => {
    expect(
      buildUltimateSearchTerms({
        resultFirstName: 'Inga',
        resultLastName: 'Strand',
        resultNameAliases: ['Inga-Lill Strand'],
      }),
    ).toEqual(['Strand', 'Inga Strand', 'Inga-Lill Strand'])
  })
})

describe('resultsPlatformLabel', () => {
  it('formats ultimate as Ultimate Sport Service', () => {
    expect(resultsPlatformLabel('ultimate')).toBe('Ultimate Sport Service')
  })
})
