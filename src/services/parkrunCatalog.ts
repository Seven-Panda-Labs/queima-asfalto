import { doc, getDoc } from 'firebase/firestore'
import type { ParkrunCatalog, ParkrunCatalogEvent } from '../../shared/parkrun/catalog'
import {
  getParkrunEventBySlug,
  getParkrunEventsBySlugs,
  PARKRUN_CATALOG_COLLECTION,
  PARKRUN_CATALOG_DOC_ID,
  searchParkrunEvents,
} from '../../shared/parkrun/catalog'
import {
  isSyncedCatalogFresh,
  newerCatalog,
} from '../../shared/parkrun/catalogSource'
import { db } from './firebase'

let catalogPromise: Promise<ParkrunCatalog> | null = null
let catalogCache: ParkrunCatalog | null = null

/**
 * The catalog committed to the repo, used when nothing has synced the
 * Firestore document yet: a fresh project, a self-hosted instance without
 * functions, or an unreadable document.
 */
async function loadBundledSeed(): Promise<ParkrunCatalog> {
  const module = await import('../data/parkrun-events.json')
  return module.default as ParkrunCatalog
}

async function loadSyncedCatalog(): Promise<ParkrunCatalog | null> {
  try {
    const snapshot = await getDoc(
      doc(db, PARKRUN_CATALOG_COLLECTION, PARKRUN_CATALOG_DOC_ID),
    )
    if (!snapshot.exists()) return null

    const data = snapshot.data()
    const events = data.events
    if (!Array.isArray(events)) return null

    return {
      syncedAt: typeof data.syncedAt === 'string' ? data.syncedAt : '',
      events: events as ParkrunCatalogEvent[],
    }
  } catch {
    // Offline, unapproved, or rules-denied: the seed still serves the picker.
    return null
  }
}

async function resolveCatalog(): Promise<ParkrunCatalog> {
  const synced = await loadSyncedCatalog()

  // A fresh sync is authoritative, and skipping the seed keeps its chunk off
  // the wire entirely.
  if (synced && isSyncedCatalogFresh(synced.syncedAt, synced.events.length, new Date())) {
    return synced
  }

  return newerCatalog(synced, await loadBundledSeed())
}

export async function loadParkrunCatalog(): Promise<ParkrunCatalog> {
  if (catalogCache) return catalogCache
  if (!catalogPromise) {
    catalogPromise = resolveCatalog()
      .then((catalog) => {
        catalogCache = catalog
        return catalog
      })
      .catch((error) => {
        catalogPromise = null
        throw error
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
