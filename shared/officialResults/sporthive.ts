/** Sporthive API caps page size at 10 (see eventresults-api.speedhive.com/v3/api-docs). */
export const SPORTRIVE_PAGE_SIZE = 10

/** Parallel page fetches per batch while scanning results (fallback). */
export const SPORTRIVE_PAGE_CONCURRENCY = 25

export const SPORTRIVE_SEARCH_COUNT = 10

const SPORTRIVE_API_BASE = 'https://eventresults-api.speedhive.com/sporthive'

export function buildSporthiveParticipantsUrl(apiUrl: string, page: number): string {
  return `${apiUrl}?size=${SPORTRIVE_PAGE_SIZE}&category=ALL_RESULTS&page=${page}`
}

export function buildSporthiveSearchUrl(
  eventId: string,
  raceId: string,
  term: string,
  offset = 0,
): string {
  const params = new URLSearchParams({
    term,
    sport: '',
    category: 'ActiveRace',
    count: String(SPORTRIVE_SEARCH_COUNT),
    offset: String(offset),
    type: 'Participants',
    eventid: eventId,
    raceid: raceId,
    fuzzy: 'false',
  })
  return `${SPORTRIVE_API_BASE}/search?${params.toString()}`
}

export function buildSporthiveBibUrl(raceId: string, bib: string): string {
  return `${SPORTRIVE_API_BASE}/races/${raceId}/bibs/${encodeURIComponent(bib)}`
}

export function buildSporthiveRaceUrl(raceId: string): string {
  return `${SPORTRIVE_API_BASE}/races/${raceId}`
}
