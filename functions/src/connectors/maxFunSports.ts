import type { OfficialResultCandidate, UserResultsProfile } from '../shared/types.js'
import { namesMatch } from '../shared/matchName.js'
import { parseMaxFunSportsUrl } from '../shared/parseUrls.js'
import {
  buildMaxFunSportsSearchUrl,
  buildMaxFunSportsWwwSummaryUrl,
  parseMaxFunSportsResultRows,
  parseMaxFunSportsSummaryTotal,
  MAXFUN_SPORTS_WWW_ORIGIN,
  type MaxFunSportsResultRow,
} from '../shared/maxFunSports.js'
import { buildMaxFunSportsSearchTerm } from '../shared/maxFunSportsSearch.js'
import { normalizeRaceTime } from '../utils/time.js'

async function fetchMaxFunHtml(url: string, referer: string): Promise<string> {
  const response = await fetch(url, {
    headers: { accept: 'text/html', Referer: `${referer}/` },
  })
  if (!response.ok) {
    throw new Error(`MaxFunSports page error: ${response.status}`)
  }
  return response.text()
}

function rowToCandidate(
  row: MaxFunSportsResultRow,
  profile: UserResultsProfile,
  pageUrl: string,
  totalParticipants?: number,
): OfficialResultCandidate | null {
  if (!namesMatch(profile, row.firstName, row.lastName)) return null

  const time = normalizeRaceTime(row.time)
  if (!time) return null

  return {
    platform: 'maxfunsports',
    matchedName: [row.firstName, row.lastName].filter(Boolean).join(' '),
    time,
    position: row.position,
    totalParticipants,
    sourceUrl: pageUrl,
    confidence: 'high',
  }
}

export async function lookupMaxFunSports(
  resultsUrl: string,
  profile: UserResultsProfile,
): Promise<OfficialResultCandidate[]> {
  const parts = parseMaxFunSportsUrl(resultsUrl)
  if (!parts) return []

  const searchTerm = buildMaxFunSportsSearchTerm(profile)
  if (!searchTerm) return []

  const searchUrl = buildMaxFunSportsSearchUrl(parts, searchTerm)
  const html = await fetchMaxFunHtml(searchUrl, parts.origin)
  const rows = parseMaxFunSportsResultRows(html)

  for (const row of rows) {
    const candidate = rowToCandidate(row, profile, parts.pageUrl)
    if (!candidate) continue

    const totalUrl = buildMaxFunSportsWwwSummaryUrl(parts.competitionId)
    const totalHtml = await fetchMaxFunHtml(totalUrl, MAXFUN_SPORTS_WWW_ORIGIN)
    const totalParticipants = parseMaxFunSportsSummaryTotal(totalHtml)
    if (totalParticipants) {
      candidate.totalParticipants = totalParticipants
    }
    return [candidate]
  }

  return []
}
