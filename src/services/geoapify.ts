export type GeocodingSuggestion = {
  label: string
  lat: number
  lng: number
}

export type GeocodingResult = {
  lat: number
  lng: number
  displayName: string
}

const GEOAPIFY_BASE = 'https://api.geoapify.com/v1'

export type GeoapifyFeature = {
  formatted?: string
  address_line1?: string
  address_line2?: string
  name?: string
  city?: string
  state?: string
  country?: string
  suburb?: string
  district?: string
  county?: string
  street?: string
  housenumber?: string
  postcode?: string
  result_type?: string
  lat?: number
  lon?: number
}

type GeoapifyJsonResponse = {
  results?: GeoapifyFeature[]
}

/** Geoapify `lang` — ISO 639-1 (pt, en, …). */
export function geocodingLanguage(i18nLanguage: string): string {
  return i18nLanguage.toLowerCase().startsWith('pt') ? 'pt' : 'en'
}

function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

function clean(value?: string): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

function isStreetLikeName(name: string, feature: GeoapifyFeature): boolean {
  if (feature.street && name === feature.street) return true
  return /\b(str\.|straße|strasse|street|rua|avenida|ave\.|via|road|rd\.)\b/i.test(name)
}

/** Short label for events: area + city, without street, number or postcode. */
export function formatEventLocation(feature: GeoapifyFeature): string | null {
  const type = feature.result_type
  const name = clean(feature.name)
  const suburb = clean(feature.suburb) || clean(feature.district)
  const city = clean(feature.city) || clean(feature.county)

  const streetLevel = type === 'street' || type === 'building' || type === 'postcode'
  const parts: string[] = []

  if (streetLevel) {
    if (suburb) parts.push(suburb)
    else if (name && name !== city && !isStreetLikeName(name, feature)) parts.push(name)
    if (city) parts.push(city)
  } else if (type === 'city' || type === 'county') {
    if (city || name) parts.push(city ?? name!)
  } else if (type === 'state' || type === 'country') {
    if (name) parts.push(name)
  } else {
    const primary = name ?? suburb
    if (primary) parts.push(primary)
    if (city && city !== primary) parts.push(city)
  }

  const unique = [...new Set(parts)]
  if (unique.length > 0) return unique.join(', ')

  const line2 = clean(feature.address_line2)
  if (line2 && !/\d{4,}/.test(line2)) return line2

  return formatGeoapifyLabel(feature)
}

export function formatGeoapifyLabel(feature: GeoapifyFeature): string | null {
  if (feature.formatted?.trim()) return feature.formatted.trim()
  const parts = [feature.address_line1, feature.address_line2].filter(Boolean)
  if (parts.length > 0) return parts.join(', ')
  return null
}

function featureToResult(feature: GeoapifyFeature): GeocodingResult | null {
  const lat = feature.lat
  const lng = feature.lon
  if (lat === undefined || lng === undefined || !isValidCoordinate(lat, lng)) return null
  const displayName = formatEventLocation(feature)
  if (!displayName) return null
  return { lat, lng, displayName }
}

async function geoapifyRequest(
  apiKey: string,
  path: string,
  params: Record<string, string>,
): Promise<GeoapifyJsonResponse> {
  const url = new URL(`${GEOAPIFY_BASE}/${path}`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  url.searchParams.set('apiKey', apiKey)
  url.searchParams.set('format', 'json')

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new Error(`Geocoding request failed: ${response.status}`)
  }
  return response.json() as Promise<GeoapifyJsonResponse>
}

function dedupeSuggestions(suggestions: GeocodingSuggestion[]): GeocodingSuggestion[] {
  const seen = new Set<string>()
  return suggestions.filter((item) => {
    const key = item.label.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function geoapifyAutocomplete(
  apiKey: string,
  query: string,
  language: string,
  limit = 6,
): Promise<GeocodingSuggestion[]> {
  const trimmed = query.trim()
  if (trimmed.length < 3) return []

  const data = await geoapifyRequest(apiKey, 'geocode/autocomplete', {
    text: trimmed,
    lang: language,
    limit: String(limit),
  })

  const suggestions = (data.results ?? [])
    .map((feature) => {
      const result = featureToResult(feature)
      if (!result) return null
      return { label: result.displayName, lat: result.lat, lng: result.lng }
    })
    .filter((item): item is GeocodingSuggestion => item !== null)

  return dedupeSuggestions(suggestions)
}

export async function geoapifySearch(
  apiKey: string,
  query: string,
  language: string,
): Promise<GeocodingResult | null> {
  const trimmed = query.trim()
  if (!trimmed || trimmed === '??') return null

  const data = await geoapifyRequest(apiKey, 'geocode/search', {
    text: trimmed,
    lang: language,
    limit: '1',
  })

  const first = data.results?.[0]
  if (!first) return null
  return featureToResult(first)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
