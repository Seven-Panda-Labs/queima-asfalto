import type { OfficialResultCandidate, UserResultsProfile } from '../shared/types.js'
import { parseRaceResultUrl, type RaceResultUrlParts } from '../shared/parseUrls.js'
import { buildMyRaceResultSearchTerm } from '../shared/myRaceResultSearch.js'
import {
  buildRaceResultConfigUrl,
  buildRaceResultListUrl,
  buildRaceResultSearchUrl,
  computeRaceResultOverallPosition,
  extractRaceResultEventIdFromHtml,
  isUsableRaceResultList,
  listsToSearch,
  namesMatchRaceResultDisplay,
  parseRaceResultName,
  raceResultDataRows,
  raceResultFieldIndexes,
  shouldComputeRaceResultOverallRank,
  totalParticipantsForRaceResultRow,
  type RaceResultConfig,
  type RaceResultListConfig,
  type RaceResultListResponse,
  RACERESULT_REFERER,
} from '../shared/raceresult.js'
import { normalizeRaceTime, parseRank } from '../utils/time.js'

const RACERESULT_HEADERS = {
  accept: 'application/json',
  Referer: RACERESULT_REFERER,
}

function raceResultHeaders(eventId: string): Record<string, string> {
  return {
    ...RACERESULT_HEADERS,
    EventID: eventId,
  }
}

async function fetchRaceResultJson<T>(url: string, eventId: string): Promise<T> {
  const response = await fetch(url, { headers: raceResultHeaders(eventId) })
  if (!response.ok) {
    throw new Error(`RaceResult API error: ${response.status}`)
  }
  return (await response.json()) as T
}

async function resolveRaceResultEventId(parts: RaceResultUrlParts): Promise<string | null> {
  if (parts.eventId) return parts.eventId

  const response = await fetch(parts.pageUrl)
  if (!response.ok) return null

  const html = await response.text()
  return extractRaceResultEventIdFromHtml(html) ?? null
}

function rowToCandidate(
  row: string[],
  indexes: { name: number; time: number; rank?: number },
  profile: UserResultsProfile,
  pageUrl: string,
  totalParticipants?: number,
  positionOverride?: number,
): OfficialResultCandidate | null {
  const displayName = row[indexes.name] ?? ''
  if (!namesMatchRaceResultDisplay(profile, displayName)) return null

  const time = normalizeRaceTime(row[indexes.time] ?? '')
  if (!time) return null

  const position =
    positionOverride ?? (indexes.rank == null ? undefined : parseRank(row[indexes.rank]))
  const { first, last } = parseRaceResultName(displayName)
  const matchedName = [first, last].filter(Boolean).join(' ')

  return {
    platform: 'myraceresult',
    matchedName: matchedName || displayName,
    time,
    position,
    totalParticipants,
    sourceUrl: pageUrl,
    confidence: 'high',
  }
}

async function enrichCandidateWithOverallRank(
  candidate: OfficialResultCandidate,
  profile: UserResultsProfile,
  eventId: string,
  config: RaceResultConfig,
  list: RaceResultListConfig,
  response: RaceResultListResponse,
): Promise<OfficialResultCandidate> {
  const indexes = raceResultFieldIndexes(response.DataFields ?? [])
  if (!indexes || !shouldComputeRaceResultOverallRank(response.DataFields ?? [], indexes.rank)) {
    return candidate
  }

  const listUrl = buildRaceResultListUrl({
    eventId,
    key: config.key,
    listName: list.Name,
    contest: String(list.Contest),
  })
  const groupResponse = await fetchRaceResultJson<RaceResultListResponse>(listUrl, eventId)
  if (!isUsableRaceResultList(groupResponse)) return candidate

  const groupIndexes = raceResultFieldIndexes(groupResponse.DataFields ?? [])
  if (!groupIndexes) return candidate

  const overall = computeRaceResultOverallPosition(
    raceResultDataRows(groupResponse.data),
    groupIndexes,
    profile,
    candidate.time,
  )
  if (!overall) return candidate

  return {
    ...candidate,
    position: overall.position,
    totalParticipants: overall.totalParticipants,
  }
}

function findMatchInList(
  response: RaceResultListResponse,
  profile: UserResultsProfile,
  pageUrl: string,
): OfficialResultCandidate | null {
  const indexes = raceResultFieldIndexes(response.DataFields ?? [])
  if (!indexes) return null

  for (const row of raceResultDataRows(response.data)) {
    const match = rowToCandidate(
      row,
      indexes,
      profile,
      pageUrl,
      totalParticipantsForRaceResultRow(response.data, row),
    )
    if (match) return match
  }

  return null
}

export async function lookupRaceResult(
  resultsUrl: string,
  profile: UserResultsProfile,
): Promise<OfficialResultCandidate[]> {
  const parts = parseRaceResultUrl(resultsUrl)
  if (!parts) return []

  const eventId = await resolveRaceResultEventId(parts)
  if (!eventId) return []

  const config = await fetchRaceResultJson<RaceResultConfig>(
    buildRaceResultConfigUrl(eventId),
    eventId,
  )
  if (!config.key) return []

  const searchTerm = buildMyRaceResultSearchTerm(profile)
  if (!searchTerm) return []

  for (const list of listsToSearch(config, parts.listId, parts.contest)) {
    if (!list.Name || list.Contest == null) continue

    const searchUrl = buildRaceResultSearchUrl({
      eventId,
      key: config.key,
      listName: list.Name,
      contest: String(list.Contest),
      term: searchTerm,
    })
    const response = await fetchRaceResultJson<RaceResultListResponse>(searchUrl, eventId)
    if (!isUsableRaceResultList(response)) continue

    const candidate = findMatchInList(response, profile, parts.pageUrl)
    if (!candidate) continue

    const enriched = await enrichCandidateWithOverallRank(
      candidate,
      profile,
      eventId,
      config,
      list,
      response,
    )
    return [enriched]
  }

  return []
}
