import type { OfficialResultCandidate, UserResultsProfile } from './types.js'
import { matchesResultsProfile } from './matchName.js'

/**
 * Reads a parkrun results page that somebody printed to PDF from their own
 * browser.
 *
 * Deliberately narrow: this module can find the rows that match one runner and
 * the size of the field, and it exposes no way to walk the whole table. The
 * document carries every finisher's name and parkrun prints an all rights
 * reserved notice on it. One runner's own row and the field size are what a
 * result needs; the rest is nobody's business here.
 *
 * Both shapes of the page are read, because a runner who exports the wrong one
 * should get their result, not a puzzle:
 *
 *   compact:  `11 Rodrigo NEVES 26:10`
 *   detailed: the name, time and position land on separate lines, in an order
 *             that varies with how the print laid the row out.
 */

export type ParkrunPdfShape = 'compact' | 'detailed'

export type ParkrunPdfHeader = {
  eventName?: string
  /** As printed. The page renders it in the reader's locale, so it is ambiguous. */
  eventDate?: string
  eventNumber?: number
  totalFinishers?: number
}

export type ParkrunPdfRow = {
  position: number
  name: string
  /** `HH:MM:SS`, the page printing `MM:SS` under an hour. */
  time: string
}

const COMPACT_ROW = /^(\d+)\s+([^|%\d][^|%]*?)\s+((?:\d{1,2}:)?\d{1,2}:\d{2})$/
const HEADER_LINE = /^(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})\s*\|\s*#(\d+)$/
const COUNTS_LINE = /^(\d+)(?:\s+\d+)*$/
const TIME = /\b(\d{1,2}:\d{2}(?::\d{2})?)\b/g
const BARE_INT = /^(\d+)$/
const POSITION_THEN_COUNT = /^(\d+)\s+(\d+)\s+\S/
const PERSONAL_BEST = /\bPB\b/i

/** How far past the name a detailed block's time and position can sit. */
const BLOCK_LINES = 4

function textLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

export function isParkrunPdfText(text: string): boolean {
  const lines = textLines(text)
  if (!lines.slice(0, 4).some((line) => /parkrun/i.test(line))) return false
  return lines.slice(0, 8).some((line) => HEADER_LINE.test(line))
}

export function parkrunPdfShape(text: string): ParkrunPdfShape {
  const compactRows = textLines(text).filter((line) => COMPACT_ROW.test(line)).length
  // One or two stray matches can happen in either shape; a real compact table
  // is the whole field.
  return compactRows >= 3 ? 'compact' : 'detailed'
}

export function parseParkrunPdfHeader(text: string): ParkrunPdfHeader {
  const lines = textLines(text)
  const headerIndex = lines.slice(0, 8).findIndex((line) => HEADER_LINE.test(line))
  const header = headerIndex >= 0 ? HEADER_LINE.exec(lines[headerIndex]!) : null

  // Finishers and volunteers are printed as bare numbers above their labels,
  // finishers first. Reading the numbers keeps this free of the page language.
  let totalFinishers: number | undefined
  for (const line of lines.slice(headerIndex + 1, headerIndex + 4)) {
    const counts = COUNTS_LINE.exec(line)
    if (counts) {
      totalFinishers = Number(counts[1])
      break
    }
  }

  return {
    eventName: headerIndex > 0 ? lines[headerIndex - 1] : undefined,
    eventDate: header ? `${header[1]}/${header[2]}/${header[3]}` : undefined,
    eventNumber: header ? Number(header[4]) : undefined,
    totalFinishers,
  }
}

/**
 * Both readings of the printed date.
 *
 * The page formats the day in whatever locale the browser was in, so `8/29/26`
 * is unambiguous only because 29 cannot be a month. Rather than guess a locale,
 * offer both and let the caller keep the one that matches the event.
 */
export function parkrunPdfEventDateCandidates(header: ParkrunPdfHeader): Date[] {
  if (!header.eventDate) return []
  const parts = header.eventDate.split('/').map(Number)
  const [first, second, rawYear] = parts
  if (!first || !second || rawYear === undefined) return []

  const year = rawYear < 100 ? 2000 + rawYear : rawYear
  const dates: Date[] = []

  for (const [month, day] of [
    [first, second],
    [second, first],
  ]) {
    if (!month || !day || month > 12 || day > 31) continue
    const date = new Date(year, month - 1, day)
    if (date.getMonth() === month - 1 && date.getDate() === day) dates.push(date)
  }

  return dates
}

