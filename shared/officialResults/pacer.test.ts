import { describe, expect, it } from 'vitest'
import fixture from './fixtures/pacer-half-marathon-snippet.json'
import { detectPlatformFromUrl } from './detectPlatform'
import { matchesResultsProfile } from './matchName'
import {
  buildPacerSearchName,
  formatPacerTime,
  pacerFinishTimeMs,
  pacerOverallPreference,
  parsePacerUrl,
  rankPacerResults,
  type PacerResultsPayload,
} from './pacer'
import { resultsPlatformLabel } from './types'

const resultsUrl =
  'https://results.poweredbypacer.com/results/2fe02f95-2bd3-4391-8a0d-0642ccd38605/8a5d306d-e76f-4b21-b5a8-950e5b2b11cb'
const payload = fixture as PacerResultsPayload

describe('detectPlatformFromUrl', () => {
  it('detects a pacer results page', () => {
    expect(detectPlatformFromUrl(resultsUrl)).toBe('pacer')
  })

  it('detects the page a runner copies from an open athlete panel', () => {
    expect(detectPlatformFromUrl(`${resultsUrl}?athleteId=193442c4-fecd-4076-bbc6-429b02795cf7`)).toBe(
      'pacer',
    )
  })

  it('claims nothing for other pages on the host', () => {
    expect(detectPlatformFromUrl('https://results.poweredbypacer.com/about')).toBeNull()
  })
})

describe('parsePacerUrl', () => {
  it('builds the public results endpoint from the two ids', () => {
    expect(parsePacerUrl(resultsUrl)).toEqual({
      eventId: '2fe02f95-2bd3-4391-8a0d-0642ccd38605',
      raceId: '8a5d306d-e76f-4b21-b5a8-950e5b2b11cb',
      pageUrl: resultsUrl,
      origin: 'https://results.poweredbypacer.com',
      apiUrl:
        'https://results.poweredbypacer.com/api/public/events/2fe02f95-2bd3-4391-8a0d-0642ccd38605/races/8a5d306d-e76f-4b21-b5a8-950e5b2b11cb',
    })
  })

  it('rejects a url with no race', () => {
    expect(
      parsePacerUrl('https://results.poweredbypacer.com/results/2fe02f95-2bd3-4391-8a0d-0642ccd38605'),
    ).toBeNull()
  })
})

describe('formatPacerTime', () => {
  it('rounds a part second up, the way the results table does', () => {
    // 1:00:17.483 is published as 1:00:18, so truncating would be a second out.
    expect(formatPacerTime(3617483)).toBe('01:00:18')
    expect(formatPacerTime(3574000)).toBe('00:59:34')
  })
})

describe('pacerOverallPreference', () => {
  it('takes the clock the race says it ranks on', () => {
    expect(pacerOverallPreference(payload.race)).toBe('gun')
  })

  it('falls back to the chip when the race says nothing', () => {
    expect(pacerOverallPreference({})).toBe('chip')
  })
})

describe('rankPacerResults', () => {
  const ranked = rankPacerResults(payload)

  it('orders the field on the race’s own clock', () => {
    // Rita beats Quim on the chip and ties him on the gun, and this race ranks
    // on the gun, so the tie decides it rather than her faster chip time.
    expect(ranked.map((result) => result.name)).toEqual([
      'Zé Ninguém',
      'Zita Ninguém',
      'Quim Fulano',
      'Rita Fulana',
    ])
    expect(ranked.map((result) => result.position)).toEqual([1, 2, 3, 4])
  })

  it('leaves out a finisher the gun ranking cannot place', () => {
    expect(ranked.some((result) => result.name === 'Beltrano Sem-Arma')).toBe(false)
    expect(ranked).toHaveLength(4)
  })

  it('ranks on the chip when that is what the race prefers', () => {
    const onChip = rankPacerResults({
      ...payload,
      race: { ...payload.race, overallTimingPreference: 'chip' },
    })
    expect(onChip.map((result) => result.name)).toEqual([
      'Zé Ninguém',
      'Zita Ninguém',
      'Beltrano Sem-Arma',
      'Rita Fulana',
      'Quim Fulano',
    ])
  })
})

describe('pacerFinishTimeMs', () => {
  const quim = rankPacerResults(payload).find((result) => result.name === 'Quim Fulano')!

  it('records the chip time, which is what the page headlines', () => {
    expect(formatPacerTime(pacerFinishTimeMs(quim, payload.race))).toBe('02:21:24')
  })

  it('falls back to the gun when the race publishes no chip time', () => {
    expect(formatPacerTime(pacerFinishTimeMs(quim, { chipTimeDisplay: false }))).toBe('02:54:40')
  })
})

describe('matching a runner', () => {
  it('finds the profile in the ranked field', () => {
    const profile = { resultFirstName: 'Quim', resultLastName: 'Fulano' }
    const match = rankPacerResults(payload).find((result) =>
      matchesResultsProfile(profile, result.name),
    )

    expect(match?.position).toBe(3)
    expect(match?.bibNumber).toBe('3')
  })
})

describe('buildPacerSearchName', () => {
  it('joins the profile into the name the results carry', () => {
    expect(buildPacerSearchName({ resultFirstName: 'Quim', resultLastName: 'Fulano' })).toBe(
      'Quim Fulano',
    )
  })

  it('returns nothing without a name', () => {
    expect(buildPacerSearchName({})).toBeNull()
  })
})

describe('resultsPlatformLabel', () => {
  it('names the platform', () => {
    expect(resultsPlatformLabel('pacer')).toBe('Pacer')
  })
})
