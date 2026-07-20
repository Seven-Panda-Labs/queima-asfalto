import type { OfficialResultCandidate, UserResultsProfile } from '../shared/types.js'
import { namesMatchFullName } from '../shared/matchName.js'
import {
  buildMyRacePartnerCsvUrl,
  isMyRacePartnerCsv,
  parseMyRacePartnerCsv,
  parseMyRacePartnerHtmlRows,
  parseMyRacePartnerResultIdsFromHtml,
  parseMyRacePartnerSummaryTotalFromHtml,
  parseMyRacePartnerTime,
  stripCsvBom,
  type MyRacePartnerCsvRow,
  type MyRacePartnerHtmlRow,
} from '../shared/myRacePartner.js'
import { parseMyRacePartnerUrl, type MyRacePartnerUrlParts } from '../shared/parseUrls.js'

const MRP_FETCH_HEADERS = {
  accept: 'text/csv,text/html,text/plain,*/*',
  'User-Agent': 'Mozilla/5.0 (compatible; QueimaAsfalto/1.0)',
}

async function fetchMyRacePartnerText(url: string, referer: string): Promise<string> {
  const response = await fetch(url, {
    headers: { ...MRP_FETCH_HEADERS, Referer: referer },
  })
  if (!response.ok) {
    throw new Error(`MyRacePartner request error: ${response.status}`)
  }
  return response.text()
}

async function fetchMyRacePartnerCsv(resultId: string, referer: string): Promise<string> {
  const csv = stripCsvBom(await fetchMyRacePartnerText(buildMyRacePartnerCsvUrl(resultId), referer))
  if (!isMyRacePartnerCsv(csv)) {
    throw new Error('MyRacePartner CSV response was not CSV')
  }
  return csv
}

async function resolveResultIds(parts: MyRacePartnerUrlParts): Promise<string[]> {
  if (parts.resultId) return [parts.resultId]

  const html = await fetchMyRacePartnerText(parts.pageUrl, parts.pageUrl)
  return parseMyRacePartnerResultIdsFromHtml(html)
}

function rowToCandidate(
  row: MyRacePartnerCsvRow | MyRacePartnerHtmlRow,
  profile: UserResultsProfile,
  pageUrl: string,
  totalParticipants?: number,
): OfficialResultCandidate | null {
  if (!namesMatchFullName(profile, row.name)) return null

  const time =
    'note' in row ? parseMyRacePartnerTime(row.note) : row.time
  if (!time) return null

  return {
    platform: 'myracepartner',
    matchedName: row.name,
    time,
    position: row.position,
    totalParticipants,
    sourceUrl: pageUrl,
    confidence: 'high',
  }
}

function findCsvMatch(
  rows: MyRacePartnerCsvRow[],
  profile: UserResultsProfile,
  pageUrl: string,
  totalParticipants?: number,
): OfficialResultCandidate | null {
  for (const row of rows) {
    const match = rowToCandidate(row, profile, pageUrl, totalParticipants)
    if (match) return match
  }
  return null
}

async function lookupFromHtml(
  parts: MyRacePartnerUrlParts,
  profile: UserResultsProfile,
  resultId: string,
): Promise<OfficialResultCandidate | null> {
  const pageUrl = new URL(parts.pageUrl)
  pageUrl.searchParams.set('event-id', parts.eventId ?? pageUrl.searchParams.get('event-id') ?? '')
  pageUrl.searchParams.set('result-id', resultId)

  const html = await fetchMyRacePartnerText(pageUrl.toString(), parts.pageUrl)
  const rows = parseMyRacePartnerHtmlRows(html)
  const totalParticipants = parseMyRacePartnerSummaryTotalFromHtml(html) ?? rows.length

  for (const row of rows) {
    const match = rowToCandidate(row, profile, parts.pageUrl, totalParticipants)
    if (match) return match
  }
  return null
}

export async function lookupMyRacePartner(
  resultsUrl: string,
  profile: UserResultsProfile,
): Promise<OfficialResultCandidate[]> {
  const parts = parseMyRacePartnerUrl(resultsUrl)
  if (!parts) return []

  const resultIds = await resolveResultIds(parts)
  if (resultIds.length === 0) return []

  for (const resultId of resultIds) {
    const csv = await fetchMyRacePartnerCsv(resultId, parts.pageUrl)
    const rows = parseMyRacePartnerCsv(csv)
    const totalParticipants = rows.length
    const match = findCsvMatch(rows, profile, parts.pageUrl, totalParticipants)
    if (match) return [match]

    const htmlMatch = await lookupFromHtml(parts, profile, resultId)
    if (htmlMatch) return [htmlMatch]
  }

  return []
}
