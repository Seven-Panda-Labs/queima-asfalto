import { PARKRUN_BASE_URL } from './types.js'
import { parkrunnerIdForUrl } from './parkrunnerId.js'

export const PARKRUN_PROFILE_BASE_URLS = [
  PARKRUN_BASE_URL,
  'https://www.parkrun.org.uk',
] as const

export const PARKRUN_FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-GB,en;q=0.9,de;q=0.8',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
} as const

export function buildParkrunProfileUrl(baseUrl: string, parkrunnerId: string): string {
  const athleteId = parkrunnerIdForUrl(parkrunnerId)
  return `${baseUrl.replace(/\/$/, '')}/parkrunner/${athleteId}/all/`
}

export function parkrunProfileUrl(parkrunnerId: string): string {
  return buildParkrunProfileUrl(PARKRUN_BASE_URL, parkrunnerId)
}

export function parkrunFetchHeadersForBase(baseUrl: string): Record<string, string> {
  return {
    ...PARKRUN_FETCH_HEADERS,
    Referer: `${baseUrl.replace(/\/$/, '')}/`,
  }
}

export function parkrunFetchHeadersForEvent(
  baseUrl: string,
  slug: string,
): Record<string, string> {
  const origin = baseUrl.replace(/\/$/, '')
  return {
    ...PARKRUN_FETCH_HEADERS,
    Referer: `${origin}/${slug}/`,
    'Sec-Fetch-Site': 'same-origin',
  }
}

export function parkrunBaseUrlFromPageUrl(pageUrl: string): string {
  const url = new URL(pageUrl)
  return `${url.protocol}//${url.host}`
}
