/**
 * Which races are the runner's anchors, and for which season.
 *
 * One reader for every surface that asks: the season rules, the prediction on
 * the race, discovery, the funnel order and the first-run checklist. They used
 * to ask the bucket list item, which only knows about races that are still
 * wishes.
 */

/** Beyond this the app is not planning any more. Also the rules' shape cap. */
export const MAX_ANCHOR_YEARS = 8

type AnchorRace = {
  id: string
  anchorYears?: number[]
}

export function isAnchorFor(race: AnchorRace, year: number): boolean {
  return (race.anchorYears ?? []).includes(year)
}

/** The race identities that are anchors in this season. */
export function anchorRaceIds(races: readonly AnchorRace[], year: number): Set<string> {
  return new Set(races.filter((race) => isAnchorFor(race, year)).map((race) => race.id))
}

/** Any season: what the funnel sorts by, where a wish may have no year yet. */
export function anyAnchorRaceIds(races: readonly AnchorRace[]): Set<string> {
  return new Set(
    races.filter((race) => (race.anchorYears ?? []).length > 0).map((race) => race.id),
  )
}

/**
 * The years list after marking or unmarking one season.
 *
 * Sorted and deduplicated so the stored value never depends on the order the
 * runner clicked, and capped so a stray loop cannot grow the document.
 */
export function toggleAnchorYear(
  current: readonly number[] | undefined,
  year: number,
  anchor: boolean,
): number[] {
  const years = new Set(current ?? [])
  if (anchor) years.add(year)
  else years.delete(year)
  return [...years]
    .filter((value) => Number.isInteger(value))
    .sort((left, right) => left - right)
    .slice(-MAX_ANCHOR_YEARS)
}

/** Only the years a stored document should be trusted to hold. */
export function parseAnchorYears(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) return undefined
  const years = value
    .filter((item): item is number => typeof item === 'number' && Number.isInteger(item))
    .sort((left, right) => left - right)
  return years.length > 0 ? years : undefined
}
