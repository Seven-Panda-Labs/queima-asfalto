import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { deleteEventTrackFile, uploadEventTrackFile } from './eventTrackStorage'
import { buildEventTrackStoragePath } from '../utils/eventTrackPaths'
import {
  parseActivityFile,
  summarizeActivity,
  type ActivityFileErrorCode,
} from '../domain/activityTrack'
import { EVENT_TRACK_DOC_ID, type EventTrack, type EventTrackCreate } from '../types/EventTrack'
import { validateTrackFile, type TrackValidationErrorCode } from '../utils/trackValidation'

export type UploadTrackErrorCode = TrackValidationErrorCode | ActivityFileErrorCode

export type UploadTrackResult =
  | { ok: true; track: EventTrack; replaced: boolean }
  | { ok: false; code: UploadTrackErrorCode }

function timestampToDate(value: Timestamp | undefined): Date {
  return value?.toDate() ?? new Date(0)
}

export function eventTrackDocRef(eventId: string) {
  return doc(db, 'events', eventId, 'track', EVENT_TRACK_DOC_ID)
}

export function docToEventTrack(
  eventId: string,
  id: string,
  data: Record<string, unknown>,
): EventTrack {
  return {
    id,
    eventId,
    userId: data.userId as string,
    format: data.format as EventTrack['format'],
    storagePath: data.storagePath as string,
    downloadUrl: data.downloadUrl as string,
    sizeBytes: data.sizeBytes as number,
    fileName: data.fileName as string,
    startedAt: timestampToDate(data.startedAt as Timestamp | undefined),
    elapsedSeconds: data.elapsedSeconds as number,
    movingSeconds: data.movingSeconds as number,
    distanceMeters: data.distanceMeters as number,
    distanceSource: data.distanceSource as EventTrack['distanceSource'],
    averagePaceSecondsPerKm: data.averagePaceSecondsPerKm as number,
    elevationGainMeters: data.elevationGainMeters as number,
    elevationLossMeters: data.elevationLossMeters as number,
    splits: (data.splits as EventTrack['splits'] | undefined) ?? [],
    heartRate: (data.heartRate as EventTrack['heartRate'] | null) ?? undefined,
    route: (data.route as EventTrack['route'] | undefined) ?? [],
    createdAt: timestampToDate(data.createdAt as Timestamp | undefined),
  }
}

export async function getEventTrack(eventId: string): Promise<EventTrack | null> {
  const snapshot = await getDoc(eventTrackDocRef(eventId))
  if (!snapshot.exists()) return null
  return docToEventTrack(eventId, snapshot.id, snapshot.data())
}

export async function saveEventTrackRecord(
  eventId: string,
  data: EventTrackCreate,
): Promise<void> {
  await setDoc(eventTrackDocRef(eventId), {
    userId: data.userId,
    format: data.format,
    storagePath: data.storagePath,
    downloadUrl: data.downloadUrl,
    sizeBytes: data.sizeBytes,
    fileName: data.fileName,
    startedAt: data.startedAt,
    elapsedSeconds: data.elapsedSeconds,
    movingSeconds: data.movingSeconds,
    distanceMeters: data.distanceMeters,
    distanceSource: data.distanceSource,
    averagePaceSecondsPerKm: data.averagePaceSecondsPerKm,
    elevationGainMeters: data.elevationGainMeters,
    elevationLossMeters: data.elevationLossMeters,
    splits: data.splits,
    heartRate: data.heartRate ?? null,
    route: data.route,
    createdAt: serverTimestamp(),
  })
}

export async function deleteEventTrack(eventId: string): Promise<void> {
  const existing = await getEventTrack(eventId)
  if (!existing) return

  try {
    await deleteEventTrackFile(existing.storagePath)
  } catch {
    // A missing object must not block removing the metadata that points at it.
  }
  await deleteDoc(eventTrackDocRef(eventId))
}

/**
 * Parses first and uploads only if that succeeded, so a file the app cannot read
 * never reaches Storage. Replacing keeps the same document, and removes the old
 * object only when the new one lands somewhere else, which happens when the
 * format changes.
 */
export async function uploadEventTrack(
  eventId: string,
  userId: string,
  file: File,
): Promise<UploadTrackResult> {
  const validation = validateTrackFile(file)
  if (!validation.ok) return { ok: false, code: validation.code }

  const parsed = await parseActivityFile(file)
  if (!parsed.ok) return { ok: false, code: parsed.code }

  const summary = summarizeActivity(parsed.activity)
  const existing = await getEventTrack(eventId)
  const storagePath = buildEventTrackStoragePath(
    userId,
    eventId,
    EVENT_TRACK_DOC_ID,
    parsed.activity.format,
  )
  const downloadUrl = await uploadEventTrackFile(storagePath, file)

  const payload: EventTrackCreate = {
    userId,
    format: parsed.activity.format,
    storagePath,
    downloadUrl,
    sizeBytes: file.size,
    fileName: file.name,
    startedAt: summary.startedAt,
    elapsedSeconds: summary.elapsedSeconds,
    movingSeconds: summary.movingSeconds,
    distanceMeters: summary.distanceMeters,
    distanceSource: summary.distanceSource,
    averagePaceSecondsPerKm: summary.averagePaceSecondsPerKm,
    elevationGainMeters: summary.elevationGainMeters,
    elevationLossMeters: summary.elevationLossMeters,
    splits: summary.splits,
    heartRate: summary.heartRate,
    route: summary.route,
  }

  await saveEventTrackRecord(eventId, payload)

  if (existing && existing.storagePath !== storagePath) {
    try {
      await deleteEventTrackFile(existing.storagePath)
    } catch {
      // Orphaning one object is better than failing an upload that already landed.
    }
  }

  return {
    ok: true,
    track: {
      id: EVENT_TRACK_DOC_ID,
      eventId,
      ...payload,
      createdAt: new Date(),
    },
    replaced: existing !== null,
  }
}
