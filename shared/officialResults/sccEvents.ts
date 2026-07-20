export const SCC_EVENTS_API_BASE = 'https://api.results.scc-events.com'

export type SccEventsCompetition = {
  competition_ident: string
  label_de?: string
  label_en?: string
  tablename: string
}

export type SccEventsEdition = {
  year: number | string
  competitions: SccEventsCompetition[]
}

export type SccEventsEventConfig = {
  ident: string
  editions: Record<string, SccEventsEdition>
}

export type SccEventsResultRow = {
  vorname?: string
  nachname?: string
  name?: string
  platz?: number
  netto?: string
  brutto?: string
}

export type SccEventsResultsResponse = {
  recordsTotal?: number
  recordsFiltered?: number
  data?: SccEventsResultRow[]
}

const SCC_EVENT_KEY_DATA_URL_PATTERN =
  /data-url-config="https:\/\/api\.results\.scc-events\.com\/event\/([A-Z0-9]+)"/i
const SCC_EVENT_KEY_PATTERN = /api\.results\.scc-events\.com\/event\/([A-Z0-9]+)/i

/** Paths used on SCC event microsites for official results (DE/EN vary by event). */
export function isSccEventsResultsPath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (/\/your-race\/results$/i.test(path)) return true
  if (/\/ergebnisse$/i.test(path)) return true
  return false
}

export function buildSccEventConfigUrl(eventKey: string): string {
  return `${SCC_EVENTS_API_BASE}/event/${eventKey}`
}

export function parseSccEventKeyFromHtml(html: string): string | null {
  const fromDataUrl = SCC_EVENT_KEY_DATA_URL_PATTERN.exec(html)
  if (fromDataUrl?.[1]) return fromDataUrl[1]
  const match = SCC_EVENT_KEY_PATTERN.exec(html)
  return match?.[1] ?? null
}

export function resolveSccEdition(
  config: SccEventsEventConfig,
  year: number,
): SccEventsEdition | null {
  return config.editions[String(year)] ?? null
}

function normalizeCompetitionLabel(label: string): string {
  return label
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}

export function isSccRunningCompetition(competition: SccEventsCompetition): boolean {
  const label = normalizeCompetitionLabel(
    [competition.label_de, competition.label_en].filter(Boolean).join(' '),
  )
  if (/inline|skating|rollstuhl|handbike|handbiker/i.test(label)) return false
  return /lauf|laufer|marathon|walk|runner/i.test(label)
}

export function runningCompetitionsForEdition(edition: SccEventsEdition): SccEventsCompetition[] {
  return edition.competitions.filter(isSccRunningCompetition)
}

export function buildSccResultsSearchUrl(params: {
  eventKey: string
  competitionIdent: string
  year: string
  tableName: string
  term: string
  pageSize?: number
}): string {
  const search = new URLSearchParams({
    ek: params.eventKey,
    ci: params.competitionIdent,
    y: params.year,
    t: params.tableName,
    draw: '1',
    start: '0',
    length: String(params.pageSize ?? 25),
  })
  search.set('search[value]', params.term)
  search.set('search[regex]', 'false')

  for (const [index, data] of [
    ['0', 'platz'],
    ['2', 'nachname'],
    ['3', 'vorname'],
  ] as const) {
    search.set(`columns[${index}][data]`, data)
    search.set(`columns[${index}][searchable]`, 'true')
    search.set(`columns[${index}][search][value]`, '')
  }

  return `${SCC_EVENTS_API_BASE}/result?${search.toString()}`
}

export function buildSccResultsPageUrl(params: {
  eventKey: string
  competitionIdent: string
  year: string
  tableName: string
  start?: number
  length?: number
}): string {
  const search = new URLSearchParams({
    ek: params.eventKey,
    ci: params.competitionIdent,
    y: params.year,
    t: params.tableName,
    draw: '1',
    start: String(params.start ?? 0),
    length: String(params.length ?? 1),
  })
  return `${SCC_EVENTS_API_BASE}/result?${search.toString()}`
}
