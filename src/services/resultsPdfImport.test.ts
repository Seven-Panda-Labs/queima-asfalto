import { describe, expect, it } from 'vitest'
import pdfFixture from '../../shared/officialResults/fixtures/maxfun-results-pdf.txt?raw'
import { MAX_RESULTS_PDF_BYTES } from '../constants/resultsPdf'
import { importResultsPdf, validateResultsPdfFile } from './resultsPdfImport'

function pdfFile(name = 'result-pdf.pdf', size = 1024): File {
  const file = new File(['%PDF-1.4'], name, { type: 'application/pdf' })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

const eventDay = new Date(2026, 8, 16)
const readFixture = async () => pdfFixture

describe('validateResultsPdfFile', () => {
  it('accepts a PDF', () => {
    expect(validateResultsPdfFile(pdfFile())).toBeNull()
  })

  it('accepts a PDF the browser gave no type', () => {
    const file = new File(['%PDF'], 'result.pdf', { type: '' })
    Object.defineProperty(file, 'size', { value: 10 })
    expect(validateResultsPdfFile(file)).toBeNull()
  })

  it('refuses anything else, and an empty file', () => {
    const csv = new File(['a,b'], 'splits.csv', { type: 'text/csv' })
    Object.defineProperty(csv, 'size', { value: 10 })
    expect(validateResultsPdfFile(csv)).toBe('unsupported_type')
    expect(validateResultsPdfFile(pdfFile('result.pdf', 0))).toBe('unsupported_type')
  })

  it('refuses a file past the size limit', () => {
    expect(validateResultsPdfFile(pdfFile('result.pdf', MAX_RESULTS_PDF_BYTES + 1))).toBe(
      'file_too_large',
    )
  })
})

describe('importResultsPdf', () => {
  it('finds the runner and carries the field size', async () => {
    const outcome = await importResultsPdf(
      pdfFile(),
      { date: eventDay, resultsUrl: 'https://www.maxfunsports.com/result/competition?id=4220' },
      { resultFirstName: 'Bernd', resultLastName: 'Graumann' },
      readFixture,
    )

    expect(outcome).toEqual({
      ok: true,
      result: {
        candidates: [
          {
            platform: 'maxfunsports',
            matchedName: 'Bernd Graumann',
            time: '00:18:30',
            position: 3,
            totalParticipants: 7,
            sourceUrl: 'https://www.maxfunsports.com/result/competition?id=4220',
            confidence: 'high',
          },
        ],
        truncated: false,
        eventName: 'B2Run Beispielstadt',
        preliminary: true,
      },
    })
  })

  it('falls back to the file name when the event has no results link', async () => {
    const outcome = await importResultsPdf(
      pdfFile(),
      { date: eventDay },
      { resultLastName: 'Graumann' },
      readFixture,
    )
    expect(outcome.ok && outcome.result.candidates[0]?.sourceUrl).toBe('result-pdf.pdf')
  })

  it('refuses a PDF printed for another day', async () => {
    const outcome = await importResultsPdf(
      pdfFile(),
      { date: new Date(2026, 5, 2) },
      { resultLastName: 'Graumann' },
      readFixture,
    )
    expect(outcome).toEqual({ ok: false, code: 'wrong_event', pdfEventName: 'B2Run Beispielstadt' })
  })

  it('allows the day either side of the event', async () => {
    const outcome = await importResultsPdf(
      pdfFile(),
      { date: new Date(2026, 8, 17) },
      { resultLastName: 'Graumann' },
      readFixture,
    )
    expect(outcome.ok).toBe(true)
  })

  it('refuses a PDF that is not a results table', async () => {
    const outcome = await importResultsPdf(
      pdfFile(),
      { date: eventDay },
      { resultLastName: 'Graumann' },
      async () => 'An entry confirmation, not a ranking.',
    )
    expect(outcome).toEqual({ ok: false, code: 'not_a_results_pdf' })
  })

  it('reports a file it could not read', async () => {
    const outcome = await importResultsPdf(
      pdfFile(),
      { date: eventDay },
      { resultLastName: 'Graumann' },
      async () => {
        throw new Error('broken')
      },
    )
    expect(outcome).toEqual({ ok: false, code: 'unreadable' })
  })

  it('says so when the runner is not in the field', async () => {
    const outcome = await importResultsPdf(
      pdfFile(),
      { date: eventDay },
      { resultLastName: 'Nieminen' },
      readFixture,
    )
    expect(outcome).toEqual({ ok: false, code: 'name_not_found' })
  })

  it('needs a name to search for', async () => {
    const outcome = await importResultsPdf(pdfFile(), { date: eventDay }, {}, readFixture)
    expect(outcome).toEqual({ ok: false, code: 'name_not_found' })
  })
})
