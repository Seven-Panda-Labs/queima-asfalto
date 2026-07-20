import { splitFullName } from './matchName.js'

export type TimatakaUrlParts = {
  pageUrl: string
  race?: string
  category?: string
}

export type TimatakaResultRow = {
  position: number
  bib: string
  fullName: string
  firstName: string
  lastName: string
  time: string
}

function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, ' ')
    .trim()
}

export function isTimatakaHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase()
  return normalized.includes('timataka.net') || normalized.includes('timataka.is')
}

export function isTimatakaResultsPath(pathname: string): boolean {
  return /\/urslit(?:\/|$)/i.test(pathname)
}

export function parseTimatakaUrl(url: string): TimatakaUrlParts | null {
  try {
    const parsed = new URL(url.trim())
    if (!isTimatakaHostname(parsed.hostname)) return null
    if (!isTimatakaResultsPath(parsed.pathname)) return null

    return {
      pageUrl: parsed.toString(),
      race: parsed.searchParams.get('race')?.trim() || undefined,
      category: parsed.searchParams.get('cat')?.trim() || undefined,
    }
  } catch {
    return null
  }
}

export function parseTimatakaTime(value: string): string | null {
  const trimmed = value.trim()
  const hms = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(trimmed)
  if (!hms) return null

  return `${hms[1]!.padStart(2, '0')}:${hms[2]}:${hms[3]}`
}

export function parseTimatakaTotalParticipants(html: string): number | undefined {
  const fromStats = /Started\s*\/\s*Finished[\s\S]*?<h4>\s*\d+\s*\/\s*(\d+)/i.exec(html)
  if (fromStats?.[1]) {
    const total = Number(fromStats[1])
    if (Number.isFinite(total) && total > 0) return total
  }

  return undefined
}

type TimatakaTableColumns = {
  rankIdx: number
  nameIdx: number
  timeIdx: number
}

function parseTimatakaTableColumns(html: string): TimatakaTableColumns | null {
  const theadMatch = /<table[^>]*class="[^"]*table[^"]*"[^>]*>[\s\S]*?<thead>([\s\S]*?)<\/thead>/i.exec(
    html,
  )
  if (!theadMatch?.[1]) return null

  const headers = [...theadMatch[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map((header) =>
    stripHtml(header[1] ?? ''),
  )

  const rankIdx = headers.findIndex((header) => /^rank$/i.test(header))
  const nameIdx = headers.findIndex((header) => /^name$/i.test(header))
  const timeIdx = headers.findIndex((header) => /^time$/i.test(header))

  if (nameIdx < 0 || timeIdx < 0) return null

  return { rankIdx, nameIdx, timeIdx }
}

export function parseTimatakaResultRows(html: string): TimatakaResultRow[] {
  const columns = parseTimatakaTableColumns(html)
  if (!columns) return []

  const tableMatch = /<table[^>]*class="[^"]*table[^"]*"[^>]*>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/i.exec(
    html,
  )
  if (!tableMatch?.[1]) return []

  const minCells = Math.max(columns.rankIdx, columns.nameIdx, columns.timeIdx) + 1
  const rows: TimatakaResultRow[] = []

  for (const rowMatch of tableMatch[1].matchAll(/<tr>([\s\S]*?)<\/tr>/gi)) {
    const rowHtml = rowMatch[1] ?? ''
    const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) =>
      stripHtml(cell[1] ?? ''),
    )
    if (cells.length < minCells) continue

    const fullName = cells[columns.nameIdx] ?? ''
    const time = parseTimatakaTime(cells[columns.timeIdx] ?? '')
    if (!fullName || !time) continue

    const rankValue = columns.rankIdx >= 0 ? cells[columns.rankIdx] : String(rows.length + 1)
    const position = Number(rankValue)
    if (!Number.isFinite(position) || position <= 0) continue

    const bib = cells[columns.nameIdx - 1] ?? ''
    const { first, last } = splitFullName(fullName)
    if (!last) continue

    rows.push({
      position,
      bib,
      fullName,
      firstName: first,
      lastName: last,
      time,
    })
  }

  return rows
}
