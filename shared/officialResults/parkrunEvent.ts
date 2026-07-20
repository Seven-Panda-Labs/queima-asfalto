import { PARKRUN_BASE_URL } from './types.js'

export const PARKRUN_EVENT_BASE_URLS = [
  PARKRUN_BASE_URL,
  'https://www.parkrun.org.uk',
] as const

export function parkrunEventSlug(eventName: string): string | null {
  const withoutParkrun = eventName.trim().replace(/park\s*run/gi, '').trim()
  if (!withoutParkrun) return null

  const slug = withoutParkrun.toLowerCase().replace(/[^a-z0-9]+/g, '')
  return slug.length > 0 ? slug : null
}

export function parkrunSlugFromResultsUrl(resultsUrl: string): string | null {
  try {
    const pathname = new URL(resultsUrl.trim()).pathname
    const match = /^\/([^/]+)\/results(?:\/|$)/i.exec(pathname)
    return match?.[1] ?? null
  } catch {
    return null
  }
}

export type ResolveParkrunEventSlugOptions = {
  resultsUrl?: string
  parkrunEventSlug?: string
}

export function resolveParkrunEventSlug(
  eventName: string,
  options?: ResolveParkrunEventSlugOptions | string,
): string | null {
  const resolved =
    typeof options === 'string' ? { resultsUrl: options } : (options ?? {})

  const explicit = resolved.parkrunEventSlug?.trim().toLowerCase()
  if (explicit) return explicit

  const fromUrl = resolved.resultsUrl?.trim()
    ? parkrunSlugFromResultsUrl(resolved.resultsUrl)
    : null
  if (fromUrl) return fromUrl
  return parkrunEventSlug(eventName)
}

export function buildParkrunLatestResultsUrl(baseUrl: string, slug: string): string {
  return `${baseUrl.replace(/\/$/, '')}/${slug}/results/latestresults/`
}

export function buildParkrunDateResultsUrl(baseUrl: string, slug: string, isoDate: string): string {
  return `${baseUrl.replace(/\/$/, '')}/${slug}/results/${isoDate}/`
}

function uniqueParkrunBaseUrls(countryUrl?: string): string[] {
  const bases = countryUrl?.trim()
    ? [countryUrl.trim(), ...PARKRUN_EVENT_BASE_URLS]
    : [...PARKRUN_EVENT_BASE_URLS]

  return [...new Set(bases.map((baseUrl) => baseUrl.replace(/\/$/, '')))]
}

export function buildParkrunEventLookupUrls(
  slug: string,
  options?: { countryUrl?: string; eventDateIsoCandidates?: string[] },
): string[] {
  const bases = uniqueParkrunBaseUrls(options?.countryUrl)
  const urls: string[] = []

  for (const isoDate of options?.eventDateIsoCandidates ?? []) {
    for (const baseUrl of bases) {
      urls.push(buildParkrunDateResultsUrl(baseUrl, slug, isoDate))
    }
  }

  for (const baseUrl of bases) {
    urls.push(buildParkrunLatestResultsUrl(baseUrl, slug))
  }

  return [...new Set(urls)]
}

export function buildParkrunLatestResultsUrls(slug: string, countryUrl?: string): string[] {
  return uniqueParkrunBaseUrls(countryUrl).map((baseUrl) =>
    buildParkrunLatestResultsUrl(baseUrl, slug),
  )
}
