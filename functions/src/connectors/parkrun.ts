import * as cheerio from 'cheerio'
import { logger } from 'firebase-functions'
import type { OfficialResultCandidate, UserResultsProfile } from '../shared/types.js'
import {
  buildParkrunEventLookupUrls,
  resolveParkrunEventSlug,
} from '../shared/parkrunEvent.js'
import { parkrunnerIdForUrl } from '../shared/parkrunnerId.js'
import {
  buildParkrunProfileUrl,
  parkrunBaseUrlFromPageUrl,
  parkrunFetchHeadersForBase,
  parkrunFetchHeadersForEvent,
  PARKRUN_PROFILE_BASE_URLS,
} from '../shared/parkrunProfile.js'
import {
  calendarDateIsoCandidates,
  calendarDateParkrunCandidates,
  formatEventDateIso,
  formatEventDateParkrun,
  normalizeParkrunTime,
  parseRank,
} from '../utils/time.js'

const PARKRUN_ORIGIN = 'https://www.parkrun.com.de'

const FETCH_OPTIONS = {
  method: 'GET',
  redirect: 'follow',
} as const

function eventNameMatches(parkrunName: string, eventName: string): boolean {
  const normalizedEvent = eventName.toLowerCase().replace(/\s+/g, '')
  const normalizedParkrun = parkrunName.toLowerCase().replace(/\s+/g, '')
  return (
    normalizedEvent.includes(normalizedParkrun) ||
    normalizedParkrun.includes(normalizedEvent.replace(/parkrun/g, ''))
  )
}

function parseParkrunDate(cell: string): string | null {
  const trimmed = cell.trim()
  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed)
  if (slash) {
    const day = slash[1]!.padStart(2, '0')
    const month = slash[2]!.padStart(2, '0')
    return `${slash[3]}-${month}-${day}`
  }

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  if (iso) return trimmed

  return null
}

export function resolveParkrunUrl(href: string | undefined): string | undefined {
  if (!href?.trim()) return undefined
  try {
    return new URL(href.trim(), PARKRUN_ORIGIN).toString()
  } catch {
    return undefined
  }
}

type ParsedParkrunRow = {
  venue: string
  dateCell: string
  time: string
  position?: number
  eventResultsUrl?: string
}

/** parkrun.com.de layout: venue | date (link) | run# | position | time | age grade | … */
export function parseParkrunResultRow(cells: string[]): ParsedParkrunRow | null {
  if (cells.length < 3) return null

  const venue = cells[0]?.trim() ?? ''
  const dateCell = cells[1]?.trim() ?? ''
  if (!parseParkrunDate(dateCell)) return null

  let time: string | null = null
  let position: number | undefined

  for (let i = 2; i < cells.length; i++) {
    const parsedTime = normalizeParkrunTime(cells[i] ?? '')
    if (!parsedTime) continue

    time = parsedTime
    const rankBeforeTime = parseRank(cells[i - 1])
    if (rankBeforeTime) position = rankBeforeTime
    break
  }

  if (!time) return null

  return { venue, dateCell, time, position }
}

/** Event results page: statistics card labelled "finishers". */
export function parseParkrunFinishers(html: string): number | undefined {
  const $ = cheerio.load(html)

  let finishers: number | undefined
  $('.statistics-card').each((_, card) => {
    const label = $(card).find('.label').text().trim().toLowerCase()
    if (!label.includes('finisher')) return

    const value = parseRank($(card).find('.value').text())
    if (value) finishers = value
  })

  return finishers
}

export function parseParkrunEventResultsDate(html: string): string | null {
  const $ = cheerio.load(html)
  const dateText = $('.format-date').first().text().trim()
  return parseParkrunDate(dateText)
}

type ParsedEventAthlete = {
  matchedName: string
  time: string
  position?: number
}

export function parseParkrunAthleteFromEventResults(
  html: string,
  athleteId: string,
): ParsedEventAthlete | undefined {
  const $ = cheerio.load(html)
  let result: ParsedEventAthlete | undefined

  $('tr.Results-table-row').each((_, row) => {
    const $row = $(row)
    const link = $row.find('a[href*="/parkrunner/"]').attr('href')
    const id = link?.match(/\/parkrunner\/(\d+)/)?.[1]
    if (id !== athleteId) return

    const time = normalizeParkrunTime($row.find('.Results-table-td--time .compact').first().text())
    if (!time) return

    const position =
      parseRank($row.attr('data-position') ?? '') ??
      parseRank($row.find('.Results-table-td--position').first().text())

    const matchedName =
      $row.attr('data-name')?.trim() ||
      $row.find('.Results-table-td--name a').first().text().trim() ||
      ''

    result = { matchedName, time, position }
  })

  return result
}

