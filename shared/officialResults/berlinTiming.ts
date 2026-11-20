import { matchesResultsProfile } from './matchName.js'
import type { OfficialResultCandidate, UserResultsProfile } from './types.js'

export type BerlinTimingUrlParts = {
  /** The page that lists the rankings: the race's page, or the results index. */
  pageUrl: string
}

export type BerlinTimingResultRow = {
  position?: number
  fullName: string
  time: string
}

const RANKING_PATH = /^\/([^/]+)\/Ergebnis\/\d{4}-\d{2}-\d{2}\/[^/]+$/

const TIME_HEADERS = ['Endzeit', 'Gesamtzeit', 'Laufzeit']
const POSITION_HEADERS = ['Gesamt', 'Platz', 'Plg.']
// Swim and bike splits: the time is a triathlon's, not a run's.
const MULTISPORT_HEADER = /^(schwim|swim|rad|bike)/i

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    // Some older pages put a NUL before every header.
    .replace(/\0/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isBerlinTimingHostname(hostname: string): boolean {
  return /(^|\.)berlin-timing\.de$/i.test(hostname)
}

export function parseBerlinTimingUrl(url: string): BerlinTimingUrlParts | null {
  try {
    const parsed = new URL(url.trim())
    if (!isBerlinTimingHostname(parsed.hostname)) return null

    // A ranking link is one table of one edition; the race's page lists them all.
    const ranking = RANKING_PATH.exec(parsed.pathname)
    return { pageUrl: ranking ? `${parsed.origin}/${ranking[1]}` : parsed.toString() }
  } catch {
    return null
  }
}

/**
 * The ranking pages of the editions held on one of `dates` (YYYY-MM-DD), in
 * page order. The race's page and the results index link them the same way.
 */
export function parseBerlinTimingRankingUrls(html: string, pageUrl: string, dates: string[]): string[] {
  const urls: string[] = []
  for (const match of html.matchAll(/href="([^"]*\/Ergebnis\/(\d{4}-\d{2}-\d{2})\/[^"]+)"/g)) {
    if (!dates.includes(match[2]!)) continue
    const url = new URL(match[1]!.replace(/&amp;/g, '&'), pageUrl).toString()
    if (!urls.includes(url)) urls.push(url)
  }
  return urls
}

export function parseBerlinTimingTime(value: string): string | null {
  const match = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:[.,]\d+)?$/.exec(value.trim())
  if (!match) return null
  return `${(match[1] ?? '0').padStart(2, '0')}:${match[2]!.padStart(2, '0')}:${match[3]}`
}

/**
 * The finishers of one ranking. Tables without a runner per row and a finish
 * time, such as teams, relays and lap counts, and triathlons give none.
 */
export function parseBerlinTimingResultRows(html: string): BerlinTimingResultRow[] {
  const head = /<thead[^>]*>([\s\S]*?)<\/thead>/i.exec(html)?.[1]
  const body = /<tbody[^>]*>([\s\S]*?)<\/tbody>/i.exec(html)?.[1]
  if (!head || !body) return []

  const headers = [...head.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map((cell) => stripHtml(cell[1] ?? ''))
  if (headers.some((header) => MULTISPORT_HEADER.test(header))) return []

  const nameIdx = headers.indexOf('Name')
  const firstNameIdx = headers.indexOf('Vorname')
  const timeIdx = headers.findIndex((header) => TIME_HEADERS.includes(header))
  const positionIdx = headers.findIndex((header) => POSITION_HEADERS.includes(header))
  if (nameIdx < 0 || timeIdx < 0) return []

  const rows: BerlinTimingResultRow[] = []
  for (const rowMatch of body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...(rowMatch[1] ?? '').matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) =>
      stripHtml(cell[1] ?? ''),
    )
    // Rankings by age class put a one-cell heading row before each class.
    if (cells.length !== headers.length) continue

    const time = parseBerlinTimingTime(cells[timeIdx]!)
    const fullName = [firstNameIdx >= 0 ? cells[firstNameIdx] : '', cells[nameIdx]].filter(Boolean).join(' ')
    if (!time || !fullName) continue

    const position = positionIdx >= 0 ? /^(\d+)\.?$/.exec(cells[positionIdx]!)?.[1] : undefined
    rows.push({ position: position ? Number(position) : undefined, fullName, time })
  }
  return rows
}

/**
 * The runner's results across every ranking of an edition. Ranking names
 * follow no pattern (by distance, by sex, both, or "Klasse 1"), so every table
 * is read and the runner's name picks the rows.
 */
export function matchBerlinTimingRankings(
  rankings: Array<{ url: string; html: string }>,
  profile: UserResultsProfile,
): OfficialResultCandidate[] {
  const candidates: OfficialResultCandidate[] = []
  for (const ranking of rankings) {
    const rows = parseBerlinTimingResultRows(ranking.html)
    const finishers = rows.filter((row) => row.position !== undefined).length

    for (const row of rows) {
      if (!matchesResultsProfile(profile, row.fullName)) continue
      // The same finish listed again, as in "10 km nach AK" after "10 km".
      if (candidates.some((found) => found.matchedName === row.fullName && found.time === row.time)) continue

      candidates.push({
        platform: 'berlintiming',
        matchedName: row.fullName,
        time: row.time,
        position: row.position,
        totalParticipants: finishers || undefined,
        sourceUrl: ranking.url,
        confidence: 'high',
      })
    }
  }
  return candidates
}
