import type { OfficialResultCandidate, UserResultsProfile } from '../shared/types.js'
import { matchesResultsProfile } from '../shared/matchName.js'
import {
  buildMikaTimingDetailUrl,
  buildMikaTimingListFormFields,
  buildMikaTimingSearchFormFields,
  isMikatimingResultsHtml,
  parseMikaTimingDetailEvent,
  parseMikaTimingDetailResult,
  parseMikaTimingEventFromHtml,
  parseMikaTimingEventMainGroup,
  parseMikaTimingListParticipantCount,
  parseMikaTimingSearchEventCodesFromHtml,
  parseMikaTimingSearchRows,
  type MikaTimingUrlParts,
} from '../shared/mikaTiming.js'
import { buildMikaTimingSearchTerm } from '../shared/mikaTimingSearch.js'
import { parseMikaTimingUrl } from '../shared/parseUrls.js'

const MIKA_TIMING_FETCH_HEADERS = {
  accept: 'text/html,application/xhtml+xml,text/plain,*/*',
  'User-Agent': 'Mozilla/5.0 (compatible; QueimaAsfalto/1.0)',
}

async function fetchMikaTimingHtml(url: string, referer: string, form?: Record<string, string>): Promise<string> {
  const init: RequestInit = {
    headers: { ...MIKA_TIMING_FETCH_HEADERS, Referer: referer },
  }

  if (form) {
    init.method = 'POST'
    init.body = new FormData()
    for (const [key, value] of Object.entries(form)) {
      ;(init.body as FormData).append(key, value)
    }
  }

  const response = await fetch(url, init)
  if (!response.ok) {
    throw new Error(`mika:timing request error: ${response.status}`)
  }
  return response.text()
}

type ResolvedMikaTiming = {
  parts: MikaTimingUrlParts & { mainGroup?: string }
  /** Races to try when the url names none. Only the landing page lists them. */
  eventCodes: string[]
}

async function resolveMikaTimingParts(resultsUrl: string): Promise<ResolvedMikaTiming | null> {
  const parts = parseMikaTimingUrl(resultsUrl)
  if (!parts) return null

  if (parts.event) return { parts, eventCodes: [] }

  const html = await fetchMikaTimingHtml(parts.baseUrl, parts.baseUrl)
  if (!isMikatimingResultsHtml(html)) return null

  return {
    parts: {
      ...parts,
      event: parseMikaTimingEventFromHtml(html),
      mainGroup: parseMikaTimingEventMainGroup(html),
    },
    eventCodes: parseMikaTimingSearchEventCodesFromHtml(html),
  }
}

/** Page size for the split lists, so the runner's place says which page holds them. */
const LIST_PAGE_SIZE = 100
const LIST_SEXES = ['M', 'W']

function fetchMikaTimingListPage(
  parts: MikaTimingUrlParts & { mainGroup?: string },
  event: string,
  page: number,
  numResults: string,
  sex: string,
): Promise<string> {
  return fetchMikaTimingHtml(
    `${parts.baseUrl}?pid=list&pidp=start&page=${page}`,
    parts.baseUrl,
    buildMikaTimingListFormFields({ ...parts, event }, numResults, sex),
  )
}

/**
 * How many finished the race the runner ran.
 *
 * Events that rank everyone together publish the count on the list header. The
 * ones that rank men and women separately answer "> 5000" instead, and their
 * place is a place within one of those two lists, so the count has to come from
 * the same list: we jump to the page the runner's place falls on and take the
 * header only once they are actually on it. A count from the other list, or
 * from an unfiltered one, would pair a real place with the wrong field.
 */
async function fetchMikaTimingTotalParticipants(
  parts: MikaTimingUrlParts & { mainGroup?: string },
  event: string,
  profile: UserResultsProfile,
  position?: number,
): Promise<number | undefined> {
  const wholeField = await fetchMikaTimingListPage(parts, event, 1, '25', '')
  const fromHeader = parseMikaTimingListParticipantCount(wholeField)
  if (fromHeader !== undefined) return fromHeader

  if (!position || position < 1) return undefined

  const page = Math.ceil(position / LIST_PAGE_SIZE)
  for (const sex of LIST_SEXES) {
    const html = await fetchMikaTimingListPage(parts, event, page, String(LIST_PAGE_SIZE), sex)
    const count = parseMikaTimingListParticipantCount(html)
    if (count === undefined) continue

    const onThisList = parseMikaTimingSearchRows(html).some(
      (row) => row.position === position && matchesResultsProfile(profile, row.displayName),
    )
    if (onThisList) return count
  }

  return undefined
}

async function searchMikaTimingRows(
  parts: MikaTimingUrlParts,
  searchName: string,
  event?: string,
): Promise<{ html: string; rows: ReturnType<typeof parseMikaTimingSearchRows> }> {
  const searchUrl = `${parts.baseUrl}?pid=search`
  const searchFields = buildMikaTimingSearchFormFields({ ...parts, event }, searchName)
  const html = await fetchMikaTimingHtml(searchUrl, parts.baseUrl, searchFields)
  return { html, rows: parseMikaTimingSearchRows(html) }
}

export async function lookupMikaTiming(
  resultsUrl: string,
  profile: UserResultsProfile,
): Promise<OfficialResultCandidate[]> {
  const resolved = await resolveMikaTimingParts(resultsUrl)
  if (!resolved) return []

  const { parts } = resolved
  const searchName = buildMikaTimingSearchTerm(profile)
  if (!searchName) return []

  const { html, rows } = await searchMikaTimingRows(parts, searchName, parts.event)
  let match = rows.find((row) => matchesResultsProfile(profile, row.displayName))
  let searchedEvent = parts.event

  if (!match && !parts.event) {
    const eventCodes = [
      ...new Set([...parseMikaTimingSearchEventCodesFromHtml(html), ...resolved.eventCodes]),
    ]
    for (const event of eventCodes) {
      const retry = await searchMikaTimingRows(parts, searchName, event)
      match = retry.rows.find((row) => matchesResultsProfile(profile, row.displayName))
      if (match) {
        searchedEvent = event
        break
      }
    }
  }

  if (!match) return []

  let event = match.event ?? searchedEvent

  // Some events publish a search list with no finish time. The runner's own page has it.
  let { time, position } = match
  if (!time && match.runnerId) {
    const detailHtml = await fetchMikaTimingHtml(
      buildMikaTimingDetailUrl({ ...parts, event }, match.runnerId),
      parts.baseUrl,
    )
    const detail = parseMikaTimingDetailResult(detailHtml)
    time = detail?.time
    position = position ?? detail?.position
    // The search can find a runner without being told a race, and then only
    // their own page says which one they ran.
    event ??= parseMikaTimingDetailEvent(detailHtml, resolved.eventCodes)
  }
  if (!time) return []

  const totalParticipants = event
    ? await fetchMikaTimingTotalParticipants(parts, event, profile, position).catch(() => undefined)
    : undefined

  return [
    {
      platform: 'mikatiming',
      matchedName: match.displayName,
      time,
      position,
      totalParticipants,
      sourceUrl: parts.pageUrl,
      confidence: 'high',
    },
  ]
}
