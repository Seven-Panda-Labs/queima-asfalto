import type { OfficialResultCandidate, UserResultsProfile } from '../shared/types.js'
import { matchesResultsProfile } from '../shared/matchName.js'
import {
  formatPacerTime,
  pacerFinishTimeMs,
  rankPacerResults,
  type PacerResultsPayload,
} from '../shared/pacer.js'
import { parsePacerUrl } from '../shared/parseUrls.js'

const PACER_FETCH_HEADERS = {
  accept: 'application/json',
  'User-Agent': 'Mozilla/5.0 (compatible; QueimaAsfalto/1.0)',
}

export async function lookupPacer(
  resultsUrl: string,
  profile: UserResultsProfile,
): Promise<OfficialResultCandidate[]> {
  const parts = parsePacerUrl(resultsUrl)
  if (!parts) return []

  const response = await fetch(parts.apiUrl, {
    headers: { ...PACER_FETCH_HEADERS, Referer: parts.pageUrl },
  })
  if (response.status === 404) return []
  if (!response.ok) {
    throw new Error(`Pacer request error: ${response.status}`)
  }

  const payload = (await response.json()) as PacerResultsPayload
  if (payload.race?.showRankings === false) return []

  const ranked = rankPacerResults(payload)
  const match = ranked.find((result) => matchesResultsProfile(profile, result.name))
  if (!match) return []

  const time = pacerFinishTimeMs(match, payload.race)
  if (time <= 0) return []

  return [
    {
      platform: 'pacer',
      matchedName: match.name,
      time: formatPacerTime(time),
      position: match.position,
      totalParticipants: ranked.length,
      sourceUrl: parts.pageUrl,
      confidence: 'high',
    },
  ]
}
