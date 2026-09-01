import { courseKey } from './courseKey'

export type RaceLike = { id: string; name: string }

/**
 * The race a name already belongs to, or null.
 *
 * Matched with `courseKey`, the same rule the analysis uses to group the runnings
 * of one course, so an event and a bucket list item typed slightly differently in
 * different years still land on one identity. Deliberately not fuzzy, for the
 * reason stated there: a rule nobody can predict is worse than one that
 * occasionally asks you to fix a name.
 *
 * The first match wins. Two races with the same key should not exist, because
 * this function is what stops a second one being created.
 */
export function findRaceByName<T extends RaceLike>(
  races: readonly T[],
  name: string,
): T | null {
  const key = courseKey(name)
  if (!key) return null
  return races.find((race) => courseKey(race.name) === key) ?? null
}
