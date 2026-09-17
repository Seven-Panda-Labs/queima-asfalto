import { describe, expect, it } from 'vitest'
import pdfFixture from './fixtures/maxfun-results-pdf.txt?raw'
import {
  isMaxFunSportsPdfText,
  maxFunSportsPdfCandidates,
  maxFunSportsPdfEventDate,
  maxFunSportsPdfTotal,
  parseMaxFunSportsPdfHeader,
  parseMaxFunSportsPdfRows,
  parseMaxFunSportsPdfText,
} from './maxFunSportsPdf'

describe('isMaxFunSportsPdfText', () => {
  it('recognizes the results table', () => {
    expect(isMaxFunSportsPdfText(pdfFixture)).toBe(true)
  })

  it('rejects a PDF that is not this table', () => {
    expect(isMaxFunSportsPdfText('Some other race\n1. 10 Bernd Graumann 00:29:11 1 Club')).toBe(
      false,
    )
    expect(isMaxFunSportsPdfText('GESAMTWERTUNG\nno rows here')).toBe(false)
  })
})

describe('parseMaxFunSportsPdfHeader', () => {
  it('reads date, event name and the preliminary flag', () => {
    expect(parseMaxFunSportsPdfHeader(pdfFixture)).toEqual({
      eventDate: '16.09.2026',
      eventName: 'B2Run Beispielstadt',
      preliminary: true,
    })
  })

  it('reports a final document as not preliminary', () => {
    expect(parseMaxFunSportsPdfHeader('01.05.2026\nB2Run Köln\nGESAMTWERTUNG').preliminary).toBe(
      false,
    )
  })
})

describe('maxFunSportsPdfEventDate', () => {
  it('turns the printed day into a date', () => {
    const date = maxFunSportsPdfEventDate(parseMaxFunSportsPdfHeader(pdfFixture))
    expect(date?.getFullYear()).toBe(2026)
    expect(date?.getMonth()).toBe(8)
    expect(date?.getDate()).toBe(16)
  })

  it('refuses a day that does not exist', () => {
    expect(maxFunSportsPdfEventDate({ eventDate: '31.02.2026', preliminary: false })).toBeNull()
    expect(maxFunSportsPdfEventDate({ preliminary: false })).toBeNull()
  })
})

describe('parseMaxFunSportsPdfRows', () => {
  const rows = parseMaxFunSportsPdfRows(pdfFixture)

  it('reads every row of the table', () => {
    expect(rows).toHaveLength(7)
  })

  it('reads a plain row and drops the printed tenths', () => {
    expect(rows[2]).toEqual({
      position: 3,
      bib: '1457',
      name: 'Bernd Graumann',
      time: '00:18:30',
      genderPosition: 3,
      company: 'Beispiel GmbH',
    })
  })

  it('splits a name long enough to run into the time column', () => {
    expect(rows[4]).toMatchObject({
      position: 5,
      name: 'Fulana Otília Tavares Mehanna',
      time: '00:21:50',
    })
  })

  it('keeps names the operator prints with digits or brackets', () => {
    expect(rows[3]?.name).toBe('Sabine (2) Mustermann')
    expect(rows[5]?.name).toBe('Km 17')
  })

  it('ignores the page markers a text extractor injects', () => {
    expect(rows.map((row) => row.position)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })
})

describe('maxFunSportsPdfTotal', () => {
  it('takes the field size from the last finisher, no total being printed', () => {
    expect(maxFunSportsPdfTotal(parseMaxFunSportsPdfRows(pdfFixture))).toBe(7)
  })

  it('has nothing to report for an empty table', () => {
    expect(maxFunSportsPdfTotal([])).toBeUndefined()
  })
})

describe('maxFunSportsPdfCandidates', () => {
  const document = parseMaxFunSportsPdfText(pdfFixture)

  it('returns the runner with the field size attached', () => {
    expect(
      maxFunSportsPdfCandidates(
        document,
        { resultFirstName: 'Bernd', resultLastName: 'Graumann' },
        'https://www.maxfunsports.com/result/competition?id=4220',
      ),
    ).toEqual([
      {
        platform: 'maxfunsports',
        matchedName: 'Bernd Graumann',
        time: '00:18:30',
        position: 3,
        totalParticipants: 7,
        sourceUrl: 'https://www.maxfunsports.com/result/competition?id=4220',
        confidence: 'high',
      },
    ])
  })

  it('matches on an alias the runner registered under', () => {
    const candidates = maxFunSportsPdfCandidates(
      document,
      { resultFirstName: 'José', resultLastName: 'Silva', resultNameAliases: ['Zé Ninguém'] },
      'url',
    )
    expect(candidates.map((candidate) => candidate.matchedName)).toContain('Zé Ninguém')
  })

  it('returns nothing when the runner is not in the field', () => {
    expect(
      maxFunSportsPdfCandidates(document, { resultLastName: 'Nieminen' }, 'url'),
    ).toEqual([])
  })
})
