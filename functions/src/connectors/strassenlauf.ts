import type { OfficialResultCandidate, UserResultsProfile } from '../shared/types.js'
import { namesMatchFullName } from '../shared/matchName.js'
import { parseStrassenlaufUrl } from '../shared/parseUrls.js'
import {
  buildStrassenlaufApiUrl,
  buildStrassenlaufResultsPageUrl,
  parseStrassenlaufApiParamsFromHtml,
  parseStrassenlaufApiResponse,
  type StrassenlaufUrlParts,
} from '../shared/strassenlauf.js'
import { buildStrassenlaufSearchTerm } from '../shared/strassenlaufSearch.js'

const STRASSENLAUF_FETCH_HEADERS = {
  accept: 'application/json, text/javascript, */*; q=0.01',
  'x-requested-with': 'XMLHttpRequest',
  'User-Agent': 'Mozilla/5.0 (compatible; QueimaAsfalto/1.0)',
}

async function fetchStrassenlaufText(url: string, referer: string): Promise<string> {
  const response = await fetch(url, {
    headers: { ...STRASSENLAUF_FETCH_HEADERS, Referer: referer },
  })
  if (!response.ok) {
    throw new Error(`Strassenlauf page error: ${response.status}`)
  }
  return response.text()
}

async function fetchStrassenlaufApi(url: string, referer: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { ...STRASSENLAUF_FETCH_HEADERS, Referer: referer },
  })
  if (!response.ok) {
    throw new Error(`Strassenlauf API error: ${response.status}`)
  }
  return response.json()
}

async function resolveStrassenlaufParts(parts: StrassenlaufUrlParts): Promise<StrassenlaufUrlParts | null> {
  if (parts.match) return parts

  const pageUrl = buildStrassenlaufResultsPageUrl(parts)
  const html = await fetchStrassenlaufText(pageUrl, pageUrl)
  const apiParams = parseStrassenlaufApiParamsFromHtml(html)
  if (!apiParams) return null

  return {
    ...parts,
    eventId: apiParams.eventId,
    match: apiParams.match,
    cert: apiParams.cert,
    pageUrl,
  }
}

export async function lookupStrassenlauf(
  resultsUrl: string,
  profile: UserResultsProfile,
): Promise<OfficialResultCandidate[]> {
  const parsed = parseStrassenlaufUrl(resultsUrl)
  if (!parsed) return []

  const searchTerm = buildStrassenlaufSearchTerm(profile)
  if (!searchTerm) return []

  const parts = await resolveStrassenlaufParts(parsed)
  if (!parts?.match) return []

  const apiUrl = buildStrassenlaufApiUrl(parts, searchTerm)
  if (!apiUrl) return []

  const referer = parts.pageUrl
  const payload = await fetchStrassenlaufApi(apiUrl, referer)
  const response = parseStrassenlaufApiResponse(payload)
  if (!response) return []

  for (const row of response.rows) {
    if (!namesMatchFullName(profile, row.name)) continue

    return [
      {
        platform: 'strassenlauf',
        matchedName: row.name,
        time: row.time,
        position: row.position,
        totalParticipants: response.recordsTotal,
        sourceUrl: referer,
        confidence: 'high',
      },
    ]
  }

  return []
}
