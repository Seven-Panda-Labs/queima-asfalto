import { splitFullName } from './matchName.js'

export const ULTIMATE_ORIGIN = 'https://live.ultimate.dk'

export type UltimateUrlParts = {
  eventId: string
  pageUrl: string
  origin: string
  language: string
  distance?: string
  category?: string
}

export type UltimateSearchRow = {
  participantId: number
  bib: string
  name: string
  firstName: string
  lastName: string
  time: string
}

export type UltimateParticipantRanking = {
  position: number
  totalParticipants: number
  time?: string
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

export function extractUltimateInnerHtml(response: string, elementId: string): string | null {
  const prefix = `getElementById('${elementId}').innerHTML='`
  const start = response.indexOf(prefix)
  if (start < 0) return null

  let result = ''
  for (let i = start + prefix.length; i < response.length; i++) {
    const ch = response[i]!
    if (ch === '\\' && response[i + 1] === "'") {
      result += "'"
      i++
      continue
    }
    if (ch === "'") break
    result += ch
  }

  return result
}

export function parseUltimateTime(value: string): string | null {
  const trimmed = value.trim()
  const hms = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(trimmed)
  if (!hms) return null

  return `${hms[1]!.padStart(2, '0')}:${hms[2]}:${hms[3]}`
}

export function parseUltimateParticipantCount(response: string): number | undefined {
  const statusMatch =
    /divResults_Status'\)\.innerHTML='(\d[\d,]*)\s+participant\(s\) found/i.exec(response) ??
    /divSearch_Status'\)\.innerHTML='(\d[\d,]*)\s+participant\(s\) found/i.exec(response)
  if (!statusMatch?.[1]) return undefined

  const total = Number(statusMatch[1].replace(/,/g, ''))
  return Number.isFinite(total) ? total : undefined
}

export function parseUltimateSearchRows(response: string): UltimateSearchRow[] {
  const tableHtml = extractUltimateInnerHtml(response, 'search_results')
  if (!tableHtml) return []

  const rows: UltimateSearchRow[] = []

  for (const rowMatch of tableHtml.matchAll(/<tr[^>]*id="search_row_(\d+)"[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const participantId = Number(rowMatch[1])
    const rowHtml = rowMatch[2] ?? ''
    const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) =>
      stripHtml(cell[1] ?? ''),
    )
    if (!Number.isFinite(participantId) || cells.length < 8) continue

    const bib = cells[0] ?? ''
    const name = cells[1]?.trim()
    const time = parseUltimateTime(cells[6] ?? '')
    if (!name || !time) continue

    const { first, last } = splitFullName(name)
    if (!last) continue

    rows.push({
      participantId,
      bib,
      name,
      firstName: first,
      lastName: last,
      time,
    })
  }

  return rows
}

function parseUltimateRankValue(value: string): number | undefined {
  const match = /^(\d[\d,]*)/.exec(value.trim())
  if (!match?.[1]) return undefined

  const rank = Number(match[1].replace(/,/g, ''))
  return Number.isFinite(rank) ? rank : undefined
}

export function parseUltimateParticipantRanking(response: string): UltimateParticipantRanking | null {
  const html = extractUltimateInnerHtml(response, 'PARTICIPANTINFO')
  if (!html) return null

  const overallMatch = /rank overall[\s\S]*?participant_value_std">([^<]+)</i.exec(html)
  if (!overallMatch?.[1]) return null

  const overallParts = overallMatch[1].trim().split(/\s+of\s+/i)
  const position = parseUltimateRankValue(overallParts[0] ?? '')
  const totalParticipants = parseUltimateRankValue(
    (overallParts[1] ?? '').replace(/\s+starters?$/i, ''),
  )
  if (position === undefined || totalParticipants === undefined) return null

  const netTimeMatch = /net time[\s\S]*?participant_value_std">(\d{1,2}:\d{2}:\d{2})/i.exec(html)
  const time = netTimeMatch?.[1] ? parseUltimateTime(netTimeMatch[1]) : undefined

  return {
    position,
    totalParticipants,
    time: time ?? undefined,
  }
}

export function buildUltimateParticipantInfoUrl(parts: UltimateUrlParts, participantId: number): string {
  const url = new URL(`${parts.origin}/desktop/front/data.php`)
  url.searchParams.set('eventid', parts.eventId)
  url.searchParams.set('mode', 'participantinfo')
  url.searchParams.set('pid', String(participantId))
  url.searchParams.set('language', parts.language)
  return url.toString()
}

export function buildUltimateSearchUrl(parts: UltimateUrlParts, searchTerm: string): string {
  const url = new URL(`${parts.origin}/desktop/front/data.php`)
  url.searchParams.set('eventid', parts.eventId)
  url.searchParams.set('mode', 'search')
  url.searchParams.set('searchmode', 'quick')
  url.searchParams.set('search_quick', searchTerm)
  url.searchParams.set('language', parts.language)
  url.searchParams.set('search_bib', '')
  url.searchParams.set('search_firstname', '')
  url.searchParams.set('search_lastname', '')
  url.searchParams.set('search_club', '')
  url.searchParams.set('search_city', '')
  url.searchParams.set('search_nation', '')
  url.searchParams.set('search_distance', parts.distance ?? '')
  url.searchParams.set('search_category', parts.category ?? '')
  url.searchParams.set('search_time', 'Finish')
  url.searchParams.set('search_sortby', '[TIMEFIELD]')
  url.searchParams.set('search_sorttype', 'ASC')
  return url.toString()
}

export function buildUltimateResultsUrl(parts: UltimateUrlParts): string | null {
  if (!parts.distance) return null

  const url = new URL(`${parts.origin}/desktop/front/data.php`)
  url.searchParams.set('eventid', parts.eventId)
  url.searchParams.set('mode', 'results')
  url.searchParams.set('distance', parts.distance)
  url.searchParams.set('category', parts.category ?? '')
  url.searchParams.set('language', parts.language)
  return url.toString()
}
