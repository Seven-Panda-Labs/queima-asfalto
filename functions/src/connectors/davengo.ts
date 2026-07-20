import type { OfficialResultCandidate, UserResultsProfile } from '../shared/types.js'
import { buildDavengoSearchTerm } from '../shared/davengoSearch.js'
import { namesMatch } from '../shared/matchName.js'
import { parseDavengoUrl, type DavengoUrlParts } from '../shared/parseUrls.js'
import { normalizeRaceTime, parseRank } from '../utils/time.js'

const DAVENGO_MAX_PAGES = 200

type DavengoRow = {
  firstName?: string
  lastName?: string
  nettoTime?: string
  rankTotal?: string
}

type DavengoResponse = {
  results: DavengoRow[]
  navigation?: { nextOffset?: number }
}

export function totalParticipantsFromLastDavengoPage(results: DavengoRow[]): number | undefined {
  if (results.length === 0) return undefined
  return parseRank(results[results.length - 1]?.rankTotal)
}

function rowToCandidate(
  row: DavengoRow,
  profile: UserResultsProfile,
  pageUrl: string,
): OfficialResultCandidate | null {
  const firstName = row.firstName ?? ''
  const lastName = row.lastName ?? ''
  if (!namesMatch(profile, firstName, lastName)) return null

  const time = normalizeRaceTime(row.nettoTime ?? '')
  if (!time) return null

  const position = parseRank(row.rankTotal)
  const matchedName = [firstName, lastName].filter(Boolean).join(' ')

  return {
    platform: 'davengo',
    matchedName,
    time,
    position,
    sourceUrl: pageUrl,
    confidence: 'high',
  }
}

async function fetchDavengoPage(
  parts: DavengoUrlParts,
  offset: number,
  term: string | null,
): Promise<DavengoResponse> {
  const response = await fetch(parts.listUrl, {
    method: 'POST',
    headers: {
      accept: 'application/json, text/plain, */*',
      'content-type': 'application/json',
      Referer: parts.pageUrl,
    },
    body: JSON.stringify({
      type: 'simple',
      term,
      category: parts.category,
      offset,
    }),
  })

  if (!response.ok) {
    throw new Error(`Davengo API error: ${response.status}`)
  }

  const data = (await response.json()) as DavengoResponse & { status?: string; message?: string }
  if (!Array.isArray(data.results)) {
    throw new Error('Davengo API returned an unexpected response.')
  }

  return data
}

async function findDavengoCandidate(
  parts: DavengoUrlParts,
  profile: UserResultsProfile,
): Promise<OfficialResultCandidate | null> {
  const term = buildDavengoSearchTerm(profile)
  let offset = 0
  let pages = 0

  while (pages < DAVENGO_MAX_PAGES) {
    const data = await fetchDavengoPage(parts, offset, term)
    const results = data.results ?? []

    for (const row of results) {
      const match = rowToCandidate(row, profile, parts.pageUrl)
      if (match) return match
    }

    const nextOffset = data.navigation?.nextOffset
    if (nextOffset == null || results.length === 0) break

    offset = nextOffset
    pages += 1
  }

  return null
}

async function fetchDavengoTotalParticipants(parts: DavengoUrlParts): Promise<number | undefined> {
  let offset = 0
  let pages = 0
  let totalParticipants: number | undefined

  while (pages < DAVENGO_MAX_PAGES) {
    const data = await fetchDavengoPage(parts, offset, null)
    const results = data.results ?? []

    const nextOffset = data.navigation?.nextOffset
    const isLastPage = nextOffset == null || results.length === 0

    if (isLastPage) {
      totalParticipants = totalParticipantsFromLastDavengoPage(results)
      break
    }

    offset = nextOffset
    pages += 1
  }

  return totalParticipants
}

export async function lookupDavengo(
  resultsUrl: string,
  profile: UserResultsProfile,
): Promise<OfficialResultCandidate[]> {
  const parts = parseDavengoUrl(resultsUrl)
  if (!parts) return []

  const candidate = await findDavengoCandidate(parts, profile)
  if (!candidate) return []

  const totalParticipants = await fetchDavengoTotalParticipants(parts)
  if (totalParticipants) {
    candidate.totalParticipants = totalParticipants
  }

  return [candidate]
}
