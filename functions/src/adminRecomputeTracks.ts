import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { DOMParser } from '@xmldom/xmldom'
import { callableFunctionOptions } from './functionOptions.js'
import { parseActivityXml } from './shared/activityTrack/parseActivityFile.js'
import { summarizeActivity } from './shared/activityTrack/metrics.js'
import { computePacingDrift } from './shared/activityTrack/pacing.js'

/**
 * The parser reads XML through the host's `DOMParser`. A browser has one, Node
 * does not, and the functions tsconfig carries the DOM types either way, so the
 * absence only shows at run time. Installing it here is what makes the app's own
 * parser usable, rather than a second implementation that drifts from it.
 */
;(globalThis as { DOMParser?: unknown }).DOMParser = DOMParser

const EVENTS_COLLECTION = 'events'
const USERS_COLLECTION = 'users'
const TRACK_SUBCOLLECTION = 'track'
const TRACK_DOC_ID = 'current'

/**
 * Events read per call.
 *
 * Each one may mean downloading and parsing a few megabytes, so the batch is
 * sized to finish well inside the timeout rather than to finish the job. The
 * caller passes the returned cursor back until there is none: a recompute that
 * dies halfway through and cannot say where it got to is worse than no button.
 */
const DEFAULT_BATCH_SIZE = 25
const MAX_BATCH_SIZE = 100

const callableOptions = callableFunctionOptions({ timeoutSeconds: 300, memory: '1GiB' })

function storageBucketName(): string | undefined {
  const explicit = process.env.STORAGE_BUCKET?.trim()
  return explicit && explicit.length > 0 ? explicit : undefined
}

async function requireAdmin(request: { auth?: { uid?: string } }, db: Firestore): Promise<void> {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Authentication required.')

  const snapshot = await db.collection(USERS_COLLECTION).doc(uid).get()
  if (snapshot.data()?.admin !== true) {
    throw new HttpsError('permission-denied', 'Administrator access required.')
  }
}

export type RecomputeTracksReport = {
  /** Events looked at, whether or not they carried a track. */
  examined: number
  recomputed: number
  /** Events with no track document. The common case, not a problem. */
  withoutTrack: number
  /** Tracks whose file could not be read or parsed. Named so they can be chased. */
  failed: Array<{ eventId: string; reason: string }>
  /** Absent when the sweep is done. */
  cursor?: string
}

type Summary = ReturnType<typeof summarizeActivity>

/** Only the derived fields. The file, its path and its URL are not recomputed. */
function derivedFields(summary: Summary): Record<string, unknown> {
  return {
    startedAt: summary.startedAt,
    elapsedSeconds: summary.elapsedSeconds,
    movingSeconds: summary.movingSeconds,
    distanceMeters: summary.distanceMeters,
    distanceSource: summary.distanceSource,
    averagePaceSecondsPerKm: summary.averagePaceSecondsPerKm,
    elevationGainMeters: summary.elevationGainMeters ?? null,
    elevationLossMeters: summary.elevationLossMeters ?? null,
    splits: summary.splits,
    heartRate: summary.heartRate ?? null,
    route: summary.route,
    profile: summary.profile,
  }
}

export const adminRecomputeTracks = onCall(callableOptions, async (request) => {
  const db = getFirestore()
  await requireAdmin(request, db)

  const data = (request.data ?? {}) as { cursor?: unknown; batchSize?: unknown }
  const batchSize = Math.min(
    MAX_BATCH_SIZE,
    Math.max(1, typeof data.batchSize === 'number' ? data.batchSize : DEFAULT_BATCH_SIZE),
  )
  const cursor = typeof data.cursor === 'string' && data.cursor.length > 0 ? data.cursor : null

  // Ordered by document id so the cursor is stable while the sweep runs, which a
  // timestamp order would not be if someone adds a race midway through.
  let query = db.collection(EVENTS_COLLECTION).orderBy('__name__').limit(batchSize)
  if (cursor) query = query.startAfter(cursor)

  const events = await query.get()
  const bucket = getStorage().bucket(storageBucketName())

  const report: RecomputeTracksReport = {
    examined: events.size,
    recomputed: 0,
    withoutTrack: 0,
    failed: [],
  }

  for (const event of events.docs) {
    const trackRef = event.ref.collection(TRACK_SUBCOLLECTION).doc(TRACK_DOC_ID)
    const track = await trackRef.get()
    if (!track.exists) {
      report.withoutTrack += 1
      continue
    }

    const storagePath = track.data()?.storagePath
    if (typeof storagePath !== 'string') {
      report.failed.push({ eventId: event.id, reason: 'no storage path' })
      continue
    }

    try {
      const [buffer] = await bucket.file(storagePath).download()
      const parsed = parseActivityXml(buffer.toString('utf8'))
      if (!parsed.ok) {
        report.failed.push({ eventId: event.id, reason: parsed.code })
        continue
      }

      const summary = summarizeActivity(parsed.activity)
      await trackRef.update(derivedFields(summary))
      // The event carries a copy of the drift so the analysis page needs one
      // query; leaving it stale while the track is rewritten would be a new
      // inconsistency in place of the old one.
      await event.ref.update({
        trackPacingDriftSeconds: computePacingDrift(summary.splits),
      })
      report.recomputed += 1
    } catch (error) {
      // One unreadable file must not end the sweep. It is counted and named.
      report.failed.push({ eventId: event.id, reason: String(error).slice(0, 200) })
    }
  }

  if (events.size === batchSize) {
    report.cursor = events.docs[events.docs.length - 1].id
  }

  return report
})
