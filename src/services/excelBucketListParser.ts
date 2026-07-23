import type { WorkBook } from 'xlsx'
import type { BucketListItemCreate } from '../types/BucketListItem'
import { deriveEventTypeFromName } from '../utils/deriveEventTypeFromName'
import { parseDisciplinesCell } from '../utils/bucketListDisciplines'
import { IMPORT_SKIP_REASONS } from '../types/importSkipReasons'
import type { XlsxModule } from './xlsxLoader'
import { loadXlsx } from './xlsxLoader'

export type ParsedBucketListRow = {
  item: BucketListItemCreate
  sheet: string
  row: number
}

export type SkippedBucketListRow = {
  sheet: string
  row: number
  reason: string
  raw: string
}

export type ParseBucketListResult = {
  items: ParsedBucketListRow[]
  skipped: SkippedBucketListRow[]
}

type ColumnMap = {
  event?: number
  location?: number
  approxDates?: number
  link?: number
  disciplines?: number
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function rowPreview(row: unknown[]): string {
  return row.map((cell) => cellText(cell)).filter(Boolean).join(' | ').slice(0, 120)
}

function findBucketListSheetName(workbook: WorkBook): string | null {
  for (const sheetName of workbook.SheetNames) {
    if (sheetName.trim().toLowerCase().includes('bucket')) {
      return sheetName
    }
  }
  return null
}

function detectColumns(headerRow: unknown[]): ColumnMap {
  const map: ColumnMap = {}

  headerRow.forEach((cell, index) => {
    const header = cellText(cell)
    if (!header) return

    const normalized = header.toLowerCase()
    if (header === 'Event') map.event = index
    else if (header === 'Location') map.location = index
    else if (header === 'Approx. Dates') map.approxDates = index
    else if (header === 'Link') map.link = index
    else if (normalized === 'disciplines' || normalized === 'disciplinas') map.disciplines = index
  })

  return map
}

function buildItemFromRow(row: unknown[], columns: ColumnMap): BucketListItemCreate | null {
  const name = cellText(row[columns.event ?? -1])
  if (!name) return null

  const location = cellText(row[columns.location ?? -1])
  const targetMonth = cellText(row[columns.approxDates ?? -1]) || undefined
  const link = cellText(row[columns.link ?? -1]) || undefined
  const { eventType, realDistance } = deriveEventTypeFromName(name)
  const parsedDisciplines =
    columns.disciplines !== undefined
      ? parseDisciplinesCell(row[columns.disciplines])
      : null

  return {
    name,
    location,
    realDistance,
    disciplines: parsedDisciplines ?? [eventType],
    targetMonth,
    link,
  }
}

export function parseBucketListFromWorkbook(
  workbook: WorkBook,
  XLSX: XlsxModule,
): ParseBucketListResult {
  const items: ParsedBucketListRow[] = []
  const skipped: SkippedBucketListRow[] = []

  const sheetName = findBucketListSheetName(workbook)
  if (!sheetName) {
    return { items, skipped }
  }

  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })
  const headerRowIndex = rows.findIndex((row) =>
    row.some((cell) => cellText(cell) === 'Event'),
  )

  if (headerRowIndex === -1) {
    return { items, skipped }
  }

  const columns = detectColumns(rows[headerRowIndex] ?? [])
  if (columns.event === undefined) {
    return { items, skipped }
  }

  for (let rowIndex = headerRowIndex + 1; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex]
    if (!row || row.every((cell) => cellText(cell) === '')) continue

    const item = buildItemFromRow(row, columns)
    if (!item) {
      skipped.push({
        sheet: sheetName,
        row: rowIndex + 1,
        reason: IMPORT_SKIP_REASONS.MISSING_EVENT_NAME,
        raw: rowPreview(row),
      })
      continue
    }

    items.push({ item, sheet: sheetName, row: rowIndex + 1 })
  }

  return { items, skipped }
}

export async function parseBucketListWorkbook(buffer: ArrayBuffer): Promise<ParseBucketListResult> {
  const XLSX = await loadXlsx()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false })
  return parseBucketListFromWorkbook(workbook, XLSX)
}
