import type { OfficialResultCandidate, UserResultsProfile } from './types.js'
import { namesMatch } from './matchName.js'

/**
 * STGK publishes a PDF per distance, linked from the event's results page.
 *
 * The rankings arrive as tab separated fields, in an order that has nothing to
 * do with the printed columns:
 *
 *   bib · family name · given name · position · nationality · age-class
 *   position · club · age class · time
 *
 * Two things make that less tidy than it sounds. A long club name wraps, and
 * the rest of the row lands on the following lines. And a runner with no club
 * leaves the field out altogether rather than empty, which shifts every index
 * after it, so the tail is read from the end.
 */

export type StgkRanking = 'overall' | 'ageclass'

export type StgkResultLink = {
  url: string
  /** The competition as the page names it, such as `Adventlauf`. */
  competition: string
  ranking: StgkRanking
  year?: number
}

export type StgkResultRow = {
  position: number
  bib: string
  firstName: string
  lastName: string
  time: string
  ageClass?: string
  club?: string
  /**
   * The runners this row is ranked against.
   *
   * A `-gesamt` PDF is not one ranking. It holds the men's and then the women's,
   * each numbered from one, so a row's field is its own block and never the
   * document.
   */
  fieldSize: number
}

const TIME = /^\d{1,2}:\d{2}:\d{2}$/
const PDF_LINK = /<a[^>]+href="([^"]*\/Ergebnisse\/[^"]*\.pdf)"[^>]*>([\s\S]*?)<\/a>/gi
const OVERALL_LABEL = /gesamtwertung/i
const AGE_CLASS_LABEL = /altersklassenwertung/i
const YEAR = /\((\d{4})/

/** A wrapped row cannot plausibly run longer than this; a guard, not a rule. */
const MAX_ROW_FIELDS = 40

function fieldsOf(line: string): string[] {
  return line
    .split('\t')
    .map((field) => field.trim())
    .filter((field) => field.length > 0)
}

function startsRow(fields: string[]): boolean {
  return fields.length >= 6 && /^\d+$/.test(fields[0] ?? '') && /^\d+$/.test(fields[3] ?? '')
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

export type StgkUrlParts = {
  origin: string
  /** What the runner pasted, kept for provenance. */
  pageUrl: string
  /** Set when they pasted one ranking rather than the event's results page. */
  pdfUrl?: string
}

export function parseStgkUrl(url: string): StgkUrlParts | null {
  try {
    const parsed = new URL(url)
    if (!parsed.hostname.toLowerCase().includes('stgk.de')) return null

    const isPdf = /\.pdf$/i.test(parsed.pathname)
    const isResultsPage = /ergebnis/i.test(parsed.pathname)
    if (!isPdf && !isResultsPage) return null

    return {
      origin: parsed.origin,
      pageUrl: parsed.toString(),
      pdfUrl: isPdf ? parsed.toString() : undefined,
    }
  } catch {
    return null
  }
}

export function parseStgkResultLinks(html: string, origin: string): StgkResultLink[] {
  const links: StgkResultLink[] = []

  for (const match of html.matchAll(PDF_LINK)) {
    const href = match[1] ?? ''
    const label = stripTags(match[2] ?? '')
    if (!label) continue

    const ranking: StgkRanking | null = OVERALL_LABEL.test(label)
      ? 'overall'
      : AGE_CLASS_LABEL.test(label)
        ? 'ageclass'
        : null
    if (!ranking) continue

    const competition = label.split('-')[0]?.trim() ?? ''
    const year = YEAR.exec(label)?.[1]

    links.push({
      url: href.startsWith('http') ? href : new URL(href, origin).toString(),
      competition,
      ranking,
      year: year ? Number(year) : undefined,
    })
  }

  return links
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * The overall rankings to read, for a race the app knows by name.
 *
 * An event page carries every distance of the day, five of them at Flensburg.
 * `39. Flensburger Adventlauf` names the `Adventlauf` ranking, and when the
 * name settles it we open that one and stop: a club's server should not be
 * asked for four PDFs to answer a question one of them answers.
 *
 * The full list comes back only when the name settles nothing, because reading
 * a few beats telling somebody their result is not there.
 */
export function selectStgkOverallLinks(links: StgkResultLink[], eventName?: string): StgkResultLink[] {
  const overall = links.filter((link) => link.ranking === 'overall')
  const haystack = normalize(eventName ?? '')
  if (!haystack) return overall

  const named = overall.filter((link) => {
    const competition = normalize(link.competition)
    return competition.length > 0 && haystack.includes(competition)
  })

  return named.length > 0 ? named : overall
}

export function parseStgkPdfRows(text: string): StgkResultRow[] {
  const collected: Omit<StgkResultRow, 'fieldSize'>[] = []
  let row: string[] | null = null

  for (const line of text.split(/\r?\n/)) {
    const fields = fieldsOf(line)

    if (startsRow(fields)) row = [...fields]
    else if (row) row.push(...fields)
    else continue

    if (row.length > MAX_ROW_FIELDS) {
      row = null
      continue
    }

    const time = row[row.length - 1] ?? ''
    if (row.length < 8 || !TIME.test(time)) continue

    collected.push({
      position: Number(row[3]),
      bib: row[0] ?? '',
      lastName: row[1] ?? '',
      firstName: row[2] ?? '',
      time,
      ageClass: row[row.length - 2] || undefined,
      club: row.slice(6, row.length - 2).join(' ') || undefined,
    })
    row = null
  }

  return withFieldSizes(collected)
}

/**
 * Splits the document where the numbering starts over, and tells every row how
 * big its own ranking was.
 */
function withFieldSizes(rows: Omit<StgkResultRow, 'fieldSize'>[]): StgkResultRow[] {
  const blocks: Omit<StgkResultRow, 'fieldSize'>[][] = []

  for (const row of rows) {
    const current = blocks[blocks.length - 1]
    if (!current || row.position <= (current[current.length - 1]?.position ?? 0)) blocks.push([row])
    else current.push(row)
  }

  return blocks.flatMap((block) => {
    const fieldSize = block.reduce((highest, row) => Math.max(highest, row.position), 0)
    return block.map((row) => ({ ...row, fieldSize }))
  })
}

export function stgkPdfCandidates(
  text: string,
  profile: UserResultsProfile,
  sourceUrl: string,
): OfficialResultCandidate[] {
  return parseStgkPdfRows(text)
    .filter((row) => namesMatch(profile, row.firstName, row.lastName))
    .map((row) => ({
      platform: 'stgk' as const,
      matchedName: [row.firstName, row.lastName].filter(Boolean).join(' '),
      time: row.time,
      position: row.position,
      totalParticipants: row.fieldSize,
      sourceUrl,
      confidence: 'high' as const,
    }))
}
