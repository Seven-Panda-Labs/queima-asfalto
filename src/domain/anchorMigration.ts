import type { BucketListItem } from '../types/BucketListItem'
import type { RaceEntry } from '../types/RaceEntry'
import { isAnchorFor } from './seasonAnchors'
import type { RaceRole } from './seasonRules'

/** One race, one season, to be recorded as an anchor. */
export type AnchorClaim = {
  raceId: string
  year: number
}

/** What a race is for, moved off the wish that used to hold it. */
export type RoleClaim = {
  raceId: string
  role?: RaceRole
  servesRaceId?: string
}

type AnchorRace = {
  id: string
  anchorYears?: number[]
  role?: RaceRole
  servesRaceId?: string
}

/**
 * Anchors the app already knew about, moved onto the race.
 *
 * `isAnchor` used to live on the wish, so it was lost the moment a race was
 * scheduled and never existed for a runner who plans straight into events. This
 * carries forward what is still there, once, and says nothing about events: no
 * data anywhere records which event was somebody's anchor, so those are marked
 * by hand.
 *
 * Idempotent by construction: a claim is only produced when the race does not
 * already carry that season.
 */
export function anchorClaimsToWrite(
  items: readonly BucketListItem[],
  entries: readonly RaceEntry[],
  races: readonly AnchorRace[],
  today: Date = new Date(),
): AnchorClaim[] {
  const byId = new Map(races.map((race) => [race.id, race]))
  const claims: AnchorClaim[] = []

  for (const item of items) {
    if (item.isAnchor !== true || !item.raceId) continue

    const race = byId.get(item.raceId)
    if (!race) continue

    // The season the wish is about: its latest attempt, then what the runner
    // typed, and only then the year we are in.
    const latest = entries
      .filter((entry) => entry.bucketListItemId === item.id)
      .reduce<RaceEntry | null>((best, entry) => (!best || entry.year > best.year ? entry : best), null)
    const year = latest?.year ?? item.targetYear ?? today.getFullYear()

    if (isAnchorFor(race, year)) continue
    claims.push({ raceId: item.raceId, year })
  }

  return claims
}

/**
 * Roles the app already knew about, moved onto the race.
 *
 * Same reason as the anchors, and the same one way trip: the wish keeps the
 * field until the race has it, and then loses it. A race that already says
 * something is left alone, because the event page may have been the one that
 * said it.
 */
export function roleClaimsToWrite(
  items: readonly BucketListItem[],
  races: readonly AnchorRace[],
): RoleClaim[] {
  const byId = new Map(races.map((race) => [race.id, race]))
  const claims: RoleClaim[] = []

  for (const item of items) {
    if (!item.raceId) continue
    if (!item.role && !item.servesRaceId) continue

    const race = byId.get(item.raceId)
    if (!race) continue
    if (race.role || race.servesRaceId) continue

    claims.push({
      raceId: item.raceId,
      ...(item.role ? { role: item.role } : {}),
      ...(item.servesRaceId ? { servesRaceId: item.servesRaceId } : {}),
    })
  }

  return claims
}
