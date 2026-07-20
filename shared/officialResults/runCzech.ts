import { splitFullName } from './matchName.js'

export const RUN_CZECH_ORIGIN = 'https://www.runczech.com'

export type RunCzechUrlParts = {
  eventSlug: string
  locale: string
  pageUrl: string
  origin: string
  race?: string
}

export type RunCzechResultRow = {
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
    .trim()
}

export function parseRunCzechTime(value: string): string | null {
  const trimmed = value.trim()
  const hms = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(trimmed)
  if (!hms) return null

  return `${hms[1]!.padStart(2, '0')}:${hms[2]}:${hms[3]}`
}

export function parseRunCzechTotalParticipants(html: string): number | undefined {
  const match = /(\d[\d\s]*)\s+finishers total/i.exec(html)
  if (!match?.[1]) return undefined

  const total = Number(match[1].replace(/\s/g, ''))
  return Number.isFinite(total) ? total : undefined
}

export function parseRunCzechResultRows(html: string): RunCzechResultRow[] {
  const tableMatch = /id="js-data-result-grid"[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/i.exec(html)
  if (!tableMatch?.[1]) return []

  const rows: RunCzechResultRow[] = []

  for (const rowMatch of tableMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const rowHtml = rowMatch[1] ?? ''
    const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) =>
      stripHtml(cell[1] ?? ''),
    )
    if (cells.length < 4) continue

    const position = Number(cells[1])
    const name = cells[2]?.trim()
    const chipTime = cells.length >= 5 ? parseRunCzechTime(cells[4] ?? '') : null
    const time = chipTime ?? parseRunCzechTime(cells[3] ?? '')
    if (!Number.isFinite(position) || !name || !time) continue

    const { first, last } = splitFullName(name)
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

export function buildRunCzechSearchUrl(parts: RunCzechUrlParts, searchTerm: string): string {
  const url = new URL(parts.pageUrl)
  if (parts.race) url.searchParams.set('race', parts.race)
  url.searchParams.set('current_page', '1')
  url.searchParams.set('filter_search', searchTerm)
  return url.toString()
}
