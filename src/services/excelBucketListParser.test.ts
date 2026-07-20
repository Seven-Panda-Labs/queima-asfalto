import * as XLSX from 'xlsx'
import { describe, expect, it } from 'vitest'
import { IMPORT_SKIP_REASONS } from '../types/importSkipReasons'
import {
  parseBucketListWorkbook,
} from './excelBucketListParser'

function workbookToBuffer(rows: unknown[][], sheetName: string): ArrayBuffer {
  const workbook = XLSX.utils.book_new()
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName)
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
}

describe('parseBucketListWorkbook', () => {
  it('parses bucket list sheet with trimmed headers', () => {
    const buffer = workbookToBuffer(
      [
        ['Event ', 'Location ', 'Approx. Dates', 'Link'],
        [
          'Berlin Marathon ',
          'Berlin, Germany ',
          'September',
          'https://www.bmw-berlin-marathon.com/',
        ],
      ],
      '🪣Bucket list ',
    )

    const { items, skipped } = parseBucketListWorkbook(buffer)
    expect(skipped).toHaveLength(0)
    expect(items).toHaveLength(1)
    expect(items[0].item.name).toBe('Berlin Marathon')
    expect(items[0].item.location).toBe('Berlin, Germany')
    expect(items[0].item.targetMonth).toBe('September')
    expect(items[0].item.link).toBe('https://www.bmw-berlin-marathon.com/')
    expect(items[0].item.disciplines).toEqual(['km_42_2'])
    expect(items[0].item.realDistance).toBe(42.2)
  })

  it('derives half marathon type from event name', () => {
    const buffer = workbookToBuffer(
      [
        ['Event', 'Location', 'Approx. Dates', 'Link'],
        ['Meia Maratona do Algarve', 'Quarteira, Portugal', 'October', 'https://example.com/'],
      ],
      'Bucket List',
    )

    const { items } = parseBucketListWorkbook(buffer)
    expect(items).toHaveLength(1)
    expect(items[0].item.disciplines).toEqual(['km_21_1'])
    expect(items[0].item.realDistance).toBe(21.1)
  })

  it('returns empty result when no bucket sheet exists', () => {
    const buffer = workbookToBuffer([['Event', 'Location']], 'Plano 2026')
    const { items, skipped } = parseBucketListWorkbook(buffer)
    expect(items).toHaveLength(0)
    expect(skipped).toHaveLength(0)
  })

  it('skips rows without event name', () => {
    const buffer = workbookToBuffer(
      [
        ['Event', 'Location', 'Approx. Dates', 'Link'],
        ['', 'Somewhere', 'June', 'https://example.com/'],
      ],
      'Bucket list',
    )

    const { items, skipped } = parseBucketListWorkbook(buffer)
    expect(items).toHaveLength(0)
    expect(skipped).toHaveLength(1)
    expect(skipped[0].reason).toBe(IMPORT_SKIP_REASONS.MISSING_EVENT_NAME)
  })

  it('parses seven reference-style bucket list rows', () => {
    const buffer = workbookToBuffer(
      [
        ['Event ', 'Location ', 'Approx. Dates', 'Link'],
        ['Spitsbergen Marathon ', 'Longyearbyen, Svalbard, Norway ', 'June', 'https://spitsbergenmarathon.no/'],
        ['Egyptian Marathon ', 'Luxor, Egypt ', 'January ', 'https://www.egyptianmarathon.com/'],
        ['Meia Maratona do Algarve ', 'Quarteira, Portugal ', 'October ', 'https://example.com/algarve'],
        ['X Millas del Guadiana', 'Ayamonte, Spain', 'November', 'http://www.10millasdelguadiana.com/'],
        ['Meia Maratona de Faro', 'Faro, Portugal', 'April', 'https://example.com/faro'],
        ['Iceland Volcano Marathon ', 'Iceland ', 'June', 'https://iceland-volcano-marathon.com'],
        ['Göteborgsvarvet', 'Gothenburg, Sweden ', 'May', 'https://www.goteborgsvarvet.se/en/'],
      ],
      '🪣Bucket list ',
    )

    const { items, skipped } = parseBucketListWorkbook(buffer)
    expect(skipped).toHaveLength(0)
    expect(items).toHaveLength(7)
    expect(items[0].item.name).toBe('Spitsbergen Marathon')
    expect(items[0].item.targetMonth).toBe('June')
    expect(items[0].item.disciplines).toEqual(['km_42_2'])
  })

  it('parses explicit disciplines column', () => {
    const buffer = workbookToBuffer(
      [
        ['Event', 'Location', 'Approx. Dates', 'Link', 'Disciplines'],
        ['Lisbon Race Weekend', 'Lisbon, Portugal', 'November', 'https://example.com/', 'km_5,km_10'],
      ],
      'Bucket list',
    )

    const { items } = parseBucketListWorkbook(buffer)
    expect(items).toHaveLength(1)
    expect(items[0].item.disciplines).toEqual(['km_5', 'km_10'])
  })
})
