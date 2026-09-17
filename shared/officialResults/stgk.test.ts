import { describe, expect, it } from 'vitest'
import linksFixture from './fixtures/stgk-event-links.html?raw'
import pdfFixture from './fixtures/stgk-results-pdf.txt?raw'
import {
  parseStgkPdfRows,
  parseStgkResultLinks,
  parseStgkUrl,
  selectStgkOverallLinks,
  stgkPdfCandidates,
} from './stgk'
import { detectPlatformFromUrl } from './detectPlatform'
import { resultsPlatformLabel } from './types'

const ORIGIN = 'https://www.stgk.de'

describe('detectPlatformFromUrl', () => {
  it('detects stgk from the results page and from a ranking', () => {
    expect(detectPlatformFromUrl('https://www.stgk.de/ergebnisse.asp?Code=65&aktuell=1')).toBe('stgk')
    expect(detectPlatformFromUrl('https://www.stgk.de/Ergebnisse/2024/65/10km-gesamt.pdf')).toBe('stgk')
  })
})

describe('parseStgkUrl', () => {
  it('reads the event results page', () => {
    expect(parseStgkUrl('https://www.stgk.de/ergebnisse.asp?Code=65&aktuell=1')).toEqual({
      origin: ORIGIN,
      pageUrl: 'https://www.stgk.de/ergebnisse.asp?Code=65&aktuell=1',
      pdfUrl: undefined,
    })
  })

  it('reads a ranking pasted directly', () => {
    expect(parseStgkUrl('https://www.stgk.de/Ergebnisse/2024/65/10km-gesamt.pdf')?.pdfUrl).toBe(
      'https://www.stgk.de/Ergebnisse/2024/65/10km-gesamt.pdf',
    )
  })

  it('refuses another host and a page that is not results', () => {
    expect(parseStgkUrl('https://example.com/Ergebnisse/2024/65/10km-gesamt.pdf')).toBeNull()
    expect(parseStgkUrl('https://www.stgk.de/anmeldung.asp?Code=65')).toBeNull()
    expect(parseStgkUrl('not a url')).toBeNull()
  })
})

describe('parseStgkResultLinks', () => {
  const links = parseStgkResultLinks(linksFixture, ORIGIN)

  it('reads every ranking the page offers', () => {
    expect(links).toHaveLength(5)
  })

  it('separates the overall ranking from the age-class one', () => {
    expect(links.filter((link) => link.ranking === 'overall')).toHaveLength(3)
    expect(links.filter((link) => link.ranking === 'ageclass')).toHaveLength(2)
  })

  it('names the competition and the year', () => {
    expect(links[0]).toEqual({
      url: 'https://www.stgk.de/Ergebnisse/2024/65/2km-gesamt.pdf',
      competition: 'Nikolauslauf',
      ranking: 'overall',
      year: 2024,
    })
  })

  it('makes a relative link absolute', () => {
    expect(links.find((link) => link.url.endsWith('10km-gesamt.pdf'))?.url).toBe(
      'https://www.stgk.de/Ergebnisse/2024/65/10km-gesamt.pdf',
    )
  })

  it('ignores a link that is not a ranking', () => {
    expect(links.some((link) => /beispiel-lauftreff/.test(link.url))).toBe(false)
  })
})

describe('selectStgkOverallLinks', () => {
  const links = parseStgkResultLinks(linksFixture, ORIGIN)

  it('opens only the ranking the race is named after', () => {
    const chosen = selectStgkOverallLinks(links, '39. Flensburger Adventlauf')
    expect(chosen.map((link) => link.competition)).toEqual(['Adventlauf'])
  })

  it('falls back to every overall ranking when the name settles nothing', () => {
    expect(selectStgkOverallLinks(links, 'Winter 10k')).toHaveLength(3)
    expect(selectStgkOverallLinks(links)).toHaveLength(3)
  })

  it('never offers the age-class ranking', () => {
    expect(selectStgkOverallLinks(links, 'Winter 10k').every((l) => l.ranking === 'overall')).toBe(
      true,
    )
  })
})

describe('parseStgkPdfRows', () => {
  const rows = parseStgkPdfRows(pdfFixture)

  it('reads every row of both rankings', () => {
    expect(rows).toHaveLength(5)
  })

  it('reads the fields out of their tab order, the time being last', () => {
    expect(rows[0]).toEqual({
      position: 1,
      bib: '244',
      firstName: 'Ze',
      lastName: 'Ninguem',
      time: '00:34:20',
      ageClass: 'M-40',
      club: 'Laufen in Beispielstadt',
      fieldSize: 3,
    })
  })

  it('joins a row the club name pushed onto the next lines', () => {
    expect(rows[1]).toMatchObject({
      position: 2,
      lastName: 'Graumann',
      time: '00:34:48',
      club: 'FFG Beispiel Fahrzeugbau Gesellschaft mbH',
    })
  })

  it('reads a runner with no club, whose fields shift', () => {
    expect(rows[2]).toMatchObject({
      position: 3,
      lastName: 'Mustermann',
      firstName: 'Lukas',
      time: '00:38:14',
      ageClass: 'M-HK',
      club: undefined,
    })
  })

  it('ranks each block against itself, the file holding two', () => {
    // Men 1..3, then women 1..2, each numbered from one.
    expect(rows.map((row) => [row.position, row.fieldSize])).toEqual([
      [1, 3],
      [2, 3],
      [3, 3],
      [1, 2],
      [2, 2],
    ])
  })

  it('ignores the column header, the club address and the page footer', () => {
    expect(rows.every((row) => /^\d+$/.test(row.bib))).toBe(true)
  })
})

describe('stgkPdfCandidates', () => {
  it('reports the runner against their own ranking, not the document', () => {
    expect(
      stgkPdfCandidates(
        pdfFixture,
        { resultFirstName: 'Janine', resultLastName: 'Mustermann' },
        'https://www.stgk.de/Ergebnisse/2024/65/10km-gesamt.pdf',
      ),
    ).toEqual([
      {
        platform: 'stgk',
        matchedName: 'Janine Mustermann',
        time: '01:00:28',
        position: 2,
        totalParticipants: 2,
        sourceUrl: 'https://www.stgk.de/Ergebnisse/2024/65/10km-gesamt.pdf',
        confidence: 'high',
      },
    ])
  })

  it('returns nothing for a runner who was not there', () => {
    expect(stgkPdfCandidates(pdfFixture, { resultLastName: 'Nieminen' }, 'url')).toEqual([])
  })
})

describe('resultsPlatformLabel', () => {
  it('formats stgk as STGK', () => {
    expect(resultsPlatformLabel('stgk')).toBe('STGK')
  })
})
