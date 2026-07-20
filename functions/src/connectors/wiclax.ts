import type { OfficialResultCandidate, UserResultsProfile } from '../shared/types.js'
import { namesMatch } from '../shared/matchName.js'
import { parseWiclaxUrl, type WiclaxUrlParts } from '../shared/parseUrls.js'
import {
  findWiclaxMatches,
  isWiclaxResultsPage,
  parseWiclaxClaxUrlFromHtml,
  type WiclaxMatch,
} from '../shared/wiclax.js'

const WICLAX_FETCH_HEADERS = {
  accept: 'text/html,application/xml,text/xml,text/plain,*/*',
  'User-Agent': 'Mozilla/5.0 (compatible; QueimaAsfalto/1.0)',
}

async function fetchWiclaxText(url: string, referer?: string): Promise<string> {
  const response = await fetch(url, {
    headers: referer ? { ...WICLAX_FETCH_HEADERS, Referer: referer } : WICLAX_FETCH_HEADERS,
  })
  if (!response.ok) {
    throw new Error(`Wiclax request error: ${response.status}`)
  }
  return response.text()
}

async function resolveWiclaxClaxUrl(parts: WiclaxUrlParts): Promise<string | null> {
  if (parts.claxUrl) return parts.claxUrl

  const html = await fetchWiclaxText(parts.pageUrl)
  if (!isWiclaxResultsPage(html)) return null

  return parseWiclaxClaxUrlFromHtml(html)
}

export async function resolveWiclaxUrlParts(url: string): Promise<WiclaxUrlParts | null> {
  const parts = parseWiclaxUrl(url)
  if (!parts) return null

  const claxUrl = await resolveWiclaxClaxUrl(parts)
  if (!claxUrl) return null

  return { ...parts, claxUrl }
}

function matchToCandidate(
  match: WiclaxMatch,
  profile: UserResultsProfile,
  pageUrl: string,
): OfficialResultCandidate | null {
  if (!namesMatch(profile, match.engaged.firstName, match.engaged.lastName)) return null

  return {
    platform: 'wiclax',
    matchedName: match.engaged.fullName,
    time: match.result.time,
    position: match.ranking.position,
    totalParticipants: match.ranking.totalParticipants,
    sourceUrl: pageUrl,
    confidence: 'high',
  }
}

export async function lookupWiclax(
  resultsUrl: string,
  profile: UserResultsProfile,
): Promise<OfficialResultCandidate[]> {
  const parts = await resolveWiclaxUrlParts(resultsUrl)
  if (!parts?.claxUrl) return []

  const xml = await fetchWiclaxText(parts.claxUrl, parts.pageUrl)
  const matches = findWiclaxMatches(xml)

  for (const match of matches) {
    const candidate = matchToCandidate(match, profile, parts.pageUrl)
    if (candidate) return [candidate]
  }

  return []
}
