import { describe, expect, it } from 'vitest'
import compactFixture from './fixtures/parkrun-results-pdf-compact.txt?raw'
import detailedFixture from './fixtures/parkrun-results-pdf-detailed.txt?raw'
import {
  findParkrunPdfRows,
  isParkrunPdfText,
  parkrunPdfCandidates,
  parkrunPdfEventDateCandidates,
  parkrunPdfShape,
  parseParkrunPdfHeader,
} from './parkrunPdf'

const shapes = [
  ['compact', compactFixture],
  ['detailed', detailedFixture],
] as const

describe('isParkrunPdfText', () => {
  it.each(shapes)('recognizes the %s page', (_shape, fixture) => {
    expect(isParkrunPdfText(fixture)).toBe(true)
  })

  it('rejects another platform and a page without the event header', () => {
    expect(isParkrunPdfText('GESAMTWERTUNG\n1. 13765 Zé Ninguém 00:16:42.4 1 Kaufhaus')).toBe(false)
    expect(isParkrunPdfText('Beispielsee parkrun\nFinisher\n1 Zé NINGUÉM 20:19')).toBe(false)
  })
})

describe('parkrunPdfShape', () => {
  it('tells the two exports apart', () => {
    expect(parkrunPdfShape(compactFixture)).toBe('compact')
    expect(parkrunPdfShape(detailedFixture)).toBe('detailed')
  })
})

describe('parseParkrunPdfHeader', () => {
  it.each(shapes)('reads name, day, event number and field size from the %s page', (_s, fixture) => {
    expect(parseParkrunPdfHeader(fixture)).toEqual({
      eventName: 'Beispielsee parkrun',
      eventDate: '8/29/26',
      eventNumber: 14,
      totalFinishers: 8,
    })
  })

  it('counts the field, not the volunteers', () => {
    // The page prints finishers first, volunteers second, labels underneath.
    expect(parseParkrunPdfHeader('X parkrun\n1/2/26 | #3\n41 9\nfinishers volunteers').totalFinishers).toBe(41)
  })
})

describe('parkrunPdfEventDateCandidates', () => {
  it('offers both readings, the page being formatted in the reader locale', () => {
    const dates = parkrunPdfEventDateCandidates({ eventDate: '8/9/26' })
    expect(dates.map((date) => [date.getMonth() + 1, date.getDate()])).toEqual([
      [8, 9],
      [9, 8],
    ])
  })

  it('keeps only the reading that exists', () => {
    const dates = parkrunPdfEventDateCandidates({ eventDate: '8/29/26' })
    expect(dates).toHaveLength(1)
    expect(dates[0]?.getMonth()).toBe(7)
    expect(dates[0]?.getDate()).toBe(29)
  })

  it('has nothing to offer without a printed day', () => {
    expect(parkrunPdfEventDateCandidates({})).toEqual([])
  })
})