function extractParkrunRowCells(
  $: cheerio.CheerioAPI,
  row: Parameters<typeof $>[0],
): { cells: string[]; eventResultsUrl?: string; venue: string } | null {
  const $row = $(row)
  const venueLink = $row.find('td').first().find('a[href*="/results/"]').attr('href')
  if (!venueLink) return null

  const cells = $row
    .find('td')
    .map((__, cell) => $(cell).text().trim())
    .get()

  const dateCell =
    $row.find('td').eq(1).find('.format-date').text().trim() || cells[1] || ''
  if (dateCell) {
    cells[1] = dateCell
  }

  return {
    cells,
    venue: cells[0]?.trim() ?? '',
    eventResultsUrl: resolveParkrunUrl(venueLink),
  }
}

type FetchHeadersFn = (pageUrl: string) => Record<string, string>

type ParkrunFetchResult =
  | { ok: true; html: string; pageUrl: string }
  | { ok: false; lastStatus: number }

async function fetchParkrunPage(
  urls: string[],
  headersForUrl: FetchHeadersFn,
  logLabel: string,
): Promise<ParkrunFetchResult> {
  let lastStatus = 0

  for (const pageUrl of urls) {
    const response = await fetch(pageUrl, {
      ...FETCH_OPTIONS,
      headers: headersForUrl(pageUrl),
    })

    if (response.ok) {
      return { ok: true, html: await response.text(), pageUrl: response.url || pageUrl }
    }

    lastStatus = response.status
    logger.warn(`parkrun ${logLabel} fetch failed`, { pageUrl, status: response.status })
  }

  if (lastStatus > 0) {
    logger.warn(`parkrun ${logLabel} fetch exhausted`, { lastStatus, urls })
  }

  return { ok: false, lastStatus }
}

type EventResultsLookup =
  | { status: 'found'; candidates: OfficialResultCandidate[] }
  | { status: 'no_match'; pageUrl: string }
  | { status: 'date_mismatch'; pageUrl: string; resultsDate: string }
  | { status: 'fetch_failed'; lastStatus: number }

async function lookupParkrunFromEventResults(
  athleteId: string,
  slug: string,
  eventDate: Date,
  eventName: string,
  countryUrl?: string,
): Promise<EventResultsLookup> {
  const isoCandidates = calendarDateIsoCandidates(eventDate)
  const urls = buildParkrunEventLookupUrls(slug, {
    countryUrl,
    eventDateIsoCandidates: isoCandidates,
  })

  let lastStatus = 0
  let lastPageUrl = urls[0] ?? ''
  let lastResultsDate: string | null = null

  for (const pageUrl of urls) {
    const fetched = await fetchParkrunPage(
      [pageUrl],
      (currentUrl) => {
        const baseUrl = parkrunBaseUrlFromPageUrl(currentUrl)
        return parkrunFetchHeadersForEvent(baseUrl, slug)
      },
      'event results',
    )

    if (!fetched.ok) {
      lastStatus = fetched.lastStatus
      continue
    }

    const { html, pageUrl: resolvedPageUrl } = fetched
    lastPageUrl = resolvedPageUrl
    const resultsDate = parseParkrunEventResultsDate(html)
    lastResultsDate = resultsDate

    if (resultsDate && !isoCandidates.includes(resultsDate)) {
      continue
    }

    const athlete = parseParkrunAthleteFromEventResults(html, athleteId)
    if (!athlete) {
      continue
    }

    const totalParticipants = parseParkrunFinishers(html)
    const eventLabel = eventName.trim() || slug

    return {
      status: 'found',
      candidates: [
        {
          platform: 'parkrun',
          matchedName: athlete.matchedName || eventLabel,
          time: athlete.time,
          position: athlete.position,
          totalParticipants,
          sourceUrl: resolvedPageUrl,
          confidence: 'high',
        },
      ],
    }
  }

  if (lastStatus > 0) {
    return { status: 'fetch_failed', lastStatus }
  }

  if (lastResultsDate && !isoCandidates.includes(lastResultsDate)) {
    logger.info('parkrun event results date mismatch', {
      slug,
      resultsDate: lastResultsDate,
      isoCandidates,
      pageUrl: lastPageUrl,
    })
    return { status: 'date_mismatch', pageUrl: lastPageUrl, resultsDate: lastResultsDate }
  }

  logger.info('parkrun athlete not in event results', {
    athleteId,
    slug,
    resultsDate: lastResultsDate,
    pageUrl: lastPageUrl,
  })
  return { status: 'no_match', pageUrl: lastPageUrl }
}

