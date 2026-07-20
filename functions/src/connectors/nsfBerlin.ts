import type { OfficialResultCandidate, UserResultsProfile } from '../shared/types.js'
import { namesMatch } from '../shared/matchName.js'
import { parseNsfBerlinUrl } from '../shared/parseUrls.js'
import {
  buildNsfBerlinResultsPostUrl,
  parseNsfBerlinResultRows,
  parseNsfBerlinStreckeOptions,
  type NsfBerlinResultRow,
  type NsfBerlinUrlParts,
} from '../shared/nsfBerlin.js'
import { buildNsfBerlinSearchTerm } from '../shared/nsfBerlinSearch.js'

const NSF_FETCH_HEADERS = {
  accept: 'text/html',
  'User-Agent': 'Mozilla/5.0 (compatible; QueimaAsfalto/1.0)',
}

async function fetchNsfBerlinHtml(
  url: string,
  referer: string,
  init?: RequestInit,
): Promise<string> {
  const response = await fetch(url, {
    ...init,
    headers: { ...NSF_FETCH_HEADERS, Referer: referer, ...init?.headers },
  })
  if (!response.ok) {
    throw new Error(`NSF Berlin page error: ${response.status}`)
  }
  return response.text()
}

function rowToCandidate(
  row: NsfBerlinResultRow,
  profile: UserResultsProfile,
  pageUrl: string,
  totalParticipants?: number,
): OfficialResultCandidate | null {
  if (!namesMatch(profile, row.firstName, row.lastName)) return null

  return {
    platform: 'nsfberlin',
    matchedName: [row.firstName, row.lastName].filter(Boolean).join(' ') || row.name,
    time: row.time,
    position: row.position,
    totalParticipants,
    sourceUrl: pageUrl,
    confidence: 'high',
  }
}

async function lookupInHtml(
  html: string,
  profile: UserResultsProfile,
  parts: NsfBerlinUrlParts,
  totalParticipants?: number,
): Promise<OfficialResultCandidate | null> {
  const rows = parseNsfBerlinResultRows(html)
  const total = totalParticipants ?? rows.length

  for (const row of rows) {
    const match = rowToCandidate(row, profile, parts.pageUrl, total)
    if (match) return match
  }

  return null
}

export async function lookupNsfBerlin(
  resultsUrl: string,
  profile: UserResultsProfile,
): Promise<OfficialResultCandidate[]> {
  const parts = parseNsfBerlinUrl(resultsUrl)
  if (!parts) return []

  const searchTerm = buildNsfBerlinSearchTerm(profile)
  if (!searchTerm) return []

  const indexHtml = await fetchNsfBerlinHtml(parts.pageUrl, parts.pageUrl)
  const directMatch = await lookupInHtml(indexHtml, profile, parts)
  if (directMatch) return [directMatch]

  const strecken = parseNsfBerlinStreckeOptions(indexHtml)
  const postUrl = buildNsfBerlinResultsPostUrl(parts)

  for (const strecke of strecken) {
    const resultHtml = await fetchNsfBerlinHtml(postUrl, parts.pageUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ Strecke: strecke.value }).toString(),
    })

    if (!resultHtml.toLowerCase().includes(searchTerm.toLowerCase())) continue

    const match = await lookupInHtml(resultHtml, profile, parts, strecke.totalParticipants)
    if (match) return [match]
  }

  return []
}
