import type { OfficialResultCandidate, UserResultsProfile } from '../shared/types.js'
import { matchesResultsProfile } from '../shared/matchName.js'
import {
  buildMikaTimingDetailUrl,
  buildMikaTimingListFormFields,
  buildMikaTimingSearchFormFields,
  isMikatimingResultsHtml,
  parseMikaTimingDetailResult,
  parseMikaTimingEventFromHtml,
  parseMikaTimingMaxListPage,
  parseMikaTimingListParticipantCount,
  parseMikaTimingMaxOverallPlace,
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
  parts: MikaTimingUrlParts
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
    parts: { ...parts, event: parseMikaTimingEventFromHtml(html) },
    eventCodes: parseMikaTimingSearchEventCodesFromHtml(html),
  }
}

async function fetchMikaTimingTotalParticipants(
  parts: MikaTimingUrlParts,
  event: string,
): Promise<number | undefined> {
  const listUrl = `${parts.baseUrl}?pid=list&pidp=start&page=1`
  const listFields = buildMikaTimingListFormFields({ ...parts, event })
  const firstPageHtml = await fetchMikaTimingHtml(listUrl, parts.baseUrl, listFields)
  const fromHeader = parseMikaTimingListParticipantCount(firstPageHtml)
  if (fromHeader !== undefined) return fromHeader

  const maxPage = parseMikaTimingMaxListPage(firstPageHtml)

  const lastPageUrl = `${parts.baseUrl}?pid=list&pidp=start&page=${maxPage}`
  const lastPageHtml =
    maxPage === 1
      ? firstPageHtml
      : await fetchMikaTimingHtml(lastPageUrl, parts.baseUrl, listFields)

  return parseMikaTimingMaxOverallPlace(lastPageHtml)
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

  const event = match.event ?? searchedEvent

  // Some events publish a search list with no finish time. The runner's own page has it.
  let { time, position } = match
  if (!time && match.runnerId) {
    const detail = parseMikaTimingDetailResult(
      await fetchMikaTimingHtml(
        buildMikaTimingDetailUrl({ ...parts, event }, match.runnerId),
        parts.baseUrl,
      ),
    )
    time = detail?.time
    position = position ?? detail?.position
  }
  if (!time) return []

  const totalParticipants = event
    ? await fetchMikaTimingTotalParticipants(parts, event).catch(() => undefined)
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
