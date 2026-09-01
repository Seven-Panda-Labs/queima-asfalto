import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { getBytes, ref } from 'firebase/storage'
import { APP_VERSION } from '../appVersion'
import { downloadBlob } from '../utils/downloadBlob'
import { db, storage } from './firebase'
import { loadFflate } from './zipLoader'
import {
  BACKUP_SECTION_COLLECTIONS,
  PROFILE_FIELDS_NEVER_EXPORTED,
  backupFileName,
  buildBackupTextFiles,
  emptyBackupMediaFiles,
  emptyBackupSections,
  emptyBackupTrackFiles,
  encodeDocumentData,
  backupTrackEntryName,
  planMediaExport,
  MAX_BACKUP_TRACK_ENTRY_BYTES,
  type BackupDocument,
  type BackupMediaFiles,
  type BackupPayload,
  type BackupSectionKey,
  type BackupTrackFiles,
} from './backupFormat'

/** Concurrent per-event media queries. Keeps progress meaningful without stalling the app. */
const MEDIA_READ_CONCURRENCY = 8

/** Binary downloads are far heavier than metadata queries, so fewer at once. */
const MEDIA_DOWNLOAD_CONCURRENCY = 4

export type BackupExportProgress =
  | { phase: 'collections' }
  | { phase: 'media'; done: number; total: number }
  | { phase: 'mediaFiles'; done: number; total: number; bytes: number; totalBytes: number }
  | { phase: 'tracks'; done: number; total: number }
  | { phase: 'trackFiles'; done: number; total: number }
  | { phase: 'zipping' }

export type BackupExportWarning =
  | 'from_cache'
  | 'media_partially_read'
  | 'shares_export_only'
  | 'media_binaries_excluded'
  | 'media_files_included'
  | 'media_files_too_large'
  | 'media_files_partially_downloaded'
  | 'track_partially_read'
  | 'track_files_partially_downloaded'
  | 'no_data'

export type BackupExportOptions = {
  /**
   * Download the Storage binaries into the zip: photos, videos and the raw GPX
   * and TCX. Defaults to true.
   *
   * One flag for all of them on purpose. Two flags shipped in 1.27.0 and the UI
   * only ever set the media one, so a metadata-only backup still went and
   * fetched every track file.
   */
  includeStorageFiles?: boolean
}

export type BackupExportResult = {
  filename: string
  sizeBytes: number
  counts: Record<BackupSectionKey, number>
  mediaFileCount: number
  trackFileCount: number
  warnings: BackupExportWarning[]
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0

  async function worker(): Promise<void> {
    for (;;) {
      const index = cursor
      cursor += 1
      if (index >= items.length) return
      results[index] = await mapper(items[index], index)
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()))
  return results
}

/**
 * Reads a whole collection owned by the user.
 *
 * No `orderBy`: document order is meaningless in a backup, and bare equality
 * filters keep firestore.indexes.json untouched.
 */
async function readOwnedCollection(
  collectionName: string,
  field: 'userId' | 'ownerId' | 'granteeId',
  userId: string,
): Promise<{ documents: BackupDocument[]; fromCache: boolean }> {
  const snapshot = await getDocs(
    query(collection(db, collectionName), where(field, '==', userId)),
  )

  const documents = snapshot.docs.map((document) => ({
    id: document.id,
    // `serverTimestamps: 'estimate'` so a backup taken right after an edit does
    // not export a null createdAt for the still-pending write.
    data: encodeDocumentData(
      document.data({ serverTimestamps: 'estimate' }),
      `${collectionName}/${document.id}`,
    ),
  }))

  return { documents, fromCache: snapshot.metadata.fromCache }
}

/**
 * Reads shares directly rather than through the `listShares` callable, which
 * filters to pending/active and would drop revoked and declined invites.
 */
