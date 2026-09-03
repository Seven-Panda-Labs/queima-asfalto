import { useEffect, useRef } from 'react'
import { anchorClaimsToWrite, roleClaimsToWrite } from '../domain/anchorMigration'
import { setRaceAnchorYear, setRaceSeasonRole } from '../services/races'
import type { BucketListItem } from '../types/BucketListItem'
import type { Race } from '../types/Race'
import type { RaceEntry } from '../types/RaceEntry'

/**
 * Moves the anchors the app already knew onto the race, once.
 *
 * On the client for the same reason as the rollover: it has to happen for every
 * account, and nothing else iterates accounts.
 *
 * The wish's fields are cleared once they have been carried over, which is what
 * makes this a migration rather than a mirror: without that, unmarking an
 * anchor from the event page would be undone on the next load by the wish that
 * still says otherwise.
 */
export function useSeasonMigration(
  items: readonly BucketListItem[],
  entries: readonly RaceEntry[],
  races: readonly Race[],
  loading: boolean,
  /** Clears the wish's own copy once the race carries it. */
  clearItemSeason: (itemId: string, fields: { anchor?: boolean; role?: boolean }) => Promise<void>,
) {
  const inFlight = useRef(new Set<string>())

  useEffect(() => {
    if (loading) return

    const itemByRaceId = new Map(
      items.filter((item) => item.raceId).map((item) => [item.raceId!, item.id]),
    )
    const anchors = anchorClaimsToWrite(items, entries, races).filter(
      (claim) => !inFlight.current.has(`anchor:${claim.raceId}:${claim.year}`),
    )
    const roles = roleClaimsToWrite(items, races).filter(
      (claim) => !inFlight.current.has(`role:${claim.raceId}`),
    )
    if (anchors.length === 0 && roles.length === 0) return

    let cancelled = false

    void (async () => {
      for (const claim of anchors) {
        const key = `anchor:${claim.raceId}:${claim.year}`
        inFlight.current.add(key)
        try {
          await setRaceAnchorYear(claim.raceId, claim.year, true)
          const itemId = itemByRaceId.get(claim.raceId)
          if (itemId) await clearItemSeason(itemId, { anchor: true })
        } catch {
          inFlight.current.delete(key)
        }
        if (cancelled) return
      }

      for (const claim of roles) {
        const key = `role:${claim.raceId}`
        inFlight.current.add(key)
        try {
          await setRaceSeasonRole(claim.raceId, {
            role: claim.role ?? null,
            servesRaceId: claim.servesRaceId ?? null,
          })
          const itemId = itemByRaceId.get(claim.raceId)
          if (itemId) await clearItemSeason(itemId, { role: true })
        } catch {
          inFlight.current.delete(key)
        }
        if (cancelled) return
      }
    })()

    return () => {
      cancelled = true
    }
  }, [clearItemSeason, entries, items, loading, races])
}