function normalizeTime(time: string): string {
  const parts = time.split(':')
  const padded = parts.length === 2 ? ['0', ...parts] : parts
  return padded.map((part) => part.padStart(2, '0')).join(':')
}

function raceTimesOn(line: string): string[] {
  // A personal best rides along in the detailed block. It is not today's time.
  if (PERSONAL_BEST.test(line)) return []
  return [...line.matchAll(TIME)].map((match) => match[1]!)
}

function nameFrom(line: string): string {
  return line.replace(TIME, '').replace(/^\d+\s*/, '').trim()
}

/** parkrun prints the family name in capitals, which is what marks a runner. */
const FAMILY_NAME = /(?:^|[\s-])\p{Lu}{2,}(?:['\u2019-]?\p{Lu}+)*(?:$|[\s-])/u

/** `Jonas S`: a runner who withheld their family name still gets one initial. */
const WITHHELD_FAMILY_NAME = /^\p{Lu}\p{L}+(?:\s+\p{Lu}\p{L}+)?\s+\p{Lu}$/u

/**
 * A detailed block's name line.
 *
 * The block also prints a club, a first-timer badge and an age grading, and a
 * club name reads exactly like a person's. The capitals are what separate them:
 * without that test, a profile matching a club name produced a row built from
 * the *next* runner's time.
 */
function looksLikeNameLine(line: string): boolean {
  if (line.includes('|') || line.includes('%')) return false
  if (line.length > 60) return false
  const name = nameFrom(line)
  if (!/\p{L}{2,}/u.test(name)) return false
  return FAMILY_NAME.test(name) || WITHHELD_FAMILY_NAME.test(name)
}

/**
 * Finds the position in a detailed block.
 *
 * The block also prints how many parkruns the runner has finished, which is a
 * number in the same place and can dwarf the field. The field size is the
 * ceiling that separates the two.
 */
function positionIn(window: string[], totalFinishers: number | undefined): number | undefined {
  for (const line of window) {
    const bare = BARE_INT.exec(line)
    const pair = POSITION_THEN_COUNT.exec(line)
    const candidate = bare ? Number(bare[1]) : pair ? Number(pair[1]) : undefined
    if (candidate === undefined || candidate < 1) continue
    if (totalFinishers !== undefined && candidate > totalFinishers) continue
    return candidate
  }
  return undefined
}

/**
 * Every row belonging to one runner, and nothing else.
 *
 * More than one comes back when a surname is shared, which happens at a parkrun
 * more than anywhere: the caller asks the runner which is theirs.
 */
export function findParkrunPdfRows(text: string, profile: UserResultsProfile): ParkrunPdfRow[] {
  const lines = textLines(text)
  const { totalFinishers } = parseParkrunPdfHeader(text)
  const rows: ParkrunPdfRow[] = []

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!

    const compact = COMPACT_ROW.exec(line)
    if (compact) {
      const name = compact[2]!.trim()
      if (matchesResultsProfile(profile, name)) {
        rows.push({ position: Number(compact[1]), name, time: normalizeTime(compact[3]!) })
      }
      continue
    }

    if (!looksLikeNameLine(line)) continue
    const name = nameFrom(line)
    if (!matchesResultsProfile(profile, name)) continue

    const window = lines.slice(index, index + BLOCK_LINES)
    const time = window.flatMap(raceTimesOn)[0]
    const position = positionIn(window, totalFinishers)
    if (!time || position === undefined) continue

    rows.push({ position, name, time: normalizeTime(time) })
  }

  return rows
}

export function parkrunPdfCandidates(
  text: string,
  profile: UserResultsProfile,
  sourceUrl: string,
): OfficialResultCandidate[] {
  const { totalFinishers } = parseParkrunPdfHeader(text)

  return findParkrunPdfRows(text, profile).map((row) => ({
    platform: 'parkrun' as const,
    matchedName: row.name,
    time: row.time,
    position: row.position,
    totalParticipants: totalFinishers,
    sourceUrl,
    confidence: 'high' as const,
  }))
}
