import { parseZielZeitGermanName } from './zielZeit.js'

export const NSF_BERLIN_ORIGIN = 'https://www.nsf-la.de'

export type NsfBerlinUrlParts = {
  eventPath: string
  pageUrl: string
  origin: string
  strecke?: string
}

export type NsfBerlinStreckeOption = {
  value: string
  totalParticipants?: number
}

export type NsfBerlinResultRow = {
  position: number
  name: string
  firstName: string
  lastName: string
  time: string
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&uuml;/gi, 'ü')
    .replace(/&ouml;/gi, 'ö')
    .replace(/&auml;/gi, 'ä')
    .replace(/&szlig;/gi, 'ß')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .trim()
}

export function parseNsfBerlinTime(value: string): string | null {
  const trimmed = value.trim()
  const hms = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(trimmed)
  if (hms) {
    return `${hms[1]!.padStart(2, '0')}:${hms[2]}:${hms[3]}`
  }

  const ms = /^(\d{1,2}):(\d{2})$/.exec(trimmed)
  if (ms) {
    return `00:${ms[1]!.padStart(2, '0')}:${ms[2]}`
  }

  return null
}

export function parseNsfBerlinStreckeOptions(html: string): NsfBerlinStreckeOption[] {
  const options: NsfBerlinStreckeOption[] = []

  for (const match of html.matchAll(
    /<input[^>]*name="Strecke"[^>]*value="([^"]+)"[^>]*>[\s\S]*?<span class="ui-li-count">(\d+)\s+Teiln\./gi,
  )) {
    if (!match[1]) continue
    options.push({
      value: match[1],
      totalParticipants: match[2] ? Number(match[2]) : undefined,
    })
  }

  return options
}

export type NsfBerlinTableColumns = {
  positionIdx: number
  nameIdx: number
  timeIdx: number
}

function parseNsfBerlinTableColumns(html: string): NsfBerlinTableColumns | null {
  const theadMatch = /id="Results"[\s\S]*?<thead>([\s\S]*?)<\/thead>/i.exec(html)
  if (!theadMatch?.[1]) return null

  const headers = [...theadMatch[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map((header) =>
    stripHtml(header[1] ?? ''),
  )

  const positionIdx = headers.findIndex((header) => /^ges\.?$/i.test(header))
  const nameIdx = headers.findIndex((header) => /^name$/i.test(header))
  const timeIdx = headers.findIndex((header) => /^zeit$/i.test(header))

  if (positionIdx < 0 || nameIdx < 0 || timeIdx < 0) return null

  return { positionIdx, nameIdx, timeIdx }
}

export function parseNsfBerlinResultRows(html: string): NsfBerlinResultRow[] {
  const columns = parseNsfBerlinTableColumns(html)
  if (!columns) return []

  const tableMatch = /id="Results"[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/i.exec(html)
  if (!tableMatch?.[1]) return []

  const minCells = Math.max(columns.positionIdx, columns.nameIdx, columns.timeIdx) + 1
  const rows: NsfBerlinResultRow[] = []

  for (const rowMatch of tableMatch[1].matchAll(/<tr>([\s\S]*?)<\/tr>/gi)) {
    const rowHtml = rowMatch[1] ?? ''
    const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) =>
      stripHtml(cell[1] ?? ''),
    )
    if (cells.length < minCells) continue

    const position = Number(cells[columns.positionIdx])
    const name = cells[columns.nameIdx] ?? ''
    const time = parseNsfBerlinTime(cells[columns.timeIdx] ?? '')
    if (!Number.isFinite(position) || !name || !time) continue

    const { first, last } = parseZielZeitGermanName(name)
    if (!last) continue

    rows.push({
      position,
      name,
      firstName: first,
      lastName: last,
      time,
    })
  }

  return rows
}

export function buildNsfBerlinResultsPostUrl(parts: Pick<NsfBerlinUrlParts, 'eventPath' | 'origin'>): string {
  return `${parts.origin}${parts.eventPath}/index.php`
}
