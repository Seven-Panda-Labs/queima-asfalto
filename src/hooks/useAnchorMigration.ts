import { useEffect, useRef } from 'react'
import { anchorClaimsToWrite } from '../domain/anchorMigration'
import { setRaceAnchorYear } from '../services/races'
import type { BucketListItem } from '../types/BucketListItem'
import type { Race } from '../types/Race'
import type { RaceEntry } from '../types/RaceEntry'

/**
 * Moves the anchors the app already knew onto the race, once.
 *
 * On the client for the same reason as the rollover: it has to happen for every
 * account, and nothing else iterates accounts.
 *
 * The wish's flag is cleared once it has been carried over, which is what makes
 * this a migration rather than a mirror: without that, unmarking an anchor from
 * the event page would be undone on the next load by the wish that still says
 * otherwise.
 */
export function useAnchorMigration(
  items: readonly BucketListItem[],
  entries: readonly RaceEntry[],
  races: readonly Race[],
  loading: boolean,
  /** Clears the wish's flag once the race carries the season. */
  clearItemAnchor: (itemId: string) => Promise<void>,
) {
  const inFlight = useRef(new Set<string>())

  useEffect(() => {
    if (loading) return

    const claims = anchorClaimsToWrite(items, entries, races)
    const itemByRaceId = new Map(
      items.filter((item) => item.raceId).map((item) => [item.raceId!, item.id]),
    )
    const pending = claims.filter(
      (claim) => !inFlight.current.has(`${claim.raceId}:${claim.year}`),
    )
    if (pending.length === 0) return

    let cancelled = false

    void (async () => {
      for (const claim of pending) {
        const key = `${claim.raceId}:${claim.year}`
        inFlight.current.add(key)
        try {
          await setRaceAnchorYear(claim.raceId, claim.year, true)
          const itemId = itemByRaceId.get(claim.raceId)
          if (itemId) await clearItemAnchor(itemId)
        } catch {
          inFlight.current.delete(key)
        }
        if (cancelled) return
      }
    })()

    return () => {
      cancelled = true
    }
  }, [clearItemAnchor, entries, items, loading, races])
}
