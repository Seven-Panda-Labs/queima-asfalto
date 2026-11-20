import type { OfficialResultCandidate, UserResultsProfile } from '../shared/types.js'
import {
  matchBerlinTimingRankings,
  parseBerlinTimingRankingUrls,
  parseBerlinTimingUrl,
} from '../shared/berlinTiming.js'
import { calendarDateIsoCandidates } from '../utils/time.js'

const BERLIN_TIMING_FETCH_HEADERS = {
  accept: 'text/html',
  'User-Agent': 'Mozilla/5.0 (compatible; QueimaAsfalto/1.0)',
}

async function fetchBerlinTimingHtml(url: string, referer: string): Promise<string> {
  const response = await fetch(url, { headers: { ...BERLIN_TIMING_FETCH_HEADERS, Referer: referer } })
  if (!response.ok) {
    throw new Error(`Berlin-Timing request error: ${response.status}`)
  }
  return response.text()
}

export async function lookupBerlinTiming(
  resultsUrl: string,
  profile: UserResultsProfile,
  eventDate: Date,
): Promise<OfficialResultCandidate[]> {
  const parts = parseBerlinTimingUrl(resultsUrl)
  if (!parts) return []

  // The event's date picks the edition, whatever edition the saved link shows.
  const page = await fetchBerlinTimingHtml(parts.pageUrl, parts.pageUrl)
  const urls = parseBerlinTimingRankingUrls(page, parts.pageUrl, calendarDateIsoCandidates(eventDate))

  const rankings: Array<{ url: string; html: string }> = []
  for (const url of urls) {
    rankings.push({ url, html: await fetchBerlinTimingHtml(url, parts.pageUrl) })
  }
  return matchBerlinTimingRankings(rankings, profile)
}
