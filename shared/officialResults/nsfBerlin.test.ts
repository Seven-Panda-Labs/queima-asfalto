import { describe, expect, it } from 'vitest'
import resultsFixture from './fixtures/nsf-berlin-britzer-10km-sample.html?raw'
import results2024Fixture from './fixtures/nsf-berlin-britzer-2024-10km-sample.html?raw'
import streckeFixture from './fixtures/nsf-berlin-britzer-strecke-form.html?raw'
import { detectPlatformFromUrl } from './detectPlatform'
import { parseNsfBerlinUrl } from './parseUrls'
import {
  buildNsfBerlinResultsPostUrl,
  parseNsfBerlinResultRows,
  parseNsfBerlinStreckeOptions,
  parseNsfBerlinTime,
} from './nsfBerlin'
import { buildNsfBerlinSearchTerm } from './nsfBerlinSearch'
import { namesMatch } from './matchName'
import { resultsPlatformLabel } from './types'

const britzerUrl = 'https://www.nsf-la.de/britzer-garten-lauf/2025/ergebnisse/index.php'

describe('detectPlatformFromUrl', () => {
  it('detects nsfberlin from results url', () => {
    expect(detectPlatformFromUrl(britzerUrl)).toBe('nsfberlin')
  })
})

describe('parseNsfBerlinUrl', () => {
  it('extracts event path from results url', () => {
    expect(parseNsfBerlinUrl(britzerUrl)).toEqual({
      eventPath: '/britzer-garten-lauf/2025/ergebnisse',
      pageUrl: britzerUrl,
      origin: 'https://www.nsf-la.de',
      strecke: undefined,
    })
  })

  it('rejects unrelated urls', () => {
    expect(parseNsfBerlinUrl('https://www.nsf-la.de/britzer-garten-lauf/')).toBeNull()
  })
})

describe('buildNsfBerlinResultsPostUrl', () => {
  it('builds post endpoint for event results', () => {
    expect(
      buildNsfBerlinResultsPostUrl({
        origin: 'https://www.nsf-la.de',
        eventPath: '/britzer-garten-lauf/2025/ergebnisse',
      }),
    ).toBe(britzerUrl)
  })
})

describe('parseNsfBerlinTime', () => {
  it('parses minute and hour formats', () => {
    expect(parseNsfBerlinTime('59:58')).toBe('00:59:58')
    expect(parseNsfBerlinTime('1:00:01')).toBe('01:00:01')
  })
})

describe('parseNsfBerlinStreckeOptions', () => {
  it('parses distance options with participant counts', () => {
    expect(parseNsfBerlinStreckeOptions(streckeFixture)).toEqual([
      { value: '3 km', totalParticipants: 96 },
      { value: '10 km', totalParticipants: 388 },
    ])
  })
})

describe('parseNsfBerlinResultRows', () => {
  it('parses rows from results table', () => {
    const rows = parseNsfBerlinResultRows(resultsFixture)
    expect(rows).toHaveLength(3)
    expect(rows[1]).toEqual({
      position: 350,
      name: 'Suhr, Ruth',
      firstName: 'Ruth',
      lastName: 'Suhr',
      time: '01:01:43',
    })
  })

  it('matches profile against parsed names', () => {
    const rows = parseNsfBerlinResultRows(resultsFixture)
    const profile = { resultFirstName: 'Ruth', resultLastName: 'Suhr' }
    const match = rows.find((row) => namesMatch(profile, row.firstName, row.lastName))
    expect(match?.position).toBe(350)
    expect(match?.time).toBe('01:01:43')
  })

  it('parses 2024 rows without Nat column', () => {
    const rows = parseNsfBerlinResultRows(results2024Fixture)
    expect(rows).toEqual([
      {
        position: 374,
        name: 'Sedlag-Loy, Wilfried',
        firstName: 'Wilfried',
        lastName: 'Sedlag-Loy',
        time: '01:04:24',
      },
    ])
  })
})

describe('buildNsfBerlinSearchTerm', () => {
  it('prefers last name', () => {
    expect(
      buildNsfBerlinSearchTerm({ resultFirstName: 'Ruth', resultLastName: 'Suhr' }),
    ).toBe('Suhr')
  })
})

describe('resultsPlatformLabel', () => {
  it('formats nsfberlin as NSF Berlin', () => {
    expect(resultsPlatformLabel('nsfberlin')).toBe('NSF Berlin')
  })
})