async function lookupParkrunFromProfile(
  parkrunnerId: string,
  athleteId: string,
  eventDate: Date,
  eventName: string,
): Promise<OfficialResultCandidate[]> {
  const profileUrls = PARKRUN_PROFILE_BASE_URLS.map((baseUrl) =>
    buildParkrunProfileUrl(baseUrl, parkrunnerId),
  )
  const fetched = await fetchParkrunPage(
    profileUrls,
    (pageUrl) => parkrunFetchHeadersForBase(parkrunBaseUrlFromPageUrl(pageUrl)),
    'profile',
  )

  if (!fetched.ok) {
    throw new Error(`Parkrun fetch error: ${fetched.lastStatus}`)
  }

  const { html, pageUrl } = fetched
  const $ = cheerio.load(html)
  const isoCandidates = calendarDateIsoCandidates(eventDate)
  const slashCandidates = calendarDateParkrunCandidates(isoCandidates)
  const targetIso = formatEventDateIso(eventDate)
  const targetSlash = formatEventDateParkrun(eventDate)
  const candidates: OfficialResultCandidate[] = []
  const debugRows: Array<{ venue: string; date: string; time?: string; matched: boolean }> = []

  $('table.sortable tbody tr, table tbody tr').each((_, row) => {
    const extracted = extractParkrunRowCells($, row)
    if (!extracted) return

    const parsed = parseParkrunResultRow(extracted.cells)
    if (!parsed) return

    const rowIso = parseParkrunDate(parsed.dateCell)
    const dateMatches =
      (rowIso != null && isoCandidates.includes(rowIso)) ||
      slashCandidates.includes(parsed.dateCell)
    const nameMatches = eventNameMatches(parsed.venue, eventName)

    debugRows.push({
      venue: parsed.venue,
      date: parsed.dateCell,
      time: parsed.time,
      matched: dateMatches && (nameMatches || /park\s*run/i.test(eventName)),
    })

    if (!dateMatches) return

    if (!nameMatches && !/park\s*run/i.test(eventName)) return

    if (!nameMatches && candidates.length > 0) return

    candidates.push({
      platform: 'parkrun',
      matchedName: parsed.venue,
      time: parsed.time,
      position: parsed.position,
      sourceUrl: extracted.eventResultsUrl ?? pageUrl,
      confidence: nameMatches ? 'high' : 'medium',
    })
  })

  await Promise.all(
    candidates.map(async (candidate) => {
      if (!candidate.sourceUrl.includes('/results/')) return

      const eventFetched = await fetchParkrunPage(
        [candidate.sourceUrl],
        (url) => parkrunFetchHeadersForBase(parkrunBaseUrlFromPageUrl(url)),
        'finishers',
      )
      if (!eventFetched.ok) return

      const totalParticipants = parseParkrunFinishers(eventFetched.html)
      if (totalParticipants) {
        candidate.totalParticipants = totalParticipants
      }
    }),
  )

  if (candidates.length === 0) {
    logger.info('parkrun lookup: no match', {
      parkrunnerId,
      athleteId,
      url: pageUrl,
      targetIso,
      targetSlash,
      isoCandidates,
      eventName,
      htmlLength: html.length,
      parsedRows: debugRows.slice(0, 10),
    })
  }

  return candidates
}

export async function lookupParkrun(
  profile: UserResultsProfile,
  eventDate: Date,
  eventName: string,
  resultsUrl?: string,
  parkrunEvent?: { slug?: string; countryUrl?: string },
): Promise<OfficialResultCandidate[]> {
  const parkrunnerId = profile.parkrunnerId?.trim()
  if (!parkrunnerId) return []

  const athleteId = parkrunnerIdForUrl(parkrunnerId)
  const slug = resolveParkrunEventSlug(eventName, {
    resultsUrl,
    parkrunEventSlug: parkrunEvent?.slug,
  })

  if (slug) {
    const eventResults = await lookupParkrunFromEventResults(
      athleteId,
      slug,
      eventDate,
      eventName,
      parkrunEvent?.countryUrl,
    )

    if (eventResults.status === 'found') {
      return eventResults.candidates
    }

    if (eventResults.status === 'no_match') {
      return []
    }

    if (eventResults.status === 'date_mismatch') {
      return lookupParkrunFromProfile(parkrunnerId, athleteId, eventDate, eventName)
    }
  }

  return lookupParkrunFromProfile(parkrunnerId, athleteId, eventDate, eventName)
}
