import {
  geoapifyAutocomplete,
  geoapifySearch,
  geocodingLanguage,
  type GeocodingResult,
  type GeocodingSuggestion,
} from './geoapify'

export type { GeocodingResult, GeocodingSuggestion } from './geoapify'
export { formatGeoapifyLabel, geocodingLanguage, sleep } from './geoapify'

function getGeoapifyApiKey(): string {
  const key = import.meta.env.VITE_GEOAPIFY_API_KEY
  if (!key) {
    throw new Error(
      'Missing VITE_GEOAPIFY_API_KEY. Add it to .env.local (see .env.example).',
    )
  }
  return key
}

export async function searchLocations(
  query: string,
  language: string,
): Promise<GeocodingSuggestion[]> {
  return geoapifyAutocomplete(getGeoapifyApiKey(), query, geocodingLanguage(language))
}

export async function geocodeLocation(
  query: string,
  language: string,
): Promise<GeocodingResult | null> {
  return geoapifySearch(getGeoapifyApiKey(), query, geocodingLanguage(language))
}
