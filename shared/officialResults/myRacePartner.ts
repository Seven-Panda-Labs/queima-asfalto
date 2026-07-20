export const MYRACEPARTNER_ORIGIN = 'https://myracepartner.com'

export type MyRacePartnerCsvRow = {
  position?: number
  name: string
  note: string
}

export type MyRacePartnerHtmlRow = {
  position?: number
  name: string
  time: string
}

/** Move query params out of hash fragments like `#ergebnisse?result-id=…`. */
export function normalizeMyRacePartnerUrl(url: string): string {
  try {
    const parsed = new URL(url.trim())
    const hash = parsed.hash.replace(/^#/, '')
    if (hash.includes('?')) {
      const [hashPath, hashQuery] = hash.split('?', 2)
      const hashParams = new URLSearchParams(hashQuery)
      for (const [key, value] of hashParams) {
        if (!parsed.searchParams.has(key)) parsed.searchParams.set(key, value)
      }
      parsed.hash = hashPath ? `#${hashPath}` : ''
    }
    return parsed.toString()
  } catch {
    return url.trim()
  }
}

export function stripCsvBom(csv: string): string {
  return csv.replace(/^\uFEFF/, '')
}

export function isMyRacePartnerCsv(csv: string): boolean {
  const start = stripCsvBom(csv).trimStart()
  return start.startsWith('eventName;')
}

function parsePosition(value: string): number | undefined {
  const match = /(\d+)/.exec(value)
  return match ? Number(match[1]) : undefined
}

/** Parse semicolon-separated CSV lines with optional quoted fields. */
export function parseSemicolonCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (ch === ';' && !inQuotes) {
      fields.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }

  fields.push(current.trim())
  return fields
}

export function buildMyRacePartnerCsvUrl(resultId: string, origin = MYRACEPARTNER_ORIGIN): string {
  const params = new URLSearchParams({
    action: 'mrp_export_results_csv',
    'result-id': resultId,
  })
  return `${origin}/wp-admin/admin-post.php?${params.toString()}`
}

export function parseMyRacePartnerResultIdsFromHtml(html: string): string[] {
  const ids = new Set<string>()
  for (const match of html.matchAll(/result-id=(\d+)/gi)) {
    if (match[1]) ids.add(match[1])
  }
  for (const match of html.matchAll(/data-frmval="(\d{5,})"/gi)) {
    if (match[1]) ids.add(match[1])
  }
  return [...ids]
}

/** Time in note column: `in 59:29,35` or `in 1:02:34,56`. */
export function parseMyRacePartnerTime(note: string): string | null {
  const trimmed = note.trim().replace(/^in\s+/i, '')
  const hms = /^(\d{1,2}):(\d{2}):(\d{2})(?:,\d+)?$/.exec(trimmed)
  if (hms) {
    return `${hms[1]!.padStart(2, '0')}:${hms[2]}:${hms[3]}`
  }

  const ms = /^(\d{1,2}):(\d{2})(?:,\d+)?$/.exec(trimmed)
  if (ms) {
    return `00:${ms[1]!.padStart(2, '0')}:${ms[2]}`
  }

  return null
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function parseHtmlTime(cellHtml: string): string | null {
  const text = cellHtml
    .replace(/<small>([\s\S]*?)<\/small>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .trim()
  return parseMyRacePartnerTime(`in ${text}`)
}

export function parseMyRacePartnerHtmlRows(html: string): MyRacePartnerHtmlRow[] {
  const rows: MyRacePartnerHtmlRow[] = []
  const rowPattern = /<tr class="result-[^"]* row">([\s\S]*?)<\/tr>/gi

  for (const match of html.matchAll(rowPattern)) {
    const rowHtml = match[1] ?? ''
    const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) => cell[1] ?? '')
    if (cells.length < 6) continue

    const name = stripHtml(cells[2]?.match(/<a[^>]*>([\s\S]*?)<\/a>/i)?.[1] ?? cells[2] ?? '')
    const time = parseHtmlTime(cells[5] ?? '')
    if (!name || !time) continue

    rows.push({
      position: parsePosition(stripHtml(cells[0] ?? '')),
      name,
      time,
    })
  }

  return rows
}

export function parseMyRacePartnerSummaryTotalFromHtml(html: string): number | undefined {
  const match = /(\d+)\s+Ergebnisse/i.exec(html)
  return match ? Number(match[1]) : undefined
}

export function parseMyRacePartnerCsv(csv: string): MyRacePartnerCsvRow[] {
  const lines = stripCsvBom(csv).split(/\r?\n/).filter((line) => line.trim())
  if (lines.length < 2) return []

  const rows: MyRacePartnerCsvRow[] = []
  for (const line of lines.slice(1)) {
    const fields = parseSemicolonCsvLine(line)
    if (fields.length < 13) continue

    const name = fields[5] ?? ''
    const note = fields[12] ?? ''
    if (!name || !note) continue

    rows.push({
      position: parsePosition(fields[2] ?? ''),
      name,
      note,
    })
  }

  return rows
}
