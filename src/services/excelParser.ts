import * as XLSX from 'xlsx'
import type { EventCreate, EventStatus, EventType } from '../types/Event'
import { EVENT_STATUSES, EVENT_TYPES } from '../types/Event'
import { deriveEventType } from '../utils/eventValidation'
import {
  parseExcelDate,
  parseExcelPace,
  parseExcelTime,
} from '../utils/excelConverters'
import { IMPORT_SKIP_REASONS } from '../types/importSkipReasons'
import { calculatePace } from '../utils/pace'

export type ParsedRow = {
  event: EventCreate
  sheet: string
  row: number
}

export type SkippedRow = {
  sheet: string
  row: number
  reason: string
  raw: string
}

export type ParseWorkbookResult = {
  events: ParsedRow[]
  skipped: SkippedRow[]
}

const EXCEL_STATUS_MAP: Record<string, EventStatus> = {
  corrido: 'completed',
  perdido: 'missed',
  cancelado: 'cancelled',
  planeado: 'planned',
  marcado: 'confirmed',
  agendado: 'planned',
  confirmado: 'confirmed',
  concluído: 'completed',
  concluido: 'completed',
  faltou: 'missed',
  planned: 'planned',
  confirmed: 'confirmed',
  completed: 'completed',
  missed: 'missed',
  cancelled: 'cancelled',
}

const SKIP_NOTE_PATTERN = /parkruns\?|need\s+\d+k/i
const TEXT_DATE_PATTERN =
  /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|april)/i

const EXPORT_HEADERS = new Set([
  'data',
  'evento',
  'distância real (km)',
  'tipo de evento',
  'local',
  'estado',
  'tempo',
  'ritmo',
  'classificação',
  'notas',
])

type ColumnMap = {
  local?: number
  date?: number
  event?: number
  distance?: number
  status?: number
  time?: number
  pace?: number
  classification?: number
  notes?: number
  eventType?: number
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function rowPreview(row: unknown[]): string {
  return row.map((cell) => cellText(cell)).filter(Boolean).join(' | ').slice(0, 120)
}

function mapExcelStatus(value: unknown): EventStatus | null {
  const text = cellText(value).toLowerCase()
  if (!text) return null

  const mapped = EXCEL_STATUS_MAP[text]
  if (mapped) return mapped

  const direct = EVENT_STATUSES.find((status) => status.toLowerCase() === text)
  return direct ?? null
}

function parseDistance(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.round(value * 100) / 100
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/km/gi, '').replace(',', '.').trim()
    const distance = Number(normalized)
    if (!Number.isNaN(distance) && distance > 0) {
      return Math.round(distance * 100) / 100
    }
  }

  return null
}

function mapEventTypeFromExport(value: unknown): EventType | null {
  const text = cellText(value)
  const lower = text.toLowerCase()

  const EXCEL_TYPE_MAP: Record<string, EventType> = {
    '5km': 'km_5',
    '5 km': 'km_5',
    '10km': 'km_10',
    '10 km': 'km_10',
    '21.1km': 'km_21_1',
    '21,1km': 'km_21_1',
    'half marathon': 'km_21_1',
    'meia maratona': 'km_21_1',
    '42.2km': 'km_42_2',
    '42,2km': 'km_42_2',
    marathon: 'km_42_2',
    maratona: 'km_42_2',
    km_5: 'km_5',
    km_10: 'km_10',
    km_21_1: 'km_21_1',
    km_42_2: 'km_42_2',
  }

  if (EXCEL_TYPE_MAP[lower]) return EXCEL_TYPE_MAP[lower]
  if (EVENT_TYPES.includes(text as EventType)) return text as EventType
  return null
}

function detectColumns(headerRow: unknown[]): ColumnMap {
  const map: ColumnMap = {}

  headerRow.forEach((cell, index) => {
    const header = cellText(cell).toLowerCase()
    if (!header) return

    if (header === 'local') map.local = index
    else if (header === 'data') map.date = index
    else if (header === 'tipo de evento') map.eventType = index
    else if (header.includes('evento')) map.event = index
    else if (header.includes('distância real') || header.includes('distancia real')) {
      map.distance = index
    } else if (header.includes('distância') || header.includes('distancia')) {
      map.distance = index
    }     else if (header === 'estado') map.status = index
    else if (header.startsWith('tempo') || header === 'time') map.time = index
    else if (header.startsWith('ritmo') || header.includes('min/km')) {
      map.pace = index
    } else if (header.includes('classific')) map.classification = index
    else if (header === 'notas') map.notes = index
  })

  return map
}

function isExportHeaderRow(headerRow: unknown[]): boolean {
  const headers = headerRow.map((cell) => cellText(cell).toLowerCase())
  return headers.filter((header) => EXPORT_HEADERS.has(header)).length >= 6
}

