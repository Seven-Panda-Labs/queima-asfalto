import { describe, expect, it } from 'vitest'
import pageFixture from './fixtures/wiclax-aaalgarve-page-snippet.html?raw'
import claxFixture from './fixtures/wiclax-meia-faro-sample.clax?raw'
import { detectPlatformFromUrl } from './detectPlatform'
import { namesMatch } from './matchName'
import { parseWiclaxUrl } from './parseUrls'
import { resultsPlatformLabel } from './types'
import {
  buildWiclaxRankings,
  findWiclaxMatches,
  isWiclaxResultsPage,
  parseWiclaxClaxUrlFromHtml,
  parseWiclaxEngaged,
  parseWiclaxResults,
  parseWiclaxTime,
} from './wiclax'

const aaalgarveUrl =
  'https://www.crono.aaalgarve.org/classificacoes-em-direto?f=meia-maratona-agua-de-faro-25'
const claxUrl =
  'https://ftp.aaalgarve.org/wiclax/meia-maratona-agua-de-faro-25/meia-maratona-agua-de-faro-25.clax'

describe('detectPlatformFromUrl', () => {
  it('detects wiclax from live results page url', () => {
    expect(detectPlatformFromUrl(aaalgarveUrl)).toBe('wiclax')
  })

  it('detects wiclax from direct clax url', () => {
    expect(detectPlatformFromUrl(claxUrl)).toBe('wiclax')
  })
})

describe('parseWiclaxUrl', () => {
  it('parses live results page url', () => {
    expect(parseWiclaxUrl(aaalgarveUrl)).toEqual({
      pageUrl: aaalgarveUrl,
    })
  })

  it('parses direct clax url', () => {
    expect(parseWiclaxUrl(claxUrl)).toEqual({
      pageUrl: claxUrl,
      claxUrl,
    })
  })
})

describe('parseWiclaxClaxUrlFromHtml', () => {
  it('reads URLEpr from page html', () => {
    expect(parseWiclaxClaxUrlFromHtml(pageFixture)).toBe(claxUrl)
  })

  it('detects powered by wiclax pages', () => {
    expect(isWiclaxResultsPage(pageFixture)).toBe(true)
  })
})

describe('parseWiclaxTime', () => {
  it('normalizes wiclax time format', () => {
    expect(parseWiclaxTime("02h01'42")).toBe('02:01:42')
  })
})

describe('parseWiclaxEngaged', () => {
  it('parses entrant names and courses', () => {
    const engaged = parseWiclaxEngaged(claxFixture)
    const rodrigo = engaged.find((entry) => entry.fullName === 'Rodrigo Gamito')
    expect(rodrigo).toEqual({
      bib: '290',
      fullName: 'Rodrigo Gamito',
      firstName: 'Rodrigo',
      lastName: 'Gamito',
      course: 'Meia Maratona',
    })
  })
})

describe('parseWiclaxResults', () => {
  it('parses finisher times by bib', () => {
    const results = parseWiclaxResults(claxFixture)
    expect(results.get('290')).toEqual({
      bib: '290',
      time: '02:01:42',
      timeSeconds: 7302,
    })
  })
})

describe('buildWiclaxRankings', () => {
  it('ranks finishers within each course', () => {
    const engaged = parseWiclaxEngaged(claxFixture)
    const results = parseWiclaxResults(claxFixture)
    const rankings = buildWiclaxRankings(engaged, results)

    expect(rankings.get('290')).toEqual({
      position: 3,
      totalParticipants: 4,
      course: 'Meia Maratona',
    })
    expect(rankings.get('292')).toBeUndefined()
  })
})

describe('findWiclaxMatches', () => {
  it('matches rodrigo gamito from fixture', () => {
    const profile = { resultFirstName: 'Rodrigo', resultLastName: 'Gamito' }
    const match = findWiclaxMatches(claxFixture).find((entry) =>
      namesMatch(profile, entry.engaged.firstName, entry.engaged.lastName),
    )

    expect(match?.result.time).toBe('02:01:42')
    expect(match?.ranking.position).toBe(3)
    expect(match?.ranking.totalParticipants).toBe(4)
  })
})

describe('resultsPlatformLabel', () => {
  it('formats wiclax as Wiclax', () => {
    expect(resultsPlatformLabel('wiclax')).toBe('Wiclax')
  })
})
