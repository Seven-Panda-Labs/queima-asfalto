import type { OfficialResultCandidate, UserResultsProfile } from '../shared/types.js'
import { namesMatch } from '../shared/matchName.js'
import { parseEqTimingUrl } from '../shared/parseUrls.js'
import {
  buildEqTimingReportUrl,
  buildEqTimingSearchUrl,
  countEqTimingStageFinishers,
  EQTIMING_REPORT_IDS,
  parseEqTimingCsv,
  parseEqTimingSearchResponse,
  type EqTimingSearchMatch,
  type EqTimingUrlParts,
} from '../shared/eqTiming.js'
import { buildEqTimingSearchTerm } from '../shared/eqTimingSearch.js'

const EQTIMING_FETCH_HEADERS = {
  accept: 'application/json, text/csv, text/plain, */*',
  'User-Agent': 'Mozilla/5.0 (compatible; QueimaAsfalto/1.0)',
}

async function fetchEqTimingJson(url: string, referer: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { ...EQTIMING_FETCH_HEADERS, Referer: referer },
  })
  if (!response.ok) {
    throw new Error(`EQ Timing request error: ${response.status}`)
  }
  return response.json()
}

async function fetchEqTimingText(url: string, referer: string): Promise<string> {
  const response = await fetch(url, {
    headers: { ...EQTIMING_FETCH_HEADERS, Referer: referer },
  })
  if (!response.ok) {
    throw new Error(`EQ Timing report error: ${response.status}`)
  }
  return response.text()
}

function pickSearchMatch(
  matches: EqTimingSearchMatch[],
  profile: UserResultsProfile,
  parts: EqTimingUrlParts,
): EqTimingSearchMatch | null {
  const nameMatches = matches.filter((match) => namesMatch(profile, match.firstName, match.lastName))
  if (nameMatches.length === 0) return null

  if (parts.etappeId) {
    const etappeId = Number(parts.etappeId)
    const byEtappe = nameMatches.filter((match) => match.stageId === etappeId)
    if (byEtappe.length > 0) return byEtappe[0]!
  }

  return nameMatches[0]!
}

async function fetchStageTotal(
  parts: EqTimingUrlParts,
  stage: string,
): Promise<number | undefined> {
  for (const reportId of EQTIMING_REPORT_IDS) {
    const csv = await fetchEqTimingText(buildEqTimingReportUrl(parts.eventId, reportId, parts.origin), parts.pageUrl)
    const rows = parseEqTimingCsv(csv)
    if (rows.length === 0) continue

    const total = countEqTimingStageFinishers(rows, stage)
    if (total > 0) return total
  }

  return undefined
}

export async function lookupEqTiming(
  resultsUrl: string,
  profile: UserResultsProfile,
): Promise<OfficialResultCandidate[]> {
  const parts = parseEqTimingUrl(resultsUrl)
  if (!parts) return []

  const searchTerm = buildEqTimingSearchTerm(profile)
  if (!searchTerm) return []

  const searchUrl = buildEqTimingSearchUrl(parts.eventId, searchTerm, parts.origin)
  const payload = await fetchEqTimingJson(searchUrl, parts.pageUrl)
  const matches = parseEqTimingSearchResponse(payload)
  const match = pickSearchMatch(matches, profile, parts)
  if (!match) return []

  const totalParticipants = await fetchStageTotal(parts, match.stage)

  return [
    {
      platform: 'eqtiming',
      matchedName: [match.firstName, match.lastName].filter(Boolean).join(' '),
      time: match.time,
      position: match.position,
      totalParticipants,
      sourceUrl: parts.pageUrl,
      confidence: 'high',
    },
  ]
}
