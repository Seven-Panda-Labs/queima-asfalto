import { describe, expect, it } from 'vitest'
import dtFixture from './fixtures/vcrunning-valencia-half-2025-dt-sample.json'
import searchFixture from './fixtures/vcrunning-valencia-half-2025-search-neves-sample.html?raw'
import { detectPlatformFromUrl } from './detectPlatform'
import { parseVcRunningUrl } from './parseUrls'
import {
  buildVcRunningDtBody,
  buildVcRunningSearchBody,
  buildVcRunningSearchUrl,
  parseVcRunningName,
  parseVcRunningResultRows,
  parseVcRunningTime,
  parseVcRunningTotalParticipants,
} from './vcRunning'
import { buildVcRunningSearchTerm } from './vcRunningSearch'
import { namesMatch } from './matchName'
import { resultsPlatformLabel } from './types'

const valenciaHalfRankingUrl =
  'https://www.valenciaciudaddelrunning.com/en/half/2025-half-marathon-ranking/'
const valenciaHalfSearchUrl =
  'https://resultados.valenciaciudaddelrunning.com/en/medio-maraton-buscar.php?y=2025'
const valenciaMarathonRankingUrl =
  'https://www.valenciaciudaddelrunning.com/en/marathon/2024-marathon-ranking/'

describe('detectPlatformFromUrl', () => {
  it('detects vcrunning from marketing ranking url', () => {
    expect(detectPlatformFromUrl(valenciaHalfRankingUrl)).toBe('vcrunning')
  })

  it('detects vcrunning from resultados search url', () => {
    expect(detectPlatformFromUrl(valenciaHalfSearchUrl)).toBe('vcrunning')
  })

  it('detects vcrunning from marathon ranking url', () => {
    expect(detectPlatformFromUrl(valenciaMarathonRankingUrl)).toBe('vcrunning')
  })
})

describe('parseVcRunningUrl', () => {
  it('parses english half marathon ranking url', () => {
    expect(parseVcRunningUrl(valenciaHalfRankingUrl)).toEqual({
      locale: 'en',
      year: '2025',
      eventKey: 'medio-maraton',
      eventType: 'mm',
      origin: 'https://resultados.valenciaciudaddelrunning.com',
      pageUrl: 'https://resultados.valenciaciudaddelrunning.com/en/medio-maraton.php',
      searchUrl:
        'https://resultados.valenciaciudaddelrunning.com/en/medio-maraton-buscar.php?y=2025',
    })
  })

  it('parses spanish half marathon ranking url', () => {
    expect(
      parseVcRunningUrl('https://www.valenciaciudaddelrunning.com/medio/clasificaciones-medio-maraton-2025/'),
    ).toEqual({
      locale: '',
      year: '2025',
      eventKey: 'medio-maraton',
      eventType: 'mm',
      origin: 'https://resultados.valenciaciudaddelrunning.com',
      pageUrl: 'https://resultados.valenciaciudaddelrunning.com/medio-maraton.php',
      searchUrl: 'https://resultados.valenciaciudaddelrunning.com/medio-maraton-buscar.php?y=2025',
    })
  })

  it('parses marathon ranking url with year in path', () => {
    expect(parseVcRunningUrl(valenciaMarathonRankingUrl)).toEqual({
      locale: 'en',
      year: '2024',
      eventKey: 'maraton',
      eventType: 'm',
      origin: 'https://resultados.valenciaciudaddelrunning.com',
      pageUrl: 'https://resultados.valenciaciudaddelrunning.com/en/2024/maraton.php?y=2024',
      searchUrl: 'https://resultados.valenciaciudaddelrunning.com/en/2024/maraton-buscar.php?y=2024',
    })
  })

  it('uses fallback year for resultados overview without y param', () => {
    expect(
      parseVcRunningUrl('https://resultados.valenciaciudaddelrunning.com/en/medio-maraton.php', 2025),
    ).toEqual({
      locale: 'en',
      year: '2025',
      eventKey: 'medio-maraton',
      eventType: 'mm',
      origin: 'https://resultados.valenciaciudaddelrunning.com',
      pageUrl: 'https://resultados.valenciaciudaddelrunning.com/en/medio-maraton.php',
      searchUrl:
        'https://resultados.valenciaciudaddelrunning.com/en/medio-maraton-buscar.php?y=2025',
    })
  })

  it('rejects unrelated urls', () => {
    expect(parseVcRunningUrl('https://www.runczech.com/en/results/foo')).toBeNull()
  })
})

describe('parseVcRunningName', () => {
  it('parses last, first format', () => {
    expect(parseVcRunningName('Neves, Egidio')).toEqual({
      first: 'Egidio',
      last: 'Neves',
    })
  })
})

describe('parseVcRunningTime', () => {
  it('normalizes h:mm:ss', () => {
    expect(parseVcRunningTime('1:54:11')).toBe('01:54:11')
    expect(parseVcRunningTime('0:58:02')).toBe('00:58:02')
  })
})

describe('parseVcRunningResultRows', () => {
  it('parses search rows using real time when available', () => {
    const rows = parseVcRunningResultRows(searchFixture)
    const egidio = rows.find((row) => row.firstName === 'Egidio' && row.lastName === 'Neves')
    expect(egidio).toEqual({
      position: 13262,
      name: 'Neves, Egidio',
      firstName: 'Egidio',
      lastName: 'Neves',
      time: '01:54:11',
    })
  })

  it('matches egidio neves from fixture', () => {
    const rows = parseVcRunningResultRows(searchFixture)
    const profile = { resultFirstName: 'Egidio', resultLastName: 'Neves' }
    const match = rows.find((row) => namesMatch(profile, row.firstName, row.lastName))
    expect(match?.position).toBe(13262)
    expect(match?.time).toBe('01:54:11')
  })
})

describe('parseVcRunningTotalParticipants', () => {
  it('reads recordsTotal from dt-server-side payload', () => {
    expect(parseVcRunningTotalParticipants(dtFixture)).toBe(26063)
  })
})

describe('buildVcRunningSearchBody', () => {
  it('posts surname search fields', () => {
    expect(buildVcRunningSearchBody('Neves')).toBe('txtdorsal=&txtapellidos=Neves')
  })
})

describe('buildVcRunningDtBody', () => {
  it('includes year and event type', () => {
    expect(buildVcRunningDtBody('2025', 'mm')).toContain('y=2025')
    expect(buildVcRunningDtBody('2025', 'mm')).toContain('t=mm')
  })
})

describe('buildVcRunningSearchUrl', () => {
  it('builds localized search url', () => {
    const parts = parseVcRunningUrl(valenciaHalfRankingUrl)!
    expect(buildVcRunningSearchUrl(parts)).toBe(valenciaHalfSearchUrl)
  })
})

describe('buildVcRunningSearchTerm', () => {
  it('uses last name when available', () => {
    expect(buildVcRunningSearchTerm({ resultFirstName: 'Egidio', resultLastName: 'Neves' })).toBe(
      'Neves',
    )
  })
})

describe('resultsPlatformLabel', () => {
  it('formats vcrunning as VCRunning', () => {
    expect(resultsPlatformLabel('vcrunning')).toBe('VCRunning')
  })
})
