import type { OfficialResultCandidate, UserResultsProfile } from '../shared/types.js'
import { namesMatchFullName } from '../shared/matchName.js'
import { parseSporthiveUrl } from '../shared/parseUrls.js'
import { buildSporthiveSearchTerm } from '../shared/sporthiveSearch.js'
import {
  buildSporthiveBibUrl,
  buildSporthiveParticipantsUrl,
  buildSporthiveRaceUrl,
  buildSporthiveSearchUrl,
  SPORTRIVE_PAGE_CONCURRENCY,
  SPORTRIVE_SEARCH_COUNT,
} from '../shared/sporthive.js'
import { normalizeRaceTime } from '../utils/time.js'

const SPORTRIVE_HEADERS = {
  accept: 'application/json',
  Referer: 'https://sporthive.com/',
}

const SPORTRIVE_SEARCH_MAX_OFFSET = 100

type SporthiveParticipant = {
  name: string
  overallPosition?: number
  chipTimeOfParticipant?: string
  gunTimeOfParticipant?: string
}

type SporthivePage = {
  content: SporthiveParticipant[]
  totalElements?: number
  totalPages?: number
  last?: boolean
}

type SporthiveSearchHit = {
  name: string
  bib?: string
}

type SporthiveRace = {
  classificationsCount?: number
}

function participantToCandidate(
  participant: SporthiveParticipant,
  pageUrl: string,
  totalParticipants?: number,
): OfficialResultCandidate | null {
  const time = normalizeRaceTime(
    participant.chipTimeOfParticipant ?? participant.gunTimeOfParticipant ?? '',
  )
  if (!time) return null

  return {
    platform: 'sporthive',
    matchedName: participant.name,
    time,
    position: participant.overallPosition,
    totalParticipants,
    sourceUrl: pageUrl,
    confidence: 'high',
  }
}

function findMatchInPage(
  data: SporthivePage,
  profile: UserResultsProfile,
  pageUrl: string,
  totalParticipants?: number,
): OfficialResultCandidate | null {
  for (const participant of data.content) {
    if (!namesMatchFullName(profile, participant.name)) continue
    return participantToCandidate(participant, pageUrl, totalParticipants)
  }

  return null
}

async function fetchSporthiveJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: SPORTRIVE_HEADERS })
  if (!response.ok) {
    throw new Error(`Sporthive API error: ${response.status}`)
  }
  return (await response.json()) as T
}

async function fetchRaceTotalParticipants(raceId: string): Promise<number | undefined> {
  const race = await fetchSporthiveJson<SporthiveRace>(buildSporthiveRaceUrl(raceId))
  return race.classificationsCount
}

async function fetchParticipantByBib(
  raceId: string,
  bib: string,
): Promise<SporthiveParticipant | null> {
  try {
    return await fetchSporthiveJson<SporthiveParticipant>(buildSporthiveBibUrl(raceId, bib))
  } catch {
    return null
  }
}

async function lookupViaSearch(
  eventId: string,
  raceId: string,
  profile: UserResultsProfile,
  pageUrl: string,
  totalParticipants?: number,
): Promise<OfficialResultCandidate | null> {
  const term = buildSporthiveSearchTerm(profile)
  if (!term) return null

  let offset = 0
  while (offset < SPORTRIVE_SEARCH_MAX_OFFSET) {
    const hits = await fetchSporthiveJson<SporthiveSearchHit[]>(
      buildSporthiveSearchUrl(eventId, raceId, term, offset),
    )
    if (hits.length === 0) return null

    for (const hit of hits) {
      if (!namesMatchFullName(profile, hit.name) || !hit.bib) continue

      const participant = await fetchParticipantByBib(raceId, hit.bib)
      if (!participant) continue

      const candidate = participantToCandidate(participant, pageUrl, totalParticipants)
      if (candidate) return candidate
    }

    offset += hits.length
    if (hits.length < SPORTRIVE_SEARCH_COUNT) return null
  }

  return null
}

async function fetchSporthivePage(apiUrl: string, page: number): Promise<SporthivePage> {
  return fetchSporthiveJson<SporthivePage>(buildSporthiveParticipantsUrl(apiUrl, page))
}

async function lookupViaPagination(
  apiUrl: string,
  profile: UserResultsProfile,
  pageUrl: string,
  totalParticipants?: number,
): Promise<OfficialResultCandidate | null> {
  const firstPage = await fetchSporthivePage(apiUrl, 0)
  const totalPages = firstPage.totalPages ?? 1

  const firstMatch = findMatchInPage(firstPage, profile, pageUrl, totalParticipants)
  if (firstMatch) return firstMatch

  for (let start = 1; start < totalPages; start += SPORTRIVE_PAGE_CONCURRENCY) {
    const batchSize = Math.min(SPORTRIVE_PAGE_CONCURRENCY, totalPages - start)
    const pages = await Promise.all(
      Array.from({ length: batchSize }, (_, index) => fetchSporthivePage(apiUrl, start + index)),
    )

    for (const data of pages) {
      const match = findMatchInPage(data, profile, pageUrl, totalParticipants)
      if (match) return match
    }
  }

  return null
}

export async function lookupSporthive(
  resultsUrl: string,
  profile: UserResultsProfile,
): Promise<OfficialResultCandidate[]> {
  const parts = parseSporthiveUrl(resultsUrl)
  if (!parts) return []

  const totalParticipants = await fetchRaceTotalParticipants(parts.raceId)

  const searchMatch = await lookupViaSearch(
    parts.eventId,
    parts.raceId,
    profile,
    parts.pageUrl,
    totalParticipants,
  )
  if (searchMatch) return [searchMatch]

  const paginationMatch = await lookupViaPagination(
    parts.apiUrl,
    profile,
    parts.pageUrl,
    totalParticipants,
  )
  if (paginationMatch) return [paginationMatch]

  return []
}
