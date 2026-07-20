export type ParkrunCatalogEvent = {
  id: number
  slug: string
  shortName: string
  longName: string
  location: string
  countryCode: number
  countryUrl: string
  seriesId: number
  lat: number
  lng: number
}

export type ParkrunCatalog = {
  syncedAt: string
  events: ParkrunCatalogEvent[]
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

function eventSearchText(event: ParkrunCatalogEvent): string {
  return normalizeSearchText(
    [event.slug, event.shortName, event.longName, event.location].join(' '),
  )
}

export function getParkrunEventBySlug(
  catalog: ParkrunCatalog,
  slug: string,
): ParkrunCatalogEvent | undefined {
  const normalized = slug.trim().toLowerCase()
  return catalog.events.find((event) => event.slug === normalized)
}

export function getParkrunEventsBySlugs(
  catalog: ParkrunCatalog,
  slugs: string[],
): ParkrunCatalogEvent[] {
  const seen = new Set<string>()
  const results: ParkrunCatalogEvent[] = []

  for (const slug of slugs) {
    const normalized = slug.trim().toLowerCase()
    if (!normalized || seen.has(normalized)) continue
    const event = getParkrunEventBySlug(catalog, normalized)
    if (!event) continue
    seen.add(normalized)
    results.push(event)
  }

  return results
}

export function searchParkrunEvents(
  catalog: ParkrunCatalog,
  query: string,
  options?: { seriesId?: number; limit?: number },
): ParkrunCatalogEvent[] {
  const limit = options?.limit ?? 20
  const seriesId = options?.seriesId ?? 1
  const normalizedQuery = normalizeSearchText(query)

  const pool = catalog.events.filter((event) => event.seriesId === seriesId)

  if (!normalizedQuery) {
    return pool.slice(0, limit)
  }

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean)
  const matches = pool.filter((event) => {
    const haystack = eventSearchText(event)
    return tokens.every((token) => haystack.includes(token))
  })

  return matches.slice(0, limit)
}

export function countryUrlFromParkrunHost(host: string): string {
  const trimmed = host.replace(/^https?:\/\//, '').replace(/\/$/, '')
  return `https://${trimmed}`
}
