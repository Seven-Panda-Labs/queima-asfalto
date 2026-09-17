import type { OfficialResultCandidate, UserResultsProfile } from './types.js'
import { matchesResultsProfile } from './matchName.js'

export type MaxFunSportsPdfRow = {
  position: number
  bib: string
  name: string
  time: string
  genderPosition?: number
  company?: string
}

export type MaxFunSportsPdfHeader = {
  eventName?: string
  /** As printed, `dd.mm.yyyy`. */
  eventDate?: string
  /** The operator's own word: these rows can still change. */
  preliminary: boolean
}

export type MaxFunSportsPdfDocument = {
  header: MaxFunSportsPdfHeader
  rows: MaxFunSportsPdfRow[]
  totalParticipants?: number
}

/**
 * `Pos. Bib Name Time GenderPos Company`.
 *
 * The gap before the time is optional because the name column is fixed width:
 * a long enough name runs into the time and the two come out of the PDF with
 * nothing between them.
 */
const ROW_PATTERN =
  /^(\d+)\.\s+(\d+)\s+(.+?)\s*(\d{1,2}:\d{2}:\d{2})(?:[.,]\d+)?\s+(\d+)(?:\s+(.*))?$/

const DATE_PATTERN = /^(\d{2})\.(\d{2})\.(\d{4})$/
const PRELIMINARY_PATTERN = /vorläufige?\s+ergebnisse/i
const TABLE_HEADING = 'GESAMTWERTUNG'

/** A page break pdf text extractors like to inject. Never part of the table. */
const PAGE_MARKER_PATTERN = /^--\s*\d+\s+of\s+\d+\s*--$/i

function textLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !PAGE_MARKER_PATTERN.test(line))
}

function padHours(time: string): string {
  const [hours = '', ...rest] = time.split(':')
  return [hours.padStart(2, '0'), ...rest].join(':')
}

export function isMaxFunSportsPdfText(text: string): boolean {
  return text.includes(TABLE_HEADING) && textLines(text).some((line) => ROW_PATTERN.test(line))
}

export function parseMaxFunSportsPdfHeader(text: string): MaxFunSportsPdfHeader {
  const lines = textLines(text)
  const dateIndex = lines.findIndex((line) => DATE_PATTERN.test(line))

  return {
    eventDate: dateIndex >= 0 ? lines[dateIndex] : undefined,
    // The operator prints the event name on the line under the date.
    eventName: dateIndex >= 0 ? lines[dateIndex + 1] : undefined,
    preliminary: lines.some((line) => PRELIMINARY_PATTERN.test(line)),
  }
}

export function parseMaxFunSportsPdfRows(text: string): MaxFunSportsPdfRow[] {
  const rows: MaxFunSportsPdfRow[] = []

  for (const line of textLines(text)) {
    const match = ROW_PATTERN.exec(line)
    if (!match) continue

    const name = (match[3] ?? '').trim()
    if (!name) continue

    rows.push({
      position: Number(match[1]),
      bib: match[2] ?? '',
      name,
      // Tenths are printed but the app stores whole seconds, the same
      // truncation every other connector applies.
      time: padHours(match[4] ?? ''),
      genderPosition: match[5] ? Number(match[5]) : undefined,
      company: match[6]?.trim() || undefined,
    })
  }

  return rows
}

/** No total is printed, so the field is as big as its last finisher's rank. */
export function maxFunSportsPdfTotal(rows: MaxFunSportsPdfRow[]): number | undefined {
  if (rows.length === 0) return undefined
  return rows.reduce((highest, row) => Math.max(highest, row.position), 0) || undefined
}

export function parseMaxFunSportsPdfText(text: string): MaxFunSportsPdfDocument {
  const rows = parseMaxFunSportsPdfRows(text)
  return {
    header: parseMaxFunSportsPdfHeader(text),
    rows,
    totalParticipants: maxFunSportsPdfTotal(rows),
  }
}

/** The printed `dd.mm.yyyy` as a date, so the upload can be tied to an event. */
export function maxFunSportsPdfEventDate(header: MaxFunSportsPdfHeader): Date | null {
  const match = header.eventDate ? DATE_PATTERN.exec(header.eventDate) : null
  if (!match) return null

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }
  return date
}

export function maxFunSportsPdfCandidates(
  document: MaxFunSportsPdfDocument,
  profile: UserResultsProfile,
  sourceUrl: string,
): OfficialResultCandidate[] {
  return document.rows
    .filter((row) => matchesResultsProfile(profile, row.name))
    .map((row) => ({
      platform: 'maxfunsports' as const,
      matchedName: row.name,
      time: row.time,
      position: row.position,
      totalParticipants: document.totalParticipants,
      sourceUrl,
      confidence: 'high' as const,
    }))
}
