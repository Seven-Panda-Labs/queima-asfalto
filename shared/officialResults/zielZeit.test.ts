import { describe, expect, it } from 'vitest'
import fixture from './fixtures/zielzeit-plaenterwaldlauf-rows.txt?raw'
import { detectPlatformFromUrl } from './detectPlatform'
import { parseZielZeitUrl } from './parseUrls'
import {
  buildZielZeitPdfUrl,
  parseZielZeitGermanName,
  parseZielZeitPdfText,
  parseZielZeitResultLine,
  parseZielZeitTime,
  parseZielZeitTotalFromText,
} from './zielZeit'
import { namesMatch } from './matchName'
import { resultsPlatformLabel } from './types'

const pdfUrl = 'https://ziel-zeit.de/ergebnisse/5+km+Lauf_1_1727.PDF'

describe('detectPlatformFromUrl', () => {
  it('detects zielzeit from pdf results url', () => {
    expect(detectPlatformFromUrl(pdfUrl)).toBe('zielzeit')
  })

  it('detects zielzeit from www host', () => {
    expect(detectPlatformFromUrl('https://www.ziel-zeit.de/ergebnisse/10km_2_999.PDF')).toBe(
      'zielzeit',
    )
  })
})

describe('parseZielZeitUrl', () => {
  it('extracts pdf path from results url', () => {
    expect(parseZielZeitUrl(pdfUrl)).toEqual({
      pdfPath: '/ergebnisse/5+km+Lauf_1_1727.PDF',
      pageUrl: pdfUrl,
      origin: 'https://ziel-zeit.de',
    })
  })

  it('rejects non-pdf urls', () => {
    expect(parseZielZeitUrl('https://ziel-zeit.de/ergebnis.php')).toBeNull()
  })
})

describe('buildZielZeitPdfUrl', () => {
  it('builds absolute pdf url', () => {
    expect(
      buildZielZeitPdfUrl({
        origin: 'https://ziel-zeit.de',
        pdfPath: '/ergebnisse/5+km+Lauf_1_1727.PDF',
      }),
    ).toBe(pdfUrl)
  })
})

describe('parseZielZeitGermanName', () => {
  it('parses last-first format', () => {
    expect(parseZielZeitGermanName('Koal, Ingrid')).toEqual({
      first: 'Ingrid',
      last: 'Koal',
    })
  })
})

describe('parseZielZeitTime', () => {
  it('parses minute and hour formats', () => {
    expect(parseZielZeitTime('32:33')).toBe('00:32:33')
    expect(parseZielZeitTime('1:46:18')).toBe('01:46:18')
  })
})

describe('parseZielZeitResultLine', () => {
  it('parses a result row', () => {
    expect(
      parseZielZeitResultLine('119. 62 821 Koal, Ingrid W 45 5 Berlin 35:05 min (34:03)'),
    ).toEqual({
      position: 119,
      bib: 821,
      name: 'Koal, Ingrid',
      firstName: 'Ingrid',
      lastName: 'Koal',
      time: '00:34:03',
    })
  })

  it('parses rows without club', () => {
    expect(
      parseZielZeitResultLine('141. 62 1305 Strußenberg, Diana W 45 8 37:59 min (36:21)'),
    ).toMatchObject({
      position: 141,
      name: 'Strußenberg, Diana',
      time: '00:36:21',
    })
  })

  it('falls back to bruttozeit when nettozeit is missing', () => {
    expect(
      parseZielZeitResultLine('10. 10 1004 Akkaparambil, Sadique Ali M 35 4 Cycling Bats 19:05 min'),
    ).toMatchObject({
      time: '00:19:05',
    })
  })

  it('parses rows with multi-word clubs', () => {
    expect(
      parseZielZeitResultLine(
        '1. 1 1012 Hüttig, Felix M 20 1 Middle Distance Berlin 15:06 min (15:06)',
      ),
    ).toMatchObject({
      position: 1,
      name: 'Hüttig, Felix',
      time: '00:15:06',
    })
  })
})

describe('parseZielZeitPdfText', () => {
  it('parses rows from fixture', () => {
    const parsed = parseZielZeitPdfText(`${fixture}\n183 Finisher`)
    expect(parsed.rows).toHaveLength(183)
    expect(parsed.totalParticipants).toBe(183)

    const ingrid = parsed.rows.find((row) => row.firstName === 'Ingrid' && row.lastName === 'Koal')
    expect(ingrid).toMatchObject({
      position: 119,
      firstName: 'Ingrid',
      time: '00:34:03',
    })
  })

  it('matches profile against parsed names', () => {
    const parsed = parseZielZeitPdfText(fixture)
    const profile = { resultFirstName: 'Ingrid', resultLastName: 'Koal' }
    const match = parsed.rows.find((row) => namesMatch(profile, row.firstName, row.lastName))
    expect(match?.position).toBe(119)
    expect(match?.time).toBe('00:34:03')
  })
})

describe('parseZielZeitTotalFromText', () => {
  it('reads finisher count from footer', () => {
    expect(parseZielZeitTotalFromText('...\n183 Finisher\n')).toBe(183)
  })
})

describe('resultsPlatformLabel', () => {
  it('formats zielzeit as ZielZeit', () => {
    expect(resultsPlatformLabel('zielzeit')).toBe('ZielZeit')
  })
})
