import { initializeApp, getApps } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import {
  PARKRUN_CATALOG_COLLECTION,
  PARKRUN_CATALOG_DOC_ID,
} from './shared/parkrun/catalog.js'
import {
  catalogSyncDate,
  isAcceptableRefresh,
  normalizeParkrunCatalog,
  PARKRUN_EVENTS_URL,
  type RawParkrunEventsJson,
} from './shared/parkrun/catalogSource.js'
import { scheduleFunctionOptions } from './functionOptions.js'

if (getApps().length === 0) {
  initializeApp()
}

const db = getFirestore()

/** parkrun adds a couple of events a week, so weekly is ample. */
const SYNC_SCHEDULE = 'every monday 04:00'
const FETCH_TIMEOUT_MS = 60_000

function catalogRef() {
  return db.collection(PARKRUN_CATALOG_COLLECTION).doc(PARKRUN_CATALOG_DOC_ID)
}

async function fetchUpstreamCatalog(): Promise<RawParkrunEventsJson> {
  const response = await fetch(PARKRUN_EVENTS_URL, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`parkrun events feed responded ${response.status}`)
  }

  return (await response.json()) as RawParkrunEventsJson
}

/**
 * Refresh the parkrun catalog document from the upstream feed.
 *
 * Exported for the emulator and for tests; the schedule below is the only
 * production caller.
 */
export async function refreshParkrunCatalog(now: Date): Promise<{
  written: boolean
  eventCount: number
  reason?: string
}> {
  const raw = await fetchUpstreamCatalog()
  const catalog = normalizeParkrunCatalog(raw, catalogSyncDate(now))

  const storedSnap = await catalogRef().get()
  const storedCount = storedSnap.exists
    ? (storedSnap.get('eventCount') as number | undefined) ?? null
    : null

  const decision = isAcceptableRefresh(catalog.events.length, storedCount)
  if (!decision.accepted) {
    // Keeping the stale catalog beats publishing a gutted one: the app stays
    // usable and the next run recovers on its own.
    console.error(`parkrun catalog refresh rejected: ${decision.reason}`)
    return { written: false, eventCount: catalog.events.length, reason: decision.reason }
  }

  await catalogRef().set({
    syncedAt: catalog.syncedAt,
    eventCount: catalog.events.length,
    events: catalog.events,
    updatedAt: Timestamp.fromDate(now),
  })

  return { written: true, eventCount: catalog.events.length }
}

export const syncParkrunCatalog = onSchedule(
  scheduleFunctionOptions(SYNC_SCHEDULE, { memory: '512MiB' }),
  async () => {
    const result = await refreshParkrunCatalog(new Date())

    if (result.written) {
      console.log(`parkrun catalog synced: ${result.eventCount} events`)
    }
  },
)