async function readShares(userId: string): Promise<BackupDocument[]> {
  const [owned, granted] = await Promise.all([
    readOwnedCollection('shares', 'ownerId', userId),
    readOwnedCollection('shares', 'granteeId', userId),
  ])

  const byId = new Map<string, BackupDocument>()
  for (const document of [...owned.documents, ...granted.documents]) {
    byId.set(document.id, document)
  }
  return [...byId.values()]
}

async function readUserProfile(userId: string): Promise<BackupDocument[]> {
  const snapshot = await getDoc(doc(db, 'users', userId))
  if (!snapshot.exists()) return []

  const data = snapshot.data({ serverTimestamps: 'estimate' })
  // Device push credentials never belong in a file users email to themselves.
  for (const field of PROFILE_FIELDS_NEVER_EXPORTED) delete data[field]

  return [{ id: userId, data: encodeDocumentData(data, `users/${userId}`) }]
}

/**
 * Reads `events/{id}/media` for every event.
 *
 * A collectionGroup query would need a recursive wildcard rule plus a
 * collection-group index, and would widen the read surface of every future
 * `media` subcollection, so the per-event fan-out is deliberate.
 */
async function readEventMedia(
  eventIds: readonly string[],
  onProgress?: (progress: BackupExportProgress) => void,
): Promise<{ documents: BackupDocument[]; partial: boolean }> {
  let done = 0
  let partial = false
  onProgress?.({ phase: 'media', done, total: eventIds.length })

  const perEvent = await mapWithConcurrency(eventIds, MEDIA_READ_CONCURRENCY, async (eventId) => {
    try {
      const snapshot = await getDocs(collection(db, 'events', eventId, 'media'))
      return snapshot.docs.map((document) => ({
        id: document.id,
        eventId,
        data: encodeDocumentData(
          document.data({ serverTimestamps: 'estimate' }),
          `events/${eventId}/media/${document.id}`,
        ),
      }))
    } catch {
      // A 99% complete backup beats no backup.
      partial = true
      return [] as BackupDocument[]
    } finally {
      done += 1
      onProgress?.({ phase: 'media', done, total: eventIds.length })
    }
  })

  return { documents: perEvent.flat(), partial }
}

/**
 * Downloads the photo and video binaries planned for this backup.
 *
 * `getBytes` is the CORS-sensitive Storage API: on a real bucket it needs a CORS
 * configuration allowing the app origin (see docs/self-hosting.md). A download
 * failure degrades to a warning rather than losing the whole backup.
 */
async function downloadMediaFiles(
  mediaDocuments: readonly BackupDocument[],
  onProgress?: (progress: BackupExportProgress) => void,
): Promise<{ mediaFiles: BackupMediaFiles; warnings: BackupExportWarning[] }> {
  const plan = planMediaExport(mediaDocuments)
  const warnings: BackupExportWarning[] = []

  if (plan.capExceeded) {
    return { mediaFiles: emptyBackupMediaFiles(), warnings: ['media_files_too_large'] }
  }
  if (plan.files.length === 0) {
    return { mediaFiles: emptyBackupMediaFiles(), warnings: [] }
  }

  const mediaFiles = emptyBackupMediaFiles()
  let done = 0
  let bytes = 0
  let failed = 0
  onProgress?.({ phase: 'mediaFiles', done, total: plan.files.length, bytes, totalBytes: plan.totalBytes })

  await mapWithConcurrency(plan.files, MEDIA_DOWNLOAD_CONCURRENCY, async (file) => {
    try {
      const buffer = await getBytes(ref(storage, file.storagePath))
      mediaFiles.set(file.entryName, new Uint8Array(buffer))
      bytes += buffer.byteLength
    } catch {
      failed += 1
    } finally {
      done += 1
      onProgress?.({
        phase: 'mediaFiles',
        done,
        total: plan.files.length,
        bytes,
        totalBytes: plan.totalBytes,
      })
    }
  })

  if (failed > 0 || plan.skipped.length > 0) warnings.push('media_files_partially_downloaded')
  if (mediaFiles.size > 0) warnings.push('media_files_included')

  return { mediaFiles, warnings }
}

