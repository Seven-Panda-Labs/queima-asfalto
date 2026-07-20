import type { OfficialResultCandidate, UserResultsProfile } from '../shared/types.js'
import { namesMatch } from '../shared/matchName.js'
import { parseSccEventsUrl } from '../shared/parseUrls.js'
import { buildSccEventsSearchTerm } from '../shared/sccEventsSearch.js'
import {
  buildSccEventConfigUrl,
  buildSccResultsPageUrl,
  buildSccResultsSearchUrl,
  parseSccEventKeyFromHtml,
  resolveSccEdition,
  runningCompetitionsForEdition,
  type SccEventsEventConfig,
  type SccEventsResultRow,
  type SccEventsResultsResponse,
} from '../shared/sccEvents.js'
import { normalizeRaceTime } from '../utils/time.js'

function sccHeaders(refererOrigin: string): Record<string, string> {
  return {
    accept: 'application/json, text/javascript, */*; q=0.01',
    Referer: `${refererOrigin}/`,
  }
}

async function fetchSccJson<T>(url: string, refererOrigin: string): Promise<T> {
  const response = await fetch(url, { headers: sccHeaders(refererOrigin) })
  if (!response.ok) {
    throw new Error(`SCC Events API error: ${response.status}`)
  }
  return (await response.json()) as T
}

async function resolveSccEventKey(pageUrl: string, refererOrigin: string): Promise<string | null> {
  const response = await fetch(pageUrl, {
    headers: { accept: 'text/html', Referer: `${refererOrigin}/` },
  })
  if (!response.ok) return null
  const html = await response.text()
  return parseSccEventKeyFromHtml(html)
}

/** Strict path match first; otherwise probe the page for the SCC results widget. */
export async function resolveSccEventsUrlParts(url: string): Promise<ReturnType<typeof parseSccEventsUrl>> {
  const strict = parseSccEventsUrl(url)
  if (strict) return strict

  let loose: NonNullable<ReturnType<typeof parseSccEventsUrl>>
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    loose = { pageUrl: parsed.toString(), refererOrigin: parsed.origin }
  } catch {
    return null
  }

  const eventKey = await resolveSccEventKey(loose.pageUrl, loose.refererOrigin)
  return eventKey ? loose : null
}

function rowToCandidate(
  row: SccEventsResultRow,
  profile: UserResultsProfile,
  pageUrl: string,
  totalParticipants?: number,
): OfficialResultCandidate | null {
  const firstName = row.vorname ?? ''
  const lastName = row.nachname ?? ''
  if (!namesMatch(profile, firstName, lastName)) return null

  const time = normalizeRaceTime(row.netto ?? row.brutto ?? '')
  if (!time) return null

  const matchedName = [firstName, lastName].filter(Boolean).join(' ') || row.name || ''

  return {
    platform: 'sccevents',
    matchedName,
    time,
    position: row.platz,
    totalParticipants,
    sourceUrl: pageUrl,
    confidence: 'high',
  }
}

function findMatchInResults(
  response: SccEventsResultsResponse,
  profile: UserResultsProfile,
  pageUrl: string,
): OfficialResultCandidate | null {
  for (const row of response.data ?? []) {
    const match = rowToCandidate(row, profile, pageUrl)
    if (match) return match
  }
  return null
}

async function fetchCompetitionTotal(
  eventKey: string,
  competitionIdent: string,
  year: string,
  tableName: string,
  refererOrigin: string,
): Promise<number | undefined> {
  const url = buildSccResultsPageUrl({
    eventKey,
    competitionIdent,
    year,
    tableName,
    length: 1,
  })
  const response = await fetchSccJson<SccEventsResultsResponse>(url, refererOrigin)
  return response.recordsTotal
}

export async function lookupSccEvents(
  resultsUrl: string,
  profile: UserResultsProfile,
  eventDate: Date,
): Promise<OfficialResultCandidate[]> {
  const parts = await resolveSccEventsUrlParts(resultsUrl)
  if (!parts) return []

  const searchTerm = buildSccEventsSearchTerm(profile)
  if (!searchTerm) return []

  const eventKey = await resolveSccEventKey(parts.pageUrl, parts.refererOrigin)
  if (!eventKey) return []

  const eventResponse = await fetchSccJson<{ data: SccEventsEventConfig[] }>(
    buildSccEventConfigUrl(eventKey),
    parts.refererOrigin,
  )
  const config = eventResponse.data?.[0]
  if (!config) return []

  const edition = resolveSccEdition(config, eventDate.getFullYear())
  if (!edition) return []

  const year = String(edition.year)
  const competitions = runningCompetitionsForEdition(edition)

  for (const competition of competitions) {
    const searchUrl = buildSccResultsSearchUrl({
      eventKey: config.ident,
      competitionIdent: competition.competition_ident,
      year,
      tableName: competition.tablename,
      term: searchTerm,
    })
    const response = await fetchSccJson<SccEventsResultsResponse>(searchUrl, parts.refererOrigin)
    const candidate = findMatchInResults(response, profile, parts.pageUrl)
    if (!candidate) continue

    const totalParticipants = await fetchCompetitionTotal(
      config.ident,
      competition.competition_ident,
      year,
      competition.tablename,
      parts.refererOrigin,
    )
    if (totalParticipants) {
      candidate.totalParticipants = totalParticipants
    }
    return [candidate]
  }

  return []
}
