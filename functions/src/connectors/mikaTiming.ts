import type { OfficialResultCandidate, UserResultsProfile } from '../shared/types.js'
import { matchesResultsProfile } from '../shared/matchName.js'
import {
  buildMikaTimingListFormFields,
  buildMikaTimingSearchFormFields,
  isMikatimingResultsHtml,
  parseMikaTimingEventFromHtml,
  parseMikaTimingMaxListPage,
  parseMikaTimingMaxOverallPlace,
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

async function resolveMikaTimingParts(resultsUrl: string): Promise<MikaTimingUrlParts | null> {
  const parts = parseMikaTimingUrl(resultsUrl)
  if (!parts) return null

  if (parts.event) return parts

  const html = await fetchMikaTimingHtml(parts.baseUrl, parts.baseUrl)
  if (!isMikatimingResultsHtml(html)) return null

  return {
    ...parts,
    event: parseMikaTimingEventFromHtml(html),
  }
}

async function fetchMikaTimingTotalParticipants(
  parts: MikaTimingUrlParts,
  event: string,
): Promise<number | undefined> {
  const listUrl = `${parts.baseUrl}?pid=list&pidp=start&page=1`
  const listFields = buildMikaTimingListFormFields({ ...parts, event })
  const firstPageHtml = await fetchMikaTimingHtml(listUrl, parts.baseUrl, listFields)
  const maxPage = parseMikaTimingMaxListPage(firstPageHtml)

  const lastPageUrl = `${parts.baseUrl}?pid=list&pidp=start&page=${maxPage}`
  const lastPageHtml =
    maxPage === 1
      ? firstPageHtml
      : await fetchMikaTimingHtml(lastPageUrl, parts.baseUrl, listFields)

  return parseMikaTimingMaxOverallPlace(lastPageHtml)
}

export async function lookupMikaTiming(
  resultsUrl: string,
  profile: UserResultsProfile,
): Promise<OfficialResultCandidate[]> {
  const parts = await resolveMikaTimingParts(resultsUrl)
  if (!parts) return []

  const searchName = buildMikaTimingSearchTerm(profile)
  if (!searchName) return []

  const searchUrl = `${parts.baseUrl}?pid=search`
  const searchFields = buildMikaTimingSearchFormFields(parts, searchName)
  const html = await fetchMikaTimingHtml(searchUrl, parts.baseUrl, searchFields)
  const rows = parseMikaTimingSearchRows(html)
  const match = rows.find((row) => matchesResultsProfile(profile, row.displayName))
  if (!match) return []

  const event = match.event ?? parts.event
  const totalParticipants = event
    ? await fetchMikaTimingTotalParticipants(parts, event).catch(() => undefined)
    : undefined

  return [
    {
      platform: 'mikatiming',
      matchedName: match.displayName,
      time: match.time,
      position: match.position,
      totalParticipants,
      sourceUrl: parts.pageUrl,
      confidence: 'high',
    },
  ]
}
