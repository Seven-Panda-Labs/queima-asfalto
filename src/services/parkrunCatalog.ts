import type { ParkrunCatalog, ParkrunCatalogEvent } from '../../shared/parkrun/catalog'
import {
  getParkrunEventBySlug,
  getParkrunEventsBySlugs,
  searchParkrunEvents,
} from '../../shared/parkrun/catalog'

let catalogPromise: Promise<ParkrunCatalog> | null = null
let catalogCache: ParkrunCatalog | null = null

export async function loadParkrunCatalog(): Promise<ParkrunCatalog> {
  if (catalogCache) return catalogCache
  if (!catalogPromise) {
    catalogPromise = import('../data/parkrun-events.json').then((module) => {
      catalogCache = module.default as ParkrunCatalog
      return catalogCache
    })
  }
  return catalogPromise
}

export function findParkrunEvent(
  catalog: ParkrunCatalog,
  slug: string,
): ParkrunCatalogEvent | undefined {
  return getParkrunEventBySlug(catalog, slug)
}

export function findParkrunEventsBySlugs(
  catalog: ParkrunCatalog,
  slugs: string[],
): ParkrunCatalogEvent[] {
  return getParkrunEventsBySlugs(catalog, slugs)
}

export function searchParkrunCatalog(
  catalog: ParkrunCatalog,
  query: string,
  options?: { limit?: number },
): ParkrunCatalogEvent[] {
  return searchParkrunEvents(catalog, query, options)
}
