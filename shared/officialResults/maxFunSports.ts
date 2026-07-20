export type MaxFunSportsUrlParts = {
  competitionId: string
  pageUrl: string
  fetchBasePath: '/result/competition' | '/event/competition'
  origin: string
  lang?: string
}

export type MaxFunSportsResultRow = {
  position?: number
  firstName: string
  lastName: string
  time: string
}

export const MAXFUN_SPORTS_WWW_ORIGIN = 'https://www.maxfunsports.com'

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function parsePosition(value: string): number | undefined {
  const match = /(\d+)/.exec(value)
  return match ? Number(match[1]) : undefined
}

export function buildMaxFunSportsCompetitionUrl(parts: MaxFunSportsUrlParts, extra?: URLSearchParams): string {
  const params = new URLSearchParams(extra)
  params.set('id', parts.competitionId)
  if (!params.has('page')) params.set('page', '1')
  if (!params.has('per-page')) params.set('per-page', '50')
  if (parts.lang) params.set('lang', parts.lang)
  return `${parts.origin}${parts.fetchBasePath}?${params.toString()}`
}

export function buildMaxFunSportsSearchUrl(parts: MaxFunSportsUrlParts, term: string): string {
  const params = new URLSearchParams()
  params.set('ResultSearch[last_name]', term)
  return buildMaxFunSportsCompetitionUrl(parts, params)
}

/** Iframe pages omit the entry summary — always load totals from the main site. */
export function buildMaxFunSportsWwwSummaryUrl(competitionId: string): string {
  return buildMaxFunSportsCompetitionUrl({
    competitionId,
    pageUrl: '',
    fetchBasePath: '/result/competition',
    origin: MAXFUN_SPORTS_WWW_ORIGIN,
  })
}

export function parseMaxFunSportsSummaryTotal(html: string): number | undefined {
  const match = /von\s+<b>([\d.,]+)<\/b>\s+Eintr/i.exec(html)
  if (!match?.[1]) return undefined
  return Number(match[1].replace(/\./g, '').replace(/,/g, ''))
}

export function parseMaxFunSportsResultRows(html: string): MaxFunSportsResultRow[] {
  const rows: MaxFunSportsResultRow[] = []
  const rowPattern = /<tr\s+data-key="[^"]*">([\s\S]*?)<\/tr>/gi

  for (const match of html.matchAll(rowPattern)) {
    const rowHtml = match[1] ?? ''
    const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) =>
      stripHtml(cell[1] ?? ''),
    )
    if (cells.length < 4) continue

    const firstName = cells[2] ?? ''
    const lastName = cells[3] ?? ''
    const position = parsePosition(cells[0] ?? '')
    const time = cells.length >= 11 ? (cells[10] ?? '') : (cells[7] ?? cells[6] ?? '')

    if (!firstName || !lastName || !time) continue
    rows.push({ position, firstName, lastName, time })
  }

  return rows
}
