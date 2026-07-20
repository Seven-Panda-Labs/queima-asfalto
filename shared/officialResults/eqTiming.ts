import { parseSemicolonCsvLine } from './myRacePartner.js'

export const EQTIMING_ORIGIN = 'https://live.eqtiming.com'

export const EQTIMING_REPORT_IDS = [220, 347] as const

export type EqTimingUrlParts = {
  eventId: string
  etappeId?: string
  stationId?: string
  pageUrl: string
  origin: string
}

export type EqTimingSearchMatch = {
  firstName: string
  lastName: string
  stage: string
  stageId?: number
  className: string
  position?: number
  classPosition?: number
  time: string
}

export type EqTimingCsvRow = {
  stage: string
  className: string
  firstName: string
  lastName: string
  totalTime: string
}

const INVALID_RESULT_TIMES = new Set(['DNS', 'DNF', 'DNC', 'DSQ', 'DNQ', 'LAP'])

export function parseEqTimingHash(hash: string): { etappeId?: string; stationId?: string } {
  const match = /^#?result:(\d+)-\d+-(\d+)-/i.exec(hash.trim())
  if (!match?.[1] || !match[2]) return {}
  return { etappeId: match[1], stationId: match[2] }
}

export function parseEqTimingTime(value: string): string | null {
  const trimmed = value.trim()
  const hms = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(trimmed)
  if (hms) {
    return `${hms[1]!.padStart(2, '0')}:${hms[2]}:${hms[3]}`
  }

  const hm = /^(\d{1,2}):(\d{2})$/.exec(trimmed)
  if (hm) {
    return `${hm[1]!.padStart(2, '0')}:${hm[2]}:00`
  }

  return null
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readNumber(value: unknown): number | undefined {
  const num = Number(value)
  return Number.isFinite(num) ? num : undefined
}

export function parseEqTimingSearchItem(item: unknown): EqTimingSearchMatch | null {
  if (!item || typeof item !== 'object') return null

  const root = item as {
    Deltaker?: {
      Utover?: { Fornavn?: unknown; Etternavn?: unknown }
      Etappe?: { Navn?: unknown; UID?: unknown }
      Klasse?: { Navn?: unknown }
    }
    Plassering?: { Total?: unknown; Klasse?: unknown }
    Formatert?: unknown
  }

  const athlete = root.Deltaker?.Utover
  const firstName = readString(athlete?.Fornavn)
  const lastName = readString(athlete?.Etternavn)
  const stage = readString(root.Deltaker?.Etappe?.Navn)
  const className = readString(root.Deltaker?.Klasse?.Navn)
  const time = parseEqTimingTime(readString(root.Formatert))

  if (!firstName || !lastName || !stage || !className || !time) return null

  return {
    firstName,
    lastName,
    stage,
    stageId: readNumber(root.Deltaker?.Etappe?.UID),
    className,
    position: readNumber(root.Plassering?.Total),
    classPosition: readNumber(root.Plassering?.Klasse),
    time,
  }
}

export function parseEqTimingSearchResponse(payload: unknown): EqTimingSearchMatch[] {
  if (!payload || typeof payload !== 'object') return []

  const items = (payload as { Items?: unknown }).Items
  if (!Array.isArray(items)) return []

  return items
    .map((item) => parseEqTimingSearchItem(item))
    .filter((item): item is EqTimingSearchMatch => item !== null)
}

export function isEqTimingFinisherTime(totalTime: string): boolean {
  const trimmed = totalTime.trim()
  if (!trimmed || INVALID_RESULT_TIMES.has(trimmed.toUpperCase())) return false
  return !/^00:00:00(?:\.000)?$/.test(trimmed)
}

export function parseEqTimingCsv(csv: string): EqTimingCsvRow[] {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length < 2) return []

  const header = parseSemicolonCsvLine(lines[0]!)
  const stageIdx = header.findIndex((col) => /^(stage|race)$/i.test(col))
  const classIdx = header.findIndex((col) => /^class$/i.test(col))
  const firstIdx = header.findIndex((col) => /^firstname$/i.test(col))
  const lastIdx = header.findIndex((col) => /^surname$/i.test(col))
  const timeIdx = header.findIndex((col) => /^total time$/i.test(col))

  if (stageIdx < 0 || classIdx < 0 || firstIdx < 0 || lastIdx < 0 || timeIdx < 0) return []

  const rows: EqTimingCsvRow[] = []
  for (const line of lines.slice(1)) {
    const fields = parseSemicolonCsvLine(line)
    const stage = fields[stageIdx] ?? ''
    const className = fields[classIdx] ?? ''
    const firstName = fields[firstIdx] ?? ''
    const lastName = fields[lastIdx] ?? ''
    const totalTime = fields[timeIdx] ?? ''
    if (!stage || !className || !firstName || !lastName) continue

    rows.push({ stage, className, firstName, lastName, totalTime })
  }

  return rows
}

export function countEqTimingStageFinishers(rows: EqTimingCsvRow[], stage: string): number {
  return rows.filter((row) => row.stage === stage && isEqTimingFinisherTime(row.totalTime)).length
}

export function countEqTimingCategoryFinishers(
  rows: EqTimingCsvRow[],
  stage: string,
  className: string,
): number {
  return rows.filter(
    (row) =>
      row.stage === stage &&
      row.className === className &&
      isEqTimingFinisherTime(row.totalTime),
  ).length
}

export function buildEqTimingSearchUrl(
  eventId: string,
  query: string,
  origin = EQTIMING_ORIGIN,
): string {
  const params = new URLSearchParams({
    justTimeData: 'true',
    count: '100',
    startAt: '1',
    station: '0',
    query,
    round: '1',
    passes: 'false',
    filter: '',
    raceid: '0',
    classid: '0',
  })
  return `${origin}/api/Result/Search/${eventId}?${params.toString()}`
}

export function buildEqTimingReportUrl(
  eventId: string,
  reportId: number,
  origin = EQTIMING_ORIGIN,
): string {
  return `${origin}/api//Report/${reportId}?eventId=${eventId}`
}

export function buildEqTimingEventPageUrl(parts: Pick<EqTimingUrlParts, 'eventId' | 'origin'>): string {
  return `${parts.origin}/${parts.eventId}`
}