/**
 * Reads `events/{id}/track` for every event.
 *
 * One document per event at most, so this is a cheaper fan-out than media, but
 * the same reasoning applies: no collection group query, no wildcard rule.
 */
async function readEventTracks(
  eventIds: readonly string[],
  onProgress?: (progress: BackupExportProgress) => void,
): Promise<{ documents: BackupDocument[]; partial: boolean }> {
  let done = 0
  let partial = false
  onProgress?.({ phase: 'tracks', done, total: eventIds.length })

  const perEvent = await mapWithConcurrency(eventIds, MEDIA_READ_CONCURRENCY, async (eventId) => {
    try {
      const snapshot = await getDocs(collection(db, 'events', eventId, 'track'))
      return snapshot.docs.map((document) => ({
        id: document.id,
        eventId,
        data: encodeDocumentData(
          document.data({ serverTimestamps: 'estimate' }),
          `events/${eventId}/track/${document.id}`,
        ),
      }))
    } catch {
      partial = true
      return [] as BackupDocument[]
    } finally {
      done += 1
      onProgress?.({ phase: 'tracks', done, total: eventIds.length })
    }
  })

  return { documents: perEvent.flat(), partial }
}

/** Same CORS caveat as the media binaries: a failure degrades to a warning. */
async function downloadTrackFiles(
  trackDocuments: readonly BackupDocument[],
  onProgress?: (progress: BackupExportProgress) => void,
): Promise<{ trackFiles: BackupTrackFiles; failed: number }> {
  const trackFiles = emptyBackupTrackFiles()
  let done = 0
  let failed = 0
  onProgress?.({ phase: 'trackFiles', done, total: trackDocuments.length })

  await mapWithConcurrency(trackDocuments, MEDIA_DOWNLOAD_CONCURRENCY, async (document) => {
    const { storagePath, sizeBytes, format } = document.data
    const entryName = document.eventId
      ? backupTrackEntryName(document.eventId, document.id, format)
      : null

    if (!entryName || typeof storagePath !== 'string') {
      failed += 1
    } else if (typeof sizeBytes === 'number' && sizeBytes > MAX_BACKUP_TRACK_ENTRY_BYTES) {
      failed += 1
    } else {
      try {
        const buffer = await getBytes(ref(storage, storagePath))
        trackFiles.set(entryName, new Uint8Array(buffer))
      } catch {
        failed += 1
      }
    }

    done += 1
    onProgress?.({ phase: 'trackFiles', done, total: trackDocuments.length })
  })

  return { trackFiles, failed }
}

