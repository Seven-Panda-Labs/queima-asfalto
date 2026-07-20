import type { OfficialResultCandidate, UserResultsProfile } from '../shared/types.js'
import { matchesResultsProfile } from '../shared/matchName.js'
import { parseTimatakaUrl } from '../shared/parseUrls.js'
import {
  parseTimatakaResultRows,
  parseTimatakaTotalParticipants,
} from '../shared/timataka.js'

const TIMATAKA_FETCH_HEADERS = {
  accept: 'text/html,application/xhtml+xml,text/plain,*/*',
  'User-Agent': 'Mozilla/5.0 (compatible; QueimaAsfalto/1.0)',
}

async function fetchTimatakaHtml(url: string): Promise<string> {
  const response = await fetch(url, { headers: TIMATAKA_FETCH_HEADERS })
  if (!response.ok) {
    throw new Error(`Tímataka request error: ${response.status}`)
  }
  return response.text()
}

export async function lookupTimataka(
  resultsUrl: string,
  profile: UserResultsProfile,
): Promise<OfficialResultCandidate[]> {
  const parts = parseTimatakaUrl(resultsUrl)
  if (!parts) return []

  const html = await fetchTimatakaHtml(parts.pageUrl)
  const rows = parseTimatakaResultRows(html)
  const match = rows.find((row) => matchesResultsProfile(profile, row.fullName))
  if (!match) return []

  const totalParticipants = parseTimatakaTotalParticipants(html) ?? rows.length

  return [
    {
      platform: 'timataka',
      matchedName: match.fullName,
      time: match.time,
      position: match.position,
      totalParticipants,
      sourceUrl: parts.pageUrl,
      confidence: 'high',
    },
  ]
}
