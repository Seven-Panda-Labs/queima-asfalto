import { describe, expect, it } from 'vitest'
import fixture from './fixtures/strassenlauf-liferun-search.json'
import { detectPlatformFromUrl } from './detectPlatform'
import { parseStrassenlaufUrl } from './parseUrls'
import {
  buildStrassenlaufApiUrl,
  parseStrassenlaufApiParamsFromHtml,
  parseStrassenlaufApiResponse,
  parseStrassenlaufNameFromCell,
  parseStrassenlaufTime,
} from './strassenlauf'
import { buildStrassenlaufSearchTerm } from './strassenlaufSearch'
import { namesMatchFullName } from './matchName'
import { resultsPlatformLabel } from './types'

const lifeRunUrl = 'https://www.strassenlauf.org/va_ergebnisse.php?id=724&match=2'

const lifeRunParts = {
  eventId: '724',
  match: '2',
  cert: '1',
  pageUrl: lifeRunUrl,
  origin: 'https://www.strassenlauf.org',
}

describe('detectPlatformFromUrl', () => {
  it('detects strassenlauf from results url', () => {
    expect(detectPlatformFromUrl(lifeRunUrl)).toBe('strassenlauf')
  })
})

describe('parseStrassenlaufUrl', () => {
  it('extracts event and match ids', () => {
    expect(parseStrassenlaufUrl(lifeRunUrl)).toEqual(lifeRunParts)
  })

  it('accepts event id without match', () => {
    expect(parseStrassenlaufUrl('https://www.strassenlauf.org/va_ergebnisse.php?id=724')).toEqual({
      eventId: '724',
      match: undefined,
      cert: '1',
      pageUrl: 'https://www.strassenlauf.org/va_ergebnisse.php?id=724',
      origin: 'https://www.strassenlauf.org',
    })
  })

  it('rejects unrelated urls', () => {
    expect(parseStrassenlaufUrl('https://www.strassenlauf.org/index.php')).toBeNull()
  })
})

describe('buildStrassenlaufApiUrl', () => {
  it('builds datatables api endpoint with search term', () => {
    const url = buildStrassenlaufApiUrl(lifeRunParts, 'Friedrich')
    expect(url).toContain('/js/server_processing_res.php?')
    expect(url).toContain('id=724')
    expect(url).toContain('match=2')
    expect(url).toContain('cert=1')
    expect(url).toContain('search%5Bvalue%5D=Friedrich')
    expect(url).toContain('columns%5B2%5D%5Bsearchable%5D=true')
  })
})

describe('parseStrassenlaufApiParamsFromHtml', () => {
  it('extracts api params from results page', () => {
    const html = `"url": "/js/server_processing_res.php?id=724&match=2&cert=1"`
    expect(parseStrassenlaufApiParamsFromHtml(html)).toEqual({
      eventId: '724',
      match: '2',
      cert: '1',
    })
  })

  it('ignores overview match', () => {
    const html = `"url": "/js/server_processing_res.php?id=724&match=-1&cert=1"`
    expect(parseStrassenlaufApiParamsFromHtml(html)).toBeNull()
  })
})

describe('parseStrassenlaufTime', () => {
  it('normalizes hh:mm:ss times', () => {
    expect(parseStrassenlaufTime('00:27:48')).toBe('00:27:48')
    expect(parseStrassenlaufTime('1:02:03')).toBe('01:02:03')
  })
})

describe('parseStrassenlaufNameFromCell', () => {
  it('strips html from name cell', () => {
    expect(
      parseStrassenlaufNameFromCell(
        '<a href="/va_ergebnisse.php?id=724&amp;smemb=255324"><i class="fa fa-trophy"></i> Thorsten Friedrich</a>',
      ),
    ).toBe('Thorsten Friedrich')
  })
})

describe('parseStrassenlaufApiResponse', () => {
  it('parses rows from fixture', () => {
    const parsed = parseStrassenlaufApiResponse(fixture)
    expect(parsed?.recordsTotal).toBe(117)
    expect(parsed?.recordsFiltered).toBe(1)
    expect(parsed?.rows).toEqual([
      { position: 29, name: 'Thorsten Friedrich', time: '00:27:48' },
    ])
  })

  it('matches profile against parsed names', () => {
    const parsed = parseStrassenlaufApiResponse(fixture)
    const profile = { resultFirstName: 'Thorsten', resultLastName: 'Friedrich' }
    const match = parsed?.rows.find((row) => namesMatchFullName(profile, row.name))
    expect(match?.position).toBe(29)
    expect(match?.time).toBe('00:27:48')
  })
})

describe('buildStrassenlaufSearchTerm', () => {
  it('prefers last name', () => {
    expect(
      buildStrassenlaufSearchTerm({ resultFirstName: 'Thorsten', resultLastName: 'Friedrich' }),
    ).toBe('Friedrich')
  })
})

describe('resultsPlatformLabel', () => {
  it('formats strassenlauf as Strassenlauf.org', () => {
    expect(resultsPlatformLabel('strassenlauf')).toBe('Strassenlauf.org')
  })
})
