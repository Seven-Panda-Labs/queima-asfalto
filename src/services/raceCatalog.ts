import type { RaceCatalog } from '../../shared/raceCatalog'

let catalogPromise: Promise<RaceCatalog> | null = null

/**
 * The curated catalog committed to the repo.
 *
 * Lazily imported, like the parkrun seed, so 26 races and whatever they grow into
 * stay out of the main bundle. There is no Firestore side yet: a harvested catalog
 * refreshing this shape is #210, and when it lands this file gains the same
 * seed-versus-synced fallback `parkrunCatalog.ts` already has.
 */
export async function loadRaceCatalog(): Promise<RaceCatalog> {
  catalogPromise ??= import('../data/race-catalog.json').then(
    (module) => module.default as RaceCatalog,
  )
  return catalogPromise
}
