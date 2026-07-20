import {
  getParkrunEventBySlug,
  searchParkrunEvents,
  type ParkrunCatalog,
  type ParkrunCatalogEvent,
} from './catalog.js'
import { resolveParkrunEventSlug } from '../officialResults/parkrunEvent.js'

export type ResolveParkrunCatalogInput = {
  name: string
  resultsUrl?: string
  locationLat?: number
  locationLng?: number
}

export type ResolveParkrunCatalogResult =
  | { status: 'found'; event: ParkrunCatalogEvent; method: 'slug' | 'search' | 'proximity' }
  | { status: 'ambiguous'; candidates: ParkrunCatalogEvent[] }
  | { status: 'not_found' }

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function pickClosestEvent(
  candidates: ParkrunCatalogEvent[],
  lat: number,
  lng: number,
): ParkrunCatalogEvent | undefined {
  let closest: ParkrunCatalogEvent | undefined
  let closestDistance = Number.POSITIVE_INFINITY

  for (const candidate of candidates) {
    const distance = haversineKm(lat, lng, candidate.lat, candidate.lng)
    if (distance < closestDistance) {
      closestDistance = distance
      closest = candidate
    }
  }

  return closestDistance <= 25 ? closest : undefined
}

/** Extract plausible parkrun labels from compound event names (VR combos, notes, numbered lists). */
export function extractParkrunNameCandidates(name: string): string[] {
  const seen = new Set<string>()
  const results: string[] = []

  function add(value: string) {
    const cleaned = value
      .replace(/\*[^*]*\*/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    const key = cleaned.toLowerCase()
    if (!cleaned || seen.has(key)) return
    seen.add(key)
    results.push(cleaned)
  }

  add(name)

  for (const line of name.split(/\r?\n/)) {
    const stripped = line.replace(/^\d+\.\s*/, '').trim()
    if (/park\s*run/i.test(stripped)) add(stripped)
  }

  const denoted = name.replace(/\*[^*]*\*/g, '').replace(/^\d+\.\s*/gm, '')
  for (const line of denoted.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (/park\s*run/i.test(trimmed)) add(trimmed)
  }

  return results
}

function resolveFromSlug(
  catalog: ParkrunCatalog,
  input: ResolveParkrunCatalogInput,
): ResolveParkrunCatalogResult | null {
  for (const candidate of extractParkrunNameCandidates(input.name)) {
    const slug = resolveParkrunEventSlug(candidate, { resultsUrl: input.resultsUrl })
    if (!slug) continue
    const event = getParkrunEventBySlug(catalog, slug)
    if (event?.seriesId === 1) {
      return { status: 'found', event, method: 'slug' }
    }
  }
  return null
}

function resolveFromSearch(
  catalog: ParkrunCatalog,
  input: ResolveParkrunCatalogInput,
): ResolveParkrunCatalogResult | null {
  for (const candidate of extractParkrunNameCandidates(input.name)) {
    const searchQuery = candidate.replace(/park\s*run/gi, ' ').trim()
    const matches = searchParkrunEvents(catalog, searchQuery, { seriesId: 1, limit: 12 })

    if (matches.length === 1) {
      return { status: 'found', event: matches[0]!, method: 'search' }
    }

    if (matches.length > 1 && input.locationLat != null && input.locationLng != null) {
      const closest = pickClosestEvent(matches, input.locationLat, input.locationLng)
      if (closest) {
        return { status: 'found', event: closest, method: 'proximity' }
      }
      return { status: 'ambiguous', candidates: matches }
    }

    if (matches.length > 1) {
      return { status: 'ambiguous', candidates: matches }
    }
  }
  return null
}

export function resolveParkrunCatalogEvent(
  catalog: ParkrunCatalog,
  input: ResolveParkrunCatalogInput,
): ResolveParkrunCatalogResult {
  const fromSlug = resolveFromSlug(catalog, input)
  if (fromSlug) return fromSlug

  const fromSearch = resolveFromSearch(catalog, input)
  if (fromSearch) return fromSearch

  return { status: 'not_found' }
}
