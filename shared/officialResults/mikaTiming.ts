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
  /** Absent when the event's search list shows no finish time. The detail page has it. */
  time?: string
  event?: string
  /** The runner's id on this instance, to open their detail page. */
  runnerId?: string
}

export type MikaTimingDetailResult = {
  time: string
  position?: number
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
  const labeledPatterns = [
    /list-label">Finish<\/div>\s*([^<]+)/i,
    /list-label">Time Total \(Netto\)<\/div>\s*([^<]+)/i,
    /list-label">[^<]*\bNetto\b[^<]*<\/div>\s*([^<]+)/i,
  ]
  for (const pattern of labeledPatterns) {
    const match = pattern.exec(rowHtml)
    if (match?.[1]) {
      const time = parseMikaTimingTime(stripHtml(match[1]))
      if (time) return time
    }
  }

  const times = [...rowHtml.matchAll(/<div class="[^"]*\btype-time\b"[^>]*>([\s\S]*?)<\/div>/gi)]
    .map((match) => {
      const inner = match[1] ?? ''
      const withoutLabelDivs = inner.replace(/<div[^>]*>[\s\S]*?<\/div>/gi, '')
      return parseMikaTimingTime(stripHtml(withoutLabelDivs))
    })
    .filter((value): value is string => value !== null)

  return times.at(-1) ?? null
}

/** Event codes from multi-discipline search shells (e.g. `event-CN10` on result rows). */
export function parseMikaTimingSearchEventCodesFromHtml(html: string): string[] {
  const codes = new Set<string>()
  for (const match of html.matchAll(/\bevent-([A-Z][A-Z0-9]*)\b/g)) {
    codes.add(match[1]!)
  }
  for (const code of parseMikaTimingEventCodesFromSelect(html)) {
    codes.add(code)
  }
  return [...codes]
}

/**
 * Event codes from the race picker.
 *
 * Newer instances put nothing in the class names and offer the codes only as
 * `<select name="event">` options, so a search with no event finds nobody until
 * one of these is passed.
 */
export function parseMikaTimingEventCodesFromSelect(html: string): string[] {
  const codes = new Set<string>()
  for (const select of html.matchAll(/<select[^>]*\bname="event"[^>]*>([\s\S]*?)<\/select>/gi)) {
    for (const option of (select[1] ?? '').matchAll(/<option[^>]*\bvalue="([^"]+)"/gi)) {
      const value = option[1]!.trim()
      // A bare year is the season picker, not a race.
      if (value && !/^\d{4}$/.test(value)) codes.add(value)
    }
  }
  return [...codes]
}

export type MikaTimingOverallPlaceColumn = 'primary' | 'secondary'

function extractListGroupHeaderHtml(html: string): string | undefined {
  const match = /<li class="[^"]*list-group-header[^"]*"[^>]*>([\s\S]*?)<\/li>/i.exec(html)
  return match?.[1]
}

/** Which place column is overall rank (varies by event layout). */
export function parseMikaTimingOverallPlaceColumn(html: string): MikaTimingOverallPlaceColumn {
  const header = extractListGroupHeaderHtml(html) ?? ''
  if (
    /field-place_nosex[\s\S]{0,240}?place-secondary|place-secondary[\s\S]{0,120}?Overall/i.test(
      header,
    )
  ) {
    return 'secondary'
  }
  if (
    /field-place_all[\s\S]{0,240}?place-primary|field-place_age[\s\S]{0,240}?place-secondary/i.test(
      header,
    )
  ) {
    return 'primary'
  }
  return 'secondary'
}

function parseOverallPlaceFromRow(
  rowHtml: string,
  column: MikaTimingOverallPlaceColumn,
): number | null {
  const pattern =
    column === 'primary'
      ? /class="[^"]*\bplace-primary\b[^"]*\bnumeric\b[^"]*"[^>]*>\s*(\d+)\s*</i
      : /class="[^"]*\bplace-secondary\b[^"]*\bnumeric\b[^"]*"[^>]*>\s*(\d+)\s*</i
  const placeMatch = pattern.exec(rowHtml)
  if (!placeMatch?.[1]) return null
  const position = Number(placeMatch[1])
  return Number.isFinite(position) ? position : null
}

