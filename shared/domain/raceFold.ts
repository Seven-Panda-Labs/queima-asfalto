/** The parts of a race that a fold carries over. */
export type FoldableRace = {
  anchorYears?: number[]
  role?: string
  servesRaceId?: string
  officialUrl?: string
  locationLat?: number
  locationLng?: number
}

/**
 * What the race that stays takes from a duplicate folded into it.
 *
 * The anchors of both, since a season marked on either was marked on this
 * race. Everything else only where the one that stays has nothing: its name
 * and place are the ones the runner already sees.
 */
export function foldedRaceFields(into: FoldableRace, from: FoldableRace): FoldableRace {
  const anchorYears = [...new Set([...(into.anchorYears ?? []), ...(from.anchorYears ?? [])])].sort(
    (left, right) => left - right,
  )
  const hasPlace = into.locationLat != null && into.locationLng != null
  return {
    anchorYears,
    role: into.role ?? from.role,
    servesRaceId: into.role ? into.servesRaceId : from.servesRaceId,
    officialUrl: into.officialUrl || from.officialUrl,
    locationLat: hasPlace ? into.locationLat : from.locationLat,
    locationLng: hasPlace ? into.locationLng : from.locationLng,
  }
}

/**
 * Which of several races for one catalog entry stays.
 *
 * The one named like the catalog, which is the name without the typo that
 * usually split them; then the one with the most history pointing at it, so
 * the fewest documents move; then the oldest.
 */
export function raceToKeep<T extends { id: string; name: string; createdAt: Date }>(
  races: readonly T[],
  catalogName: string | undefined,
  references: (race: T) => number,
): T {
  const named = (race: T) => (catalogName && normalize(race.name) === normalize(catalogName) ? 1 : 0)
  return [...races].sort(
    (left, right) =>
      named(right) - named(left) ||
      references(right) - references(left) ||
      left.createdAt.getTime() - right.createdAt.getTime(),
  )[0]!
}

function normalize(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}