describe('findParkrunPdfRows', () => {
  it.each(shapes)('finds one runner in the %s page', (_shape, fixture) => {
    expect(findParkrunPdfRows(fixture, { resultFirstName: 'Bernd', resultLastName: 'Graumann' })).toEqual(
      [{ position: 2, name: 'Bernd GRAUMANN', time: '00:21:46' }],
    )
  })

  it.each(shapes)('pads a time printed without hours, in the %s page', (_shape, fixture) => {
    const rows = findParkrunPdfRows(fixture, { resultLastName: 'Ninguém' })
    expect(rows[0]).toMatchObject({ position: 1, time: '00:20:19' })
  })

  it.each(shapes)('keeps an hour the page did print, in the %s page', (_shape, fixture) => {
    const rows = findParkrunPdfRows(fixture, { resultLastName: 'Beispiel-Hofer' })
    expect(rows[0]).toMatchObject({ position: 8, time: '01:14:03' })
  })

  it.each(shapes)('never reads a personal best as the time, in the %s page', (_shape, fixture) => {
    // Elliot ran 23:26 today and has a 22:23 best printed alongside.
    expect(findParkrunPdfRows(fixture, { resultFirstName: 'Elliot' })[0]).toMatchObject({
      position: 3,
      time: '00:23:26',
    })
    // Bernd M has a 58:34 best next to today's 1:02:10.
    expect(findParkrunPdfRows(fixture, { resultLastName: 'Beispiel' })[0]).toMatchObject({
      position: 6,
      time: '01:02:10',
    })
  })

  it.each(shapes)('returns both runners of a shared surname, in the %s page', (_shape, fixture) => {
    const rows = findParkrunPdfRows(fixture, { resultLastName: 'Mustermann' })
    expect(rows.map((row) => [row.position, row.time])).toEqual([
      [3, '00:23:26'],
      [4, '00:23:26'],
    ])
  })

  it.each(shapes)('never mistakes a parkrun count for a position, in the %s page', (_s, fixture) => {
    // Bernd M has 223 parkruns behind him in a field of 8.
    const rows = findParkrunPdfRows(fixture, { resultLastName: 'Beispiel' })
    expect(rows.every((row) => row.position <= 8)).toBe(true)
  })

  it.each(shapes)('ignores the average time in the footer, in the %s page', (_shape, fixture) => {
    expect(findParkrunPdfRows(fixture, { resultLastName: 'Zielzeit' })).toEqual([])
  })

  it.each(shapes)('returns nothing for a runner who was not there, in the %s page', (_s, fixture) => {
    expect(findParkrunPdfRows(fixture, { resultLastName: 'Nieminen' })).toEqual([])
  })

  it.each(shapes)('needs a name to look for, in the %s page', (_shape, fixture) => {
    expect(findParkrunPdfRows(fixture, {})).toEqual([])
  })

  it('never builds a row from a club name', () => {
    // A club reads exactly like a person, and sits one line from a real row, so
    // a match here used to borrow the next runner's time and position.
    expect(findParkrunPdfRows(detailedFixture, { resultLastName: 'Verein' })).toEqual([])
    expect(findParkrunPdfRows(detailedFixture, { resultLastName: 'Laufteam' })).toEqual([])
  })

  it('finds a runner who withheld their family name', () => {
    const profile = { resultFirstName: 'Jonas', resultLastName: 'Silva' }
    expect(findParkrunPdfRows(compactFixture, profile)).toEqual([
      { position: 5, name: 'Jonas S', time: '00:25:41' },
    ])
    expect(findParkrunPdfRows(detailedFixture, profile)).toEqual([
      { position: 5, name: 'Jonas S', time: '00:25:41' },
    ])
  })

  it('never reads a statistics line as a row', () => {
    // `8 3 Teilnahmen | Weiblich 3/3 | 1:14:03` has a number in front and a time
    // at the end, which is a row's shape exactly.
    expect(findParkrunPdfRows(detailedFixture, { resultLastName: 'Teilnahmen' })).toEqual([])
    expect(findParkrunPdfRows(detailedFixture, { resultLastName: 'Weiblich' })).toEqual([])
  })

  it('leaves out an unknown finisher, who has no time printed', () => {
    expect(findParkrunPdfRows(compactFixture, { resultLastName: 'Unbekannt' })).toEqual([])
  })
})

describe('parkrunPdfCandidates', () => {
  it.each(shapes)('carries the field size onto the candidate, from the %s page', (_s, fixture) => {
    expect(parkrunPdfCandidates(fixture, { resultLastName: 'Graumann' }, 'saved.pdf')).toEqual([
      {
        platform: 'parkrun',
        matchedName: 'Bernd GRAUMANN',
        time: '00:21:46',
        position: 2,
        totalParticipants: 8,
        sourceUrl: 'saved.pdf',
        confidence: 'high',
      },
    ])
  })

  it('matches an alias the runner registered under', () => {
    const candidates = parkrunPdfCandidates(
      compactFixture,
      { resultFirstName: 'José', resultLastName: 'Silva', resultNameAliases: ['Zé Ninguém'] },
      'saved.pdf',
    )
    expect(candidates.map((candidate) => candidate.matchedName)).toEqual(['Zé NINGUÉM'])
  })
})