export function parseMikaTimingSearchRows(html: string): MikaTimingSearchRow[] {
  const rows: MikaTimingSearchRow[] = []
  const placeColumn = parseMikaTimingOverallPlaceColumn(html)

  for (const rowMatch of html.matchAll(
    /<li class="[^"]*list-group-item row(?![^"]*list-group-header)[^"]*">([\s\S]*?)<\/li>/gi,
  )) {
    const rowHtml = rowMatch[1] ?? ''
    const position = parseOverallPlaceFromRow(rowHtml, placeColumn)
    // The name is a link on most events and plain text on others, so the link is optional.
    const nameMatch = /<h4 class="[^"]*type-fullname"[^>]*>([\s\S]*?)<\/h4>/i.exec(rowHtml)
    if (position === null || !nameMatch?.[1]) continue

    const nameHtml = nameMatch[1]
    const href = /<a[^>]*href="([^"]*)"/i.exec(nameHtml)?.[1]
    const rawName = stripHtml(nameHtml)
    if (!rawName) continue

    const { displayName, firstName, lastName } = parseMikaTimingDisplayName(rawName)
    rows.push({
      position,
      displayName,
      firstName,
      lastName,
      time: parseFinishTimeFromRow(rowHtml) ?? undefined,
      event: href ? parseMikaTimingEventFromHref(href) : undefined,
      runnerId: parseMikaTimingRunnerId(rowHtml, href),
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

/**
 * The runner's id, to open their detail page.
 *
 * Taken from the link on the name where there is one, and otherwise from the
 * "add to favourites" payload, which carries the same id on the search lists
 * that link nowhere.
 */
export function parseMikaTimingRunnerId(rowHtml: string, href?: string): string | undefined {
  const fromHref = href ? /[?&]idp=([^&"]+)/i.exec(href.replace(/&amp;/g, '&')) : null
  if (fromHref?.[1]) return decodeURIComponent(fromHref[1])

  for (const match of rowHtml.matchAll(/data-silver="([0-9,]+)"/gi)) {
    const decoded = decodeMikaTimingSilverQuery(match[1] ?? '').replace(/&amp;/g, '&')
    const id = /[?&](?:favorite_add|idp)=([^&"]+)/i.exec(decoded)
    if (id?.[1]) return decodeURIComponent(id[1])
  }

  return undefined
}

export function buildMikaTimingDetailUrl(
  parts: Pick<MikaTimingUrlParts, 'baseUrl' | 'lang' | 'event'>,
  runnerId: string,
): string {
  const search = new URLSearchParams({
    content: 'detail',
    fpid: 'search',
    pid: 'search',
    idp: runnerId,
    lang: parts.lang,
  })
  if (parts.event) search.set('event', parts.event)
  return `${parts.baseUrl}?${search.toString()}`
}

/** Reads one field out of the detail page's result table, which is keyed by stable classes. */
function parseDetailField(html: string, field: string): string | undefined {
  const match = new RegExp(
    `<td class="[^"]*\\bf-${field}\\b[^"]*"[^>]*>([\\s\\S]*?)</td>`,
    'i',
  ).exec(html)
  const value = match?.[1] ? stripHtml(match[1]) : ''
  return value || undefined
}

/**
 * A runner's result from their own detail page.
 *
 * Net time is what the app records, so gun time is only a fallback for events
 * that publish nothing else.
 */
export function parseMikaTimingDetailResult(html: string): MikaTimingDetailResult | null {
  const time =
    parseMikaTimingTime(parseDetailField(html, 'time_finish_netto') ?? '') ??
    parseMikaTimingTime(parseDetailField(html, 'time_finish_brutto') ?? '')
  if (!time) return null

  const place = Number(parseDetailField(html, 'place_all'))
  return {
    time,
    position: Number.isFinite(place) && place > 0 ? place : undefined,
  }
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

/** Total finisher count from list header (reliable when pagination does not expose max place). */
export function parseMikaTimingListParticipantCount(html: string): number | undefined {
  const match = /list-info__text str_num">(\d+) Results</i.exec(html)
  if (!match?.[1]) return undefined
  const count = Number(match[1])
  return Number.isFinite(count) ? count : undefined
}

export function parseMikaTimingMaxOverallPlace(html: string): number | undefined {
  const column = parseMikaTimingOverallPlaceColumn(html)
  const pattern =
    column === 'primary'
      ? /\bplace-primary\b[^"]*\bnumeric\b[^>]*>\s*(\d+)\s*</gi
      : /\bplace-secondary\b[^"]*\bnumeric\b[^>]*>\s*(\d+)\s*</gi
  const places = [...html.matchAll(pattern)].map((match) => Number(match[1]))
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
  parts: Pick<MikaTimingUrlParts, 'lang' | 'event'> & { mainGroup?: string },
  numResults = '25',
  sex = '',
): MikaTimingListFormFields {
  return {
    lang: parts.lang,
    startpage: 'start_responsive',
    startpage_type: 'lists',
    // Older instances group by "runner"; newer ones by season, and sending the
    // wrong one lists every race on the site instead of this one.
    event_main_group: parts.mainGroup ?? 'runner',
    event: parts.event ?? 'MAR',
    'search[sex]': sex,
    'search[age_class]': '%',
    num_results: numResults,
    submit: '',
  }
}

/**
 * The race a runner's detail page belongs to.
 *
 * The page mentions several `event=` values, only one of which is a race, so the
 * codes the picker offered decide which. Needed when the search found the runner
 * without being told a race: nothing else then says which one they ran.
 */
export function parseMikaTimingDetailEvent(
  html: string,
  knownCodes: string[],
): string | undefined {
  const mentioned = new Set<string>()
  for (const match of html.matchAll(/[?&;]event=([A-Za-z0-9_]+)/g)) {
    mentioned.add(match[1]!)
  }
  return knownCodes.find((code) => mentioned.has(code))
}

/**
 * The value the race picker pairs with `event`.
 *
 * Reading it beats assuming "runner": with the wrong group the list ignores the
 * race and counts the whole site.
 */
export function parseMikaTimingEventMainGroup(html: string): string | undefined {
  const select = /<select[^>]*\bname="event_main_group"[^>]*>([\s\S]*?)<\/select>/i.exec(html)
  if (!select?.[1]) return undefined

  const selected = /<option[^>]*\bvalue="([^"]+)"[^>]*\bselected/i.exec(select[1])
  if (selected?.[1]) return selected[1].trim()

  return /<option[^>]*\bvalue="([^"]+)"/i.exec(select[1])?.[1]?.trim()
}
