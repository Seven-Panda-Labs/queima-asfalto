export type MikaTimingUrlParts = {
  baseUrl: string
  pageUrl: string
  event?: string
  lang: string
}

export type MikaTimingSearchRow = {
  position: number
  displayName: string
  firstName: string
  lastName: string
  time: string
  event?: string
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, ' ')
    .trim()
}

export function isMikatimingHostname(hostname: string): boolean {
  return hostname.toLowerCase().includes('mikatiming')
}

export function isMikatimingCustomResultsUrl(hostname: string, pathname: string): boolean {
  return hostname.toLowerCase().startsWith('results.') && /^\/\d{4}\/?/i.test(pathname)
}

export function isMikatimingResultsHtml(html: string): boolean {
  return /mikatiming|results-static\.mikatiming/i.test(html)
}

export function parseMikaTimingBaseUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim())
    const yearMatch = /^\/(\d{4})\/?/i.exec(parsed.pathname)
    if (yearMatch?.[1]) {
      return `${parsed.origin}/${yearMatch[1]}/`
    }

    if (isMikatimingHostname(parsed.hostname)) {
      return `${parsed.origin}/`
    }
  } catch {
    return null
  }

  return null
}

export function parseMikaTimingUrl(url: string): MikaTimingUrlParts | null {
  try {
    const parsed = new URL(url.trim())
    const hostname = parsed.hostname.toLowerCase()
    const baseUrl = parseMikaTimingBaseUrl(url)

    if (!baseUrl) return null
    if (!isMikatimingHostname(hostname) && !isMikatimingCustomResultsUrl(hostname, parsed.pathname)) {
      return null
    }

    return {
      baseUrl,
      pageUrl: parsed.toString(),
      event: parsed.searchParams.get('event')?.trim() || undefined,
      lang: parsed.searchParams.get('lang')?.trim() || 'EN_CAP',
    }
  } catch {
    return null
  }
}

export function parseMikaTimingEventFromHtml(html: string): string | undefined {
  const fromBody = /class="[^"]*\bevent-([A-Z0-9_]+)\b/i.exec(html)
  if (fromBody?.[1]) return fromBody[1]

  return undefined
}

export function parseMikaTimingTime(value: string): string | null {
  const trimmed = value.trim()
  const hms = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(trimmed)
  if (hms) {
    return `${hms[1]!.padStart(2, '0')}:${hms[2]}:${hms[3]}`
  }

  const ms = /^(\d{1,2}):(\d{2})$/.exec(trimmed)
  if (ms) {
    return `${ms[1]!.padStart(2, '0')}:${ms[2]}:00`
  }

  return null
}

export function parseMikaTimingDisplayName(display: string): {
  displayName: string
  firstName: string
  lastName: string
} {
  const cleaned = display.replace(/\s*\([A-Z]{2,3}\)\s*$/u, '').trim()
  const commaIndex = cleaned.indexOf(',')
  if (commaIndex === -1) {
    return { displayName: cleaned, firstName: '', lastName: cleaned }
  }

  const lastName = cleaned.slice(0, commaIndex).trim()
  const firstName = cleaned.slice(commaIndex + 1).trim()
  return {
    displayName: [firstName, lastName].filter(Boolean).join(' '),
    firstName,
    lastName,
  }
}

export function parseMikaTimingEventFromHref(href: string): string | undefined {
  const normalized = href.replace(/&amp;/g, '&')
  try {
    const parsed = new URL(normalized, 'https://results.mikatiming.local/')
    return parsed.searchParams.get('event')?.trim() || undefined
  } catch {
    const match = /[?&]event=([^&]+)/i.exec(normalized)
    return match?.[1] ? decodeURIComponent(match[1]) : undefined
  }
}

function parseFinishTimeFromRow(rowHtml: string): string | null {
  const labeled = [
    ...rowHtml.matchAll(
      /<div class="[^"]*\btype-time\b"[^>]*>[\s\S]*?list-label">Finish<\/div>\s*([^<]+)</gi,
    ),
  ]
  if (labeled.length > 0) {
    return parseMikaTimingTime(stripHtml(labeled[labeled.length - 1]![1] ?? ''))
  }

  const times = [...rowHtml.matchAll(/<div class="[^"]*\btype-time\b"[^>]*>([\s\S]*?)<\/div>/gi)]
    .map((match) => stripHtml(match[1] ?? ''))
    .map((value) => parseMikaTimingTime(value))
    .filter((value): value is string => value !== null)

  return times.at(-1) ?? null
}

