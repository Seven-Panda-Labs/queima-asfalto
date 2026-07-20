import type { OfficialResultCandidate, UserResultsProfile } from '../shared/types.js'
import { namesMatch } from '../shared/matchName.js'
import { parseVcRunningUrl } from '../shared/parseUrls.js'
import {
  buildVcRunningDtBody,
  buildVcRunningDtUrl,
  buildVcRunningSearchBody,
  parseVcRunningResultRows,
  parseVcRunningTotalParticipants,
  type VcRunningResultRow,
} from '../shared/vcRunning.js'
import { buildVcRunningSearchTerm } from '../shared/vcRunningSearch.js'

const VCRUNNING_FETCH_HEADERS = {
  accept: 'text/html,application/json,text/plain,*/*',
  'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'User-Agent': 'Mozilla/5.0 (compatible; QueimaAsfalto/1.0)',
}

async function fetchVcRunningHtml(url: string, referer: string, body: string): Promise<string> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { ...VCRUNNING_FETCH_HEADERS, Referer: referer },
    body,
  })
  if (!response.ok) {
    throw new Error(`VCRunning page error: ${response.status}`)
  }
  return response.text()
}

async function fetchVcRunningJson(url: string, referer: string, body: string): Promise<unknown> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...VCRUNNING_FETCH_HEADERS,
      accept: 'application/json, text/javascript, */*; q=0.01',
      'x-requested-with': 'XMLHttpRequest',
      Referer: referer,
    },
    body,
  })
  if (!response.ok) {
    throw new Error(`VCRunning API error: ${response.status}`)
  }
  return response.json()
}

function rowToCandidate(
  row: VcRunningResultRow,
  profile: UserResultsProfile,
  pageUrl: string,
  totalParticipants?: number,
): OfficialResultCandidate | null {
  if (!namesMatch(profile, row.firstName, row.lastName)) return null

  return {
    platform: 'vcrunning',
    matchedName: row.name,
    time: row.time,
    position: row.position,
    totalParticipants,
    sourceUrl: pageUrl,
    confidence: 'high',
  }
}

export async function lookupVcRunning(
  resultsUrl: string,
  profile: UserResultsProfile,
  eventDate: Date,
): Promise<OfficialResultCandidate[]> {
  const parts = parseVcRunningUrl(resultsUrl, eventDate.getFullYear())
  if (!parts) return []

  const searchTerm = buildVcRunningSearchTerm(profile)
  if (!searchTerm) return []

  const searchHtml = await fetchVcRunningHtml(
    parts.searchUrl,
    parts.pageUrl,
    buildVcRunningSearchBody(searchTerm),
  )

  let match: OfficialResultCandidate | null = null
  for (const row of parseVcRunningResultRows(searchHtml)) {
    const candidate = rowToCandidate(row, profile, parts.pageUrl)
    if (candidate) {
      match = candidate
      break
    }
  }
  if (!match) return []

  const dtPayload = await fetchVcRunningJson(
    buildVcRunningDtUrl(parts),
    parts.pageUrl,
    buildVcRunningDtBody(parts.year, parts.eventType),
  )
  const totalParticipants = parseVcRunningTotalParticipants(dtPayload)

  return [{ ...match, totalParticipants }]
}
