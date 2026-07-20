import type { OfficialResultCandidate, UserResultsProfile } from '../shared/types.js'
import { matchesResultsProfile } from '../shared/matchName.js'
import { parseUltimateUrl } from '../shared/parseUrls.js'
import {
  buildUltimateParticipantInfoUrl,
  buildUltimateSearchUrl,
  parseUltimateParticipantRanking,
  parseUltimateSearchRows,
  type UltimateSearchRow,
  type UltimateUrlParts,
} from '../shared/ultimate.js'
import { buildUltimateSearchTerms } from '../shared/ultimateSearch.js'

const ULTIMATE_FETCH_HEADERS = {
  accept: 'text/html, */*',
  'User-Agent': 'Mozilla/5.0 (compatible; QueimaAsfalto/1.0)',
}

async function fetchUltimateData(url: string, referer: string): Promise<string> {
  const response = await fetch(url, {
    headers: { ...ULTIMATE_FETCH_HEADERS, Referer: referer },
  })
  if (!response.ok) {
    throw new Error(`Ultimate Sport Service page error: ${response.status}`)
  }
  return response.text()
}

async function rowToCandidate(
  row: UltimateSearchRow,
  profile: UserResultsProfile,
  parts: UltimateUrlParts,
): Promise<OfficialResultCandidate | null> {
  if (!matchesResultsProfile(profile, row.name)) return null

  const participantUrl = buildUltimateParticipantInfoUrl(parts, row.participantId)
  const participantResponse = await fetchUltimateData(participantUrl, parts.pageUrl)
  const ranking = parseUltimateParticipantRanking(participantResponse)
  if (!ranking) return null

  return {
    platform: 'ultimate',
    matchedName: row.name,
    time: ranking.time ?? row.time,
    position: ranking.position,
    totalParticipants: ranking.totalParticipants,
    sourceUrl: parts.pageUrl,
    confidence: 'high',
  }
}

async function findMatchInResponse(
  response: string,
  profile: UserResultsProfile,
  parts: UltimateUrlParts,
): Promise<OfficialResultCandidate | null> {
  for (const row of parseUltimateSearchRows(response)) {
    const match = await rowToCandidate(row, profile, parts)
    if (match) return match
  }

  return null
}

export async function lookupUltimate(
  resultsUrl: string,
  profile: UserResultsProfile,
): Promise<OfficialResultCandidate[]> {
  const parts = parseUltimateUrl(resultsUrl)
  if (!parts) return []

  const searchTerms = buildUltimateSearchTerms(profile)
  if (searchTerms.length === 0) return []

  for (const searchTerm of searchTerms) {
    const searchUrl = buildUltimateSearchUrl(parts, searchTerm)
    const searchResponse = await fetchUltimateData(searchUrl, parts.pageUrl)
    const match = await findMatchInResponse(searchResponse, profile, parts)
    if (match) return [match]
  }

  return []
}
