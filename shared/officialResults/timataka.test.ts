import { describe, expect, it } from 'vitest'
import fixture from './fixtures/timataka-iceland-volcano-half.html?raw'
import { detectPlatformFromUrl } from './detectPlatform'
import { matchesResultsProfile } from './matchName'
import { parseTimatakaUrl } from './parseUrls'
import { resultsPlatformLabel } from './types'
import {
  parseTimatakaResultRows,
  parseTimatakaTime,
  parseTimatakaTotalParticipants,
} from './timataka'

const resultsUrl =
  'https://timataka.net/iceland-volcano-marathon-2026/urslit/?race=2&cat=overall'

describe('detectPlatformFromUrl', () => {
  it('detects timataka from results url', () => {
    expect(detectPlatformFromUrl(resultsUrl)).toBe('timataka')
  })

  it('detects timataka.is hostnames', () => {
    expect(
      detectPlatformFromUrl('https://timataka.is/example-event/urslit/?race=1&cat=overall'),
    ).toBe('timataka')
  })
})

describe('parseTimatakaUrl', () => {
  it('parses race and category params', () => {
    expect(parseTimatakaUrl(resultsUrl)).toEqual({
      pageUrl: resultsUrl,
      race: '2',
      category: 'overall',
    })
  })
})

describe('parseTimatakaTime', () => {
  it('normalizes HH:MM:SS', () => {
    expect(parseTimatakaTime('3:44:13')).toBe('03:44:13')
    expect(parseTimatakaTime('03:44:13')).toBe('03:44:13')
  })
})

describe('parseTimatakaTotalParticipants', () => {
  it('reads finished count from stats header', () => {
    expect(parseTimatakaTotalParticipants(fixture)).toBe(41)
  })
})

describe('parseTimatakaResultRows', () => {
  it('parses overall results table', () => {
    const rows = parseTimatakaResultRows(fixture)
    expect(rows).toHaveLength(41)

    const joRain = rows.find((row) => row.fullName === 'Jo Rain Jardina')
    expect(joRain).toEqual({
      position: 34,
      bib: '310',
      fullName: 'Jo Rain Jardina',
      firstName: 'Jo',
      lastName: 'Rain Jardina',
      time: '03:44:13',
    })
  })
})

describe('matchesResultsProfile', () => {
  it('matches Jo Rain Jardina from issue #157', () => {
    const rows = parseTimatakaResultRows(fixture)
    const joRain = rows.find((row) => row.fullName === 'Jo Rain Jardina')
    expect(joRain).toBeDefined()

    expect(
      matchesResultsProfile(
        { resultFirstName: 'Jo Rain', resultLastName: 'Jardina' },
        joRain!.fullName,
      ),
    ).toBe(true)
  })
})

describe('resultsPlatformLabel', () => {
  it('formats timataka as Tímataka', () => {
    expect(resultsPlatformLabel('timataka')).toBe('Tímataka')
  })
})
