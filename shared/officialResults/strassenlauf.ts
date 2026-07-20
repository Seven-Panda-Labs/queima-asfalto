export const STRASSENLAUF_ORIGIN = 'https://www.strassenlauf.org'

export type StrassenlaufUrlParts = {
  eventId: string
  match?: string
  cert: string
  pageUrl: string
  origin: string
}

export type StrassenlaufResultRow = {
  position?: number
  name: string
  time: string
}

export type StrassenlaufApiResponse = {
  recordsTotal: number
  recordsFiltered: number
  rows: StrassenlaufResultRow[]
}

const DATATABLES_SEARCHABLE_COLUMNS = [0, 1, 2, 5, 6] as const

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

export function parseStrassenlaufNameFromCell(cell: string): string {
  return stripHtml(cell)
}

export function parseStrassenlaufTime(value: string): string | null {
  const trimmed = value.trim()
  const hms = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(trimmed)
  if (!hms) return null
  return `${hms[1]!.padStart(2, '0')}:${hms[2]}:${hms[3]}`
}

export function parseStrassenlaufApiRow(row: unknown[]): StrassenlaufResultRow | null {
  if (row.length < 8) return null

  const position = typeof row[0] === 'number' ? row[0] : Number(row[0])
  const nameCell = typeof row[2] === 'string' ? row[2] : ''
  const timeCell = typeof row[7] === 'string' ? row[7] : ''

  const name = parseStrassenlaufNameFromCell(nameCell)
  const time = parseStrassenlaufTime(timeCell)
  if (!name || !time) return null

  return {
    position: Number.isFinite(position) ? position : undefined,
    name,
    time,
  }
}

export function parseStrassenlaufApiResponse(payload: unknown): StrassenlaufApiResponse | null {
  if (!payload || typeof payload !== 'object') return null

  const data = payload as {
    recordsTotal?: unknown
    recordsFiltered?: unknown
    data?: unknown
  }

  if (!Array.isArray(data.data)) return null

  const recordsTotal = Number(data.recordsTotal)
  const recordsFiltered = Number(data.recordsFiltered)
  const rows = data.data
    .map((row) => (Array.isArray(row) ? parseStrassenlaufApiRow(row) : null))
    .filter((row): row is StrassenlaufResultRow => row !== null)

  return {
    recordsTotal: Number.isFinite(recordsTotal) ? recordsTotal : rows.length,
    recordsFiltered: Number.isFinite(recordsFiltered) ? recordsFiltered : rows.length,
    rows,
  }
}

export function parseStrassenlaufApiParamsFromHtml(html: string): {
  eventId: string
  match: string
  cert: string
} | null {
  const match = /server_processing_res\.php\?id=(\d+)&match=([^&"']+)&cert=([^&"']+)/i.exec(html)
  if (!match?.[1] || !match[2] || !match[3]) return null
  if (match[2] === '-1') return null
  return { eventId: match[1], match: match[2], cert: match[3] }
}

function appendDataTablesColumns(params: URLSearchParams): void {
  for (const column of DATATABLES_SEARCHABLE_COLUMNS) {
    params.set(`columns[${column}][data]`, String(column))
    params.set(`columns[${column}][searchable]`, column === 0 ? 'false' : 'true')
    params.set(`columns[${column}][orderable]`, 'true')
  }
  params.set('order[0][column]', '0')
  params.set('order[0][dir]', 'asc')
}

export function buildStrassenlaufApiUrl(
  parts: Pick<StrassenlaufUrlParts, 'eventId' | 'match' | 'cert' | 'origin'>,
  searchTerm: string,
  options?: { start?: number; length?: number; draw?: number },
): string | null {
  if (!parts.match) return null

  const params = new URLSearchParams({
    id: parts.eventId,
    match: parts.match,
    cert: parts.cert,
    draw: String(options?.draw ?? 1),
    start: String(options?.start ?? 0),
    length: String(options?.length ?? 25),
    'search[value]': searchTerm,
    'search[regex]': 'false',
  })

  appendDataTablesColumns(params)
  return `${parts.origin}/js/server_processing_res.php?${params.toString()}`
}

export function buildStrassenlaufResultsPageUrl(
  parts: Pick<StrassenlaufUrlParts, 'eventId' | 'match' | 'origin'>,
): string {
  const params = new URLSearchParams({ id: parts.eventId })
  if (parts.match) params.set('match', parts.match)
  return `${parts.origin}/va_ergebnisse.php?${params.toString()}`
}
