import { useEffect, useRef } from 'react'
import { rolloversToCreate } from '../domain/raceEntryRollover'
import type { BucketListItem } from '../types/BucketListItem'
import type { RaceEntry, RaceEntryCreate } from '../types/RaceEntry'

/**
 * Materialises next year's attempts when the bucket list loads.
 *
 * On the client rather than in the reminder function, which only iterates
 * accounts that enabled notifications: a rollover has to happen for everybody who
 * ticked "I try this one every year", whether or not they want to be told about
 * it.
 *
 * `rolledOverFrom` is the guard. This runs on every load and writes once, and the
 * in-flight set stops a second pass firing while the first is still in the air.
 */
export function useRaceEntryRollover(
  items: readonly BucketListItem[],
  entries: readonly RaceEntry[],
  loading: boolean,
  addEntry: (data: RaceEntryCreate) => Promise<string>,
) {
  const inFlight = useRef(new Set<string>())

  useEffect(() => {
    if (loading) return

    const pending = rolloversToCreate(items, entries).filter(
      (entry) => entry.rolledOverFrom && !inFlight.current.has(entry.rolledOverFrom),
    )
    if (pending.length === 0) return

    let cancelled = false

    void (async () => {
      for (const entry of pending) {
        inFlight.current.add(entry.rolledOverFrom!)
        try {
          await addEntry(entry)
        } catch {
          // A failed rollover is not worth a message: the next load tries again,
          // and nothing the runner asked for has been lost.
          inFlight.current.delete(entry.rolledOverFrom!)
        }
        if (cancelled) return
      }
    })()

    return () => {
      cancelled = true
    }
  }, [items, entries, loading, addEntry])
}
