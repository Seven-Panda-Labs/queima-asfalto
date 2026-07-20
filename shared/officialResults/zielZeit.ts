export const ZIELZEIT_ORIGIN = 'https://ziel-zeit.de'

export type ZielZeitUrlParts = {
  pdfPath: string
  pageUrl: string
  origin: string
}

export type ZielZeitResultRow = {
  position: number
  bib: number
  name: string
  firstName: string
  lastName: string
  time: string
}

export type ZielZeitPdfParseResult = {
  rows: ZielZeitResultRow[]
  totalParticipants?: number
}

const AGE_CATEGORY_RE = /(?:M|W|MJ|WJ|MK|WK)\s*(?:U\d+|\d+)/
const ROW_LINE_RE = /^\d+\.\s+\d+\s+\d+\s+/
const ROW_TIME_RE =
  /(\d{1,2}:\d{2}(?::\d{2})?)\s*(min|h)(?:\s*\((\d{1,2}:\d{2}(?::\d{2})?)\))?\s*$/
const FINISHER_TOTAL_RE = /(\d+)\s+Finisher/i

/** German result lists use `Last, First`. */
export function parseZielZeitGermanName(value: string): { first: string; last: string } {
  const trimmed = value.trim().replace(/\.\.\.$/, '').trim()
  const comma = trimmed.indexOf(',')
  if (comma === -1) {
    const parts = trimmed.split(/\s+/).filter(Boolean)
    if (parts.length === 0) return { first: '', last: '' }
    if (parts.length === 1) return { first: '', last: parts[0]! }
    return { first: parts[0]!, last: parts.slice(1).join(' ') }
  }

  return {
    last: trimmed.slice(0, comma).trim(),
    first: trimmed.slice(comma + 1).trim(),
  }
}

export function parseZielZeitTime(value: string): string | null {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(value.trim())
  if (!match) return null

  if (match[3]) {
    return `${match[1]!.padStart(2, '0')}:${match[2]}:${match[3]}`
  }

  return `00:${match[1]!.padStart(2, '0')}:${match[2]}`
}

export function parseZielZeitResultLine(line: string): ZielZeitResultRow | null {
  const trimmed = line.trim()
  if (!ROW_LINE_RE.test(trimmed)) return null

  const timeMatch = ROW_TIME_RE.exec(trimmed)
  if (!timeMatch?.[1]) return null

  const time = parseZielZeitTime(timeMatch[3] ?? timeMatch[1])
  if (!time || timeMatch.index === undefined) return null

  const beforeTime = trimmed.slice(0, timeMatch.index).trim()
  const headMatch = /^(\d+)\.\s+(\d+)\s+(\d+)\s+(.+)$/.exec(beforeTime)
  if (!headMatch?.[1] || !headMatch[3] || !headMatch[4]) return null

  const position = Number(headMatch[1])
  const bib = Number(headMatch[3])
  const tail = headMatch[4]

  const ageMatch = AGE_CATEGORY_RE.exec(tail)
  if (!ageMatch?.index) return null

  const name = tail.slice(0, ageMatch.index).trim()
  const afterAge = tail.slice(ageMatch.index + ageMatch[0].length).trim()
  const clubMatch = /^(\d+)\s*(.*)$/.exec(afterAge)
  if (!name || !clubMatch) return null

  const { first, last } = parseZielZeitGermanName(name)
  if (!last) return null

  return {
    position,
    bib,
    name,
    firstName: first,
    lastName: last,
    time,
  }
}

export function parseZielZeitTotalFromText(text: string): number | undefined {
  const matches = [...text.matchAll(new RegExp(FINISHER_TOTAL_RE.source, 'gi'))]
  const last = matches.at(-1)
  return last?.[1] ? Number(last[1]) : undefined
}

export function parseZielZeitPdfText(text: string): ZielZeitPdfParseResult {
  const rows: ZielZeitResultRow[] = []

  for (const line of text.split(/\r?\n/)) {
    const row = parseZielZeitResultLine(line)
    if (row) rows.push(row)
  }

  return {
    rows,
    totalParticipants: parseZielZeitTotalFromText(text) ?? rows.length,
  }
}

export function buildZielZeitPdfUrl(parts: Pick<ZielZeitUrlParts, 'pdfPath' | 'origin'>): string {
  const path = parts.pdfPath.startsWith('/') ? parts.pdfPath : `/${parts.pdfPath}`
  return `${parts.origin}${path}`
}