function shouldSkipLegacyRow(row: unknown[], name: string, dateValue: unknown): string | null {
  const preview = rowPreview(row)
  if (!name && !dateValue) return IMPORT_SKIP_REASONS.EMPTY_ROW
  if (SKIP_NOTE_PATTERN.test(preview)) return IMPORT_SKIP_REASONS.NOTE_ROW
  if (typeof dateValue === 'string' && TEXT_DATE_PATTERN.test(dateValue.trim())) {
    return IMPORT_SKIP_REASONS.INVALID_TEXT_DATE
  }
  if (!name) return IMPORT_SKIP_REASONS.MISSING_EVENT_NAME
  if (dateValue === null || dateValue === undefined || dateValue === '') {
    return IMPORT_SKIP_REASONS.MISSING_DATE
  }
  return null
}

function buildEventFromRow(
  row: unknown[],
  columns: ColumnMap,
  options: { legacyDateColumn?: number; exportFormat?: boolean },
): EventCreate | null {
  const name = cellText(row[columns.event ?? -1])
  const dateValue =
    columns.date !== undefined
      ? row[columns.date]
      : options.legacyDateColumn !== undefined
        ? row[options.legacyDateColumn]
        : null

  const skipReason = shouldSkipLegacyRow(row, name, dateValue)
  if (skipReason) return null

  const date = parseExcelDate(dateValue)
  if (!date) return null

  const distance = parseDistance(row[columns.distance ?? -1])
  if (!distance) return null

  const status = mapExcelStatus(row[columns.status ?? -1]) ?? 'planned'
  const location = cellText(row[columns.local ?? -1])

  const time = parseExcelTime(row[columns.time ?? -1]) ?? undefined
  let pace = parseExcelPace(row[columns.pace ?? -1]) ?? undefined

  if (time) {
    pace = pace ?? calculatePace(time, distance) ?? undefined
  }

  const eventType =
    options.exportFormat && columns.eventType !== undefined
      ? mapEventTypeFromExport(row[columns.eventType]) ?? deriveEventType(distance)
      : deriveEventType(distance)

  const classification = cellText(row[columns.classification ?? -1]) || undefined
  const notes = cellText(row[columns.notes ?? -1]) || undefined

  return {
    name,
    date,
    realDistance: distance,
    eventType,
    location,
    status,
    time,
    pace,
    classification,
    notes,
  }
}

function parsePlanoSheet(
  sheetName: string,
  rows: unknown[][],
  skipped: SkippedRow[],
): ParsedRow[] {
  const events: ParsedRow[] = []
  let headerRowIndex = rows.findIndex((row) =>
    row.some((cell) => cellText(cell).toLowerCase().includes('evento')),
  )

  if (headerRowIndex === -1) {
    headerRowIndex = 0
  }

  const columns = detectColumns(rows[headerRowIndex] ?? [])
  const legacyDateColumn = columns.date === undefined ? 0 : undefined

  for (let rowIndex = headerRowIndex + 1; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex]
    if (!row || row.every((cell) => cellText(cell) === '')) continue

    const event = buildEventFromRow(row, columns, { legacyDateColumn })
    if (!event) {
      const reason =
        shouldSkipLegacyRow(
          row,
          cellText(row[columns.event ?? -1]),
          columns.date !== undefined ? row[columns.date] : row[0],
        ) ?? IMPORT_SKIP_REASONS.INVALID_DATA
      skipped.push({
        sheet: sheetName,
        row: rowIndex + 1,
        reason,
        raw: rowPreview(row),
      })
      continue
    }

    events.push({ event, sheet: sheetName, row: rowIndex + 1 })
  }

  return events
}

function parseExportSheet(sheetName: string, rows: unknown[][]): ParsedRow[] {
  const events: ParsedRow[] = []
  const columns = detectColumns(rows[0] ?? [])

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex]
    if (!row || row.every((cell) => cellText(cell) === '')) continue

    const event = buildEventFromRow(row, columns, { exportFormat: true })
    if (!event) continue

    events.push({ event, sheet: sheetName, row: rowIndex + 1 })
  }

  return events
}

export function isExportWorkbook(workbook: XLSX.WorkBook): boolean {
  const hasPlanoSheet = workbook.SheetNames.some((name) => name.startsWith('Plano'))
  if (hasPlanoSheet) return false

  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!firstSheet) return false

  const rows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1, defval: '' })
  return isExportHeaderRow(rows[0] ?? [])
}

export function parseWorkbook(buffer: ArrayBuffer): ParseWorkbookResult {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false })
  const events: ParsedRow[] = []
  const skipped: SkippedRow[] = []

  if (isExportWorkbook(workbook)) {
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })
      events.push(...parseExportSheet(sheetName, rows))
    }
    return { events, skipped }
  }

  for (const sheetName of workbook.SheetNames) {
    if (!sheetName.startsWith('Plano')) continue

    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })
    events.push(...parsePlanoSheet(sheetName, rows, skipped))
  }

  return { events, skipped }
}
