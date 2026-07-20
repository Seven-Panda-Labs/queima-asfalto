import type { OfficialResultCandidate, UserResultsProfile } from '../shared/types.js'
import { namesMatch } from '../shared/matchName.js'
import { parseRunCzechUrl } from '../shared/parseUrls.js'
import {
  buildRunCzechSearchUrl,
  parseRunCzechResultRows,
  parseRunCzechTotalParticipants,
  type RunCzechResultRow,
  type RunCzechUrlParts,
} from '../shared/runCzech.js'
import { buildRunCzechSearchTerm } from '../shared/runCzechSearch.js'

const RUN_CZECH_FETCH_HEADERS = {
  accept: 'text/html',
  'User-Agent': 'Mozilla/5.0 (compatible; QueimaAsfalto/1.0)',
}

async function fetchRunCzechHtml(url: string, referer: string): Promise<string> {
  const response = await fetch(url, {
    headers: { ...RUN_CZECH_FETCH_HEADERS, Referer: referer },
  })
  if (!response.ok) {
    throw new Error(`RunCzech page error: ${response.status}`)
  }
  return response.text()
}

function rowToCandidate(
  row: RunCzechResultRow,
  profile: UserResultsProfile,
  pageUrl: string,
  totalParticipants?: number,
): OfficialResultCandidate | null {
  if (!namesMatch(profile, row.firstName, row.lastName)) return null

  return {
    platform: 'runczech',
    matchedName: [row.firstName, row.lastName].filter(Boolean).join(' ') || row.name,
    time: row.time,
    position: row.position,
    totalParticipants,
    sourceUrl: pageUrl,
    confidence: 'high',
  }
}

function findMatchInHtml(
  html: string,
  profile: UserResultsProfile,
  parts: RunCzechUrlParts,
  totalParticipants?: number,
): OfficialResultCandidate | null {
  for (const row of parseRunCzechResultRows(html)) {
    const match = rowToCandidate(row, profile, parts.pageUrl, totalParticipants)
    if (match) return match
  }

  return null
}

export async function lookupRunCzech(
  resultsUrl: string,
  profile: UserResultsProfile,
): Promise<OfficialResultCandidate[]> {
  const parts = parseRunCzechUrl(resultsUrl)
  if (!parts) return []

  const searchTerm = buildRunCzechSearchTerm(profile)
  if (!searchTerm) return []

  const searchUrl = buildRunCzechSearchUrl(parts, searchTerm)
  const searchHtml = await fetchRunCzechHtml(searchUrl, parts.pageUrl)
  const directMatch = findMatchInHtml(searchHtml, profile, parts)
  if (!directMatch) return []

  const indexHtml = await fetchRunCzechHtml(parts.pageUrl, parts.pageUrl)
  const totalParticipants = parseRunCzechTotalParticipants(indexHtml)

  return [{ ...directMatch, totalParticipants }]
}