export async function collectUserBackup(
  userId: string,
  options: BackupExportOptions = {},
  onProgress?: (progress: BackupExportProgress) => void,
): Promise<{
  payload: BackupPayload
  mediaFiles: BackupMediaFiles
  trackFiles: BackupTrackFiles
  warnings: BackupExportWarning[]
}> {
  onProgress?.({ phase: 'collections' })

  const [events, goals, performanceGoals, bucketListItems, races, shares, userProfile] =
    await Promise.all([
      readOwnedCollection(BACKUP_SECTION_COLLECTIONS.events, 'userId', userId),
      readOwnedCollection(BACKUP_SECTION_COLLECTIONS.goals, 'userId', userId),
      readOwnedCollection(BACKUP_SECTION_COLLECTIONS.performanceGoals, 'userId', userId),
      readOwnedCollection(BACKUP_SECTION_COLLECTIONS.bucketListItems, 'userId', userId),
      readOwnedCollection(BACKUP_SECTION_COLLECTIONS.races, 'userId', userId),
      readShares(userId),
      readUserProfile(userId),
    ])

  const eventIds = events.documents.map((document) => document.id)
  const media = await readEventMedia(eventIds, onProgress)
  const tracks = await readEventTracks(eventIds, onProgress)

  const sections = emptyBackupSections()
  sections.events = events.documents
  sections.goals = goals.documents
  sections.performanceGoals = performanceGoals.documents
  sections.bucketListItems = bucketListItems.documents
  sections.races = races.documents
  sections.eventMedia = media.documents
  sections.eventTracks = tracks.documents
  sections.shares = shares
  sections.userProfile = userProfile

  const warnings: BackupExportWarning[] = []
  let mediaFiles = emptyBackupMediaFiles()

  if (options.includeStorageFiles !== false && media.documents.length > 0) {
    const downloaded = await downloadMediaFiles(media.documents, onProgress)
    mediaFiles = downloaded.mediaFiles
    warnings.push(...downloaded.warnings)
  }
  if (mediaFiles.size === 0) warnings.push('media_binaries_excluded')

  let trackFiles = emptyBackupTrackFiles()
  if (options.includeStorageFiles !== false && tracks.documents.length > 0) {
    const downloaded = await downloadTrackFiles(tracks.documents, onProgress)
    trackFiles = downloaded.trackFiles
    if (downloaded.failed > 0) warnings.push('track_files_partially_downloaded')
  }

  if (shares.length > 0) warnings.push('shares_export_only')
  if (media.partial) warnings.push('media_partially_read')
  if (tracks.partial) warnings.push('track_partially_read')
  if (events.fromCache) warnings.push('from_cache')
  if (
    events.documents.length === 0 &&
    goals.documents.length === 0 &&
    performanceGoals.documents.length === 0 &&
    bucketListItems.documents.length === 0 &&
    races.documents.length === 0
  ) {
    warnings.push('no_data')
  }

  return {
    payload: { userId, exportedAt: new Date(), appVersion: APP_VERSION, sections },
    mediaFiles,
    trackFiles,
    warnings,
  }
}

export async function buildUserBackupZip(
  payload: BackupPayload,
  mediaFiles: BackupMediaFiles = emptyBackupMediaFiles(),
  trackFiles: BackupTrackFiles = emptyBackupTrackFiles(),
): Promise<{ blob: Blob; filename: string }> {
  const { zipSync, strToU8 } = await loadFflate()

  const entries: Record<string, [Uint8Array, { level: 0 | 6 }]> = {}
  for (const [name, text] of Object.entries(
    buildBackupTextFiles(payload, mediaFiles, trackFiles),
  )) {
    entries[name] = [strToU8(text), { level: 6 }]
  }
  for (const [name, bytes] of mediaFiles) {
    // Photos and videos are already compressed: deflating them burns CPU for
    // roughly no gain, so they go in stored.
    entries[name] = [bytes, { level: 0 }]
  }
  for (const [name, bytes] of trackFiles) {
    // GPX and TCX are repetitive XML and deflate to a fraction of their size.
    entries[name] = [bytes, { level: 6 }]
  }

  const zipped = zipSync(entries, { mtime: payload.exportedAt })

  return {
    blob: new Blob([zipped as BlobPart], { type: 'application/zip' }),
    filename: backupFileName(payload.exportedAt),
  }
}

/** Collects, zips and downloads the signed-in user's whole dataset. */
export async function exportUserBackup(
  userId: string,
  options: BackupExportOptions = {},
  onProgress?: (progress: BackupExportProgress) => void,
): Promise<BackupExportResult> {
  const { payload, mediaFiles, trackFiles, warnings } = await collectUserBackup(
    userId,
    options,
    onProgress,
  )

  onProgress?.({ phase: 'zipping' })
  const { blob, filename } = await buildUserBackupZip(payload, mediaFiles, trackFiles)
  downloadBlob(blob, filename)

  const counts = {} as Record<BackupSectionKey, number>
  for (const [key, documents] of Object.entries(payload.sections)) {
    counts[key as BackupSectionKey] = documents.length
  }

  return {
    filename,
    sizeBytes: blob.size,
    counts,
    mediaFileCount: mediaFiles.size,
    trackFileCount: trackFiles.size,
    warnings,
  }
}