export function parseMikaTimingSearchRows(html: string): MikaTimingSearchRow[] {
  const rows: MikaTimingSearchRow[] = []

  for (const rowMatch of html.matchAll(
    /<li class="[^"]*list-group-item row(?![^"]*list-group-header)[^"]*">([\s\S]*?)<\/li>/gi,
  )) {
    const rowHtml = rowMatch[1] ?? ''
    const placeMatch = /class="[^"]*place-secondary[^"]*numeric"[^>]*>\s*(\d+)\s*</i.exec(rowHtml)
    const nameMatch = /<h4 class="[^"]*type-fullname"[^>]*>\s*<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i.exec(
      rowHtml,
    )
    if (!placeMatch?.[1] || !nameMatch?.[2]) continue

    const position = Number(placeMatch[1])
    const rawName = stripHtml(nameMatch[2])
    const time = parseFinishTimeFromRow(rowHtml)
    if (!Number.isFinite(position) || !rawName || !time) continue

    const { displayName, firstName, lastName } = parseMikaTimingDisplayName(rawName)
    rows.push({
      position,
      displayName,
      firstName,
      lastName,
      time,
      event: nameMatch[1] ? parseMikaTimingEventFromHref(nameMatch[1]) : undefined,
    })
  }

  return rows
}

export function decodeMikaTimingSilverQuery(silver: string): string {
  return silver
    .split(',')
    .map((value) => String.fromCharCode(Number(value)))
    .join('')
}

export function parseMikaTimingMaxListPage(html: string): number {
  let maxPage = 1

  for (const match of html.matchAll(/data-silver="([0-9,]+)"/g)) {
    const decoded = decodeMikaTimingSilverQuery(match[1] ?? '')
    const pageMatch = /(?:^|[?&])page=(\d+)/.exec(decoded)
    if (pageMatch?.[1]) {
      maxPage = Math.max(maxPage, Number(pageMatch[1]))
    }
  }

  return maxPage
}

export function parseMikaTimingMaxOverallPlace(html: string): number | undefined {
  const places = [...html.matchAll(/place-secondary hidden-xs numeric"[^>]*>\s*(\d+)\s*</gi)].map(
    (match) => Number(match[1]),
  )
  if (places.length === 0) return undefined
  return Math.max(...places)
}

export type MikaTimingSearchFormFields = {
  lang: string
  startpage: string
  startpage_type: string
  event_main_group: string
  event?: string
  'search[name]': string
  'search[firstname]': string
  'search[start_no]': string
  submit: string
}

export function buildMikaTimingSearchFormFields(
  parts: Pick<MikaTimingUrlParts, 'lang' | 'event'>,
  searchName: string,
  searchFirstName = '',
): MikaTimingSearchFormFields {
  const fields: MikaTimingSearchFormFields = {
    lang: parts.lang,
    startpage: 'start_responsive',
    startpage_type: 'search',
    event_main_group: 'runner',
    'search[name]': searchName,
    'search[firstname]': searchFirstName,
    'search[start_no]': '',
    submit: '',
  }

  if (parts.event) {
    fields.event = parts.event
  }

  return fields
}

export type MikaTimingListFormFields = {
  lang: string
  startpage: string
  startpage_type: string
  event_main_group: string
  event: string
  'search[sex]': string
  'search[age_class]': string
  num_results: string
  submit: string
}

export function buildMikaTimingListFormFields(
  parts: Pick<MikaTimingUrlParts, 'lang' | 'event'>,
  numResults = '25',
): MikaTimingListFormFields {
  return {
    lang: parts.lang,
    startpage: 'start_responsive',
    startpage_type: 'lists',
    event_main_group: 'runner',
    event: parts.event ?? 'MAR',
    'search[sex]': 'N',
    'search[age_class]': '%',
    num_results: numResults,
    submit: '',
  }
}
