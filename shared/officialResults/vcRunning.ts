import { splitFullName } from './matchName.js'

export const VCRUNNING_RESULTS_ORIGIN = 'https://resultados.valenciaciudaddelrunning.com'

export type VcRunningEventKey = 'medio-maraton' | 'maraton'

export type VcRunningUrlParts = {
  locale: string
  year: string
  eventKey: VcRunningEventKey
  eventType: 'mm' | 'm'
  pageUrl: string
  searchUrl: string
  origin: string
}

export type VcRunningResultRow = {
  position: number
  name: string
  firstName: string
  lastName: string
  time: string
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function localePrefix(locale: string): string {
  return locale ? `/${locale}` : ''
}

function eventScriptPath(
  locale: string,
  year: string,
  eventKey: VcRunningEventKey,
  script: string,
): string {
  const prefix = localePrefix(locale)
  if (eventKey === 'maraton') {
    return `${prefix}/${year}/${script}`
  }
  return `${prefix}/${script}`
}

export function buildVcRunningPageUrl(parts: Pick<VcRunningUrlParts, 'locale' | 'year' | 'eventKey'>): string {
  const path = eventScriptPath(parts.locale, parts.year, parts.eventKey, `${parts.eventKey}.php`)
  if (parts.eventKey === 'maraton') {
    return `${VCRUNNING_RESULTS_ORIGIN}${path}?y=${parts.year}`
  }
  return `${VCRUNNING_RESULTS_ORIGIN}${path}`
}

export function buildVcRunningSearchUrl(parts: Pick<VcRunningUrlParts, 'locale' | 'year' | 'eventKey'>): string {
  const path = eventScriptPath(parts.locale, parts.year, parts.eventKey, `${parts.eventKey}-buscar.php`)
  return `${VCRUNNING_RESULTS_ORIGIN}${path}?y=${parts.year}`
}

export function buildVcRunningDtUrl(parts: Pick<VcRunningUrlParts, 'locale'>): string {
  return `${VCRUNNING_RESULTS_ORIGIN}${localePrefix(parts.locale)}/include/dt-server-side.php`
}

export function buildVcRunningSearchBody(searchTerm: string): string {
  const params = new URLSearchParams()
  params.set('txtdorsal', '')
  params.set('txtapellidos', searchTerm)
  return params.toString()
}

export function buildVcRunningDtBody(year: string, eventType: 'mm' | 'm'): string {
  const params = new URLSearchParams()
  params.set('draw', '1')
  params.set('start', '0')
  params.set('length', '1')
  params.set('search[value]', '')
  params.set('search[regex]', 'false')
  params.set('y', year)
  params.set('t', eventType)
  return params.toString()
}

export function parseVcRunningName(fullName: string): { first: string; last: string } {
  const trimmed = fullName.trim()
  const commaIdx = trimmed.indexOf(',')
  if (commaIdx >= 0) {
    return {
      last: trimmed.slice(0, commaIdx).trim(),
      first: trimmed.slice(commaIdx + 1).trim(),
    }
  }

  return splitFullName(trimmed)
}

export function parseVcRunningTime(value: string): string | null {
  const trimmed = value.trim()
  const hms = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(trimmed)
  if (hms) {
    return `${hms[1]!.padStart(2, '0')}:${hms[2]}:${hms[3]}`
  }

  const ms = /^(\d{1,2}):(\d{2})$/.exec(trimmed)
  if (ms) {
    return `00:${ms[1]!.padStart(2, '0')}:${ms[2]}`
  }

  return null
}

export function parseVcRunningTotalParticipants(payload: unknown): number | undefined {
  if (!payload || typeof payload !== 'object') return undefined

  const total = (payload as { recordsTotal?: unknown }).recordsTotal
  const parsed = typeof total === 'number' ? total : Number(total)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

export function parseVcRunningResultRows(html: string): VcRunningResultRow[] {
  const tableMatch = /id="tabModulos"[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/i.exec(html)
  if (!tableMatch?.[1]) return []

  const rows: VcRunningResultRow[] = []

  for (const rowMatch of tableMatch[1].matchAll(/<tr>([\s\S]*?)<\/tr>/gi)) {
    const rowHtml = rowMatch[1] ?? ''
    const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) =>
      stripHtml(cell[1] ?? ''),
    )
    if (cells.length < 5) continue

    const position = Number(cells[0])
    const name = cells[3]?.trim()
    const officialTime = parseVcRunningTime(cells[4] ?? '')
    const realTime = cells.length >= 6 ? parseVcRunningTime(cells[5] ?? '') : null
    const time = realTime ?? officialTime
    if (!Number.isFinite(position) || !name || !time) continue

    const { first, last } = parseVcRunningName(name)
    if (!last) continue

    rows.push({
      position,
      name,
      firstName: first,
      lastName: last,
      time,
    })
  }

  return rows
}

function resolveYearFromPath(pathname: string, queryYear?: string | null, fallbackYear?: number): string {
  const fromQuery = queryYear?.trim()
  if (fromQuery && /^20\d{2}$/.test(fromQuery)) return fromQuery

  const fromPath = /(20\d{2})/.exec(pathname)?.[1]
  if (fromPath) return fromPath

  if (fallbackYear && fallbackYear >= 2000 && fallbackYear <= 2099) {
    return String(fallbackYear)
  }

  return ''
}

function buildVcRunningParts(
  locale: string,
  year: string,
  eventKey: VcRunningEventKey,
): VcRunningUrlParts {
  const eventType: 'mm' | 'm' = eventKey === 'medio-maraton' ? 'mm' : 'm'
  const base = { locale, year, eventKey, eventType, origin: VCRUNNING_RESULTS_ORIGIN }
  return {
    ...base,
    pageUrl: buildVcRunningPageUrl(base),
    searchUrl: buildVcRunningSearchUrl(base),
  }
}

function parseVcRunningResultsUrl(url: URL, fallbackYear?: number): VcRunningUrlParts | null {
  const host = url.hostname.toLowerCase()
  if (!host.includes('resultados.valenciaciudaddelrunning.com')) return null

  const segments = url.pathname.split('/').filter(Boolean)
  let idx = 0
  let locale = ''

  if (segments[0] === 'en' || segments[0] === 'va') {
    locale = segments[0]!
    idx += 1
  }

  let year = url.searchParams.get('y')?.trim() ?? ''
  if (segments[idx] && /^20\d{2}$/.test(segments[idx]!)) {
    year = year || segments[idx]!
    idx += 1
  }

  const file = segments[idx] ?? ''
  let eventKey: VcRunningEventKey | null = null
  if (/^medio-maraton(?:-buscar)?\.php$/i.test(file)) eventKey = 'medio-maraton'
  if (/^maraton(?:-buscar)?\.php$/i.test(file)) eventKey = 'maraton'
  if (!eventKey) return null

  const resolvedYear = year || resolveYearFromPath(url.pathname, null, fallbackYear)
  if (!resolvedYear) return null

  return buildVcRunningParts(locale, resolvedYear, eventKey)
}

function parseVcRunningMarketingUrl(url: URL, fallbackYear?: number): VcRunningUrlParts | null {
  const host = url.hostname.toLowerCase()
  if (!host.includes('valenciaciudaddelrunning.com') || host.startsWith('resultados.')) return null

  const path = url.pathname.toLowerCase()
  let locale = ''
  let eventKey: VcRunningEventKey | null = null

  if (path.includes('/en/half/')) {
    locale = 'en'
    eventKey = 'medio-maraton'
  } else if (path.includes('/medio/')) {
    locale = ''
    eventKey = 'medio-maraton'
  } else if (path.includes('/va/mitja/')) {
    locale = 'va'
    eventKey = 'medio-maraton'
  } else if (path.includes('/en/marathon/')) {
    locale = 'en'
    eventKey = 'maraton'
  } else if (path.includes('/maraton/')) {
    locale = ''
    eventKey = 'maraton'
  }

  if (!eventKey) return null

  const year = resolveYearFromPath(url.pathname, url.searchParams.get('y'), fallbackYear)
  if (!year) return null

  return buildVcRunningParts(locale, year, eventKey)
}

export function parseVcRunningUrl(url: string, fallbackYear?: number): VcRunningUrlParts | null {
  try {
    const parsed = new URL(url.trim())
    return parseVcRunningResultsUrl(parsed, fallbackYear) ?? parseVcRunningMarketingUrl(parsed, fallbackYear)
  } catch {
    return null
  }
}

export function isVcRunningResultsPath(pathname: string): boolean {
  return /medio-maraton|maraton/i.test(pathname)
}

export function isVcRunningMarketingPath(pathname: string): boolean {
  return /\/(en\/half|medio\/|va\/mitja|en\/marathon|maraton)\//i.test(pathname)
}
