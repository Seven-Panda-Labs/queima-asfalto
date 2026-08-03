import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { APP_VERSION } from '../appVersion'
import { downloadBlob } from '../utils/downloadBlob'
import { db } from './firebase'
import { loadFflate } from './zipLoader'
import {
  BACKUP_SECTION_COLLECTIONS,
  PROFILE_FIELDS_NEVER_EXPORTED,
  backupFileName,
  buildBackupTextFiles,
  emptyBackupSections,
  encodeDocumentData,
  type BackupDocument,
  type BackupPayload,
  type BackupSectionKey,
} from './backupFormat'

/** Concurrent per-event media queries. Keeps progress meaningful without stalling the app. */
const MEDIA_READ_CONCURRENCY = 8

export type BackupExportProgress =
  | { phase: 'collections' }
  | { phase: 'media'; done: number; total: number }
  | { phase: 'zipping' }

export type BackupExportWarning =
  | 'from_cache'
  | 'media_partially_read'
  | 'shares_export_only'
  | 'media_binaries_excluded'
  | 'no_data'

export type BackupExportResult = {
  filename: string
  sizeBytes: number
  counts: Record<BackupSectionKey, number>
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

export async function collectUserBackup(
  userId: string,
  onProgress?: (progress: BackupExportProgress) => void,
): Promise<{ payload: BackupPayload; warnings: BackupExportWarning[] }> {
  onProgress?.({ phase: 'collections' })

  const [events, goals, performanceGoals, bucketListItems, shares, userProfile] = await Promise.all(
    [
      readOwnedCollection(BACKUP_SECTION_COLLECTIONS.events, 'userId', userId),
      readOwnedCollection(BACKUP_SECTION_COLLECTIONS.goals, 'userId', userId),
      readOwnedCollection(BACKUP_SECTION_COLLECTIONS.performanceGoals, 'userId', userId),
      readOwnedCollection(BACKUP_SECTION_COLLECTIONS.bucketListItems, 'userId', userId),
      readShares(userId),
      readUserProfile(userId),
    ],
  )

  const media = await readEventMedia(
    events.documents.map((document) => document.id),
    onProgress,
  )

  const sections = emptyBackupSections()
  sections.events = events.documents
  sections.goals = goals.documents
  sections.performanceGoals = performanceGoals.documents
  sections.bucketListItems = bucketListItems.documents
  sections.eventMedia = media.documents
  sections.shares = shares
  sections.userProfile = userProfile

  const warnings: BackupExportWarning[] = ['media_binaries_excluded']
  if (shares.length > 0) warnings.push('shares_export_only')
  if (media.partial) warnings.push('media_partially_read')
  if (events.fromCache) warnings.push('from_cache')
  if (
    events.documents.length === 0 &&
    goals.documents.length === 0 &&
    performanceGoals.documents.length === 0 &&
    bucketListItems.documents.length === 0
  ) {
    warnings.push('no_data')
  }

  return {
    payload: { userId, exportedAt: new Date(), appVersion: APP_VERSION, sections },
    warnings,
  }
}

export async function buildUserBackupZip(
  payload: BackupPayload,
): Promise<{ blob: Blob; filename: string }> {
  const { zipSync, strToU8 } = await loadFflate()

  const entries = Object.fromEntries(
    Object.entries(buildBackupTextFiles(payload)).map(([name, text]) => [name, strToU8(text)]),
  )
  const zipped = zipSync(entries, { level: 6, mtime: payload.exportedAt })

  return {
    blob: new Blob([zipped as BlobPart], { type: 'application/zip' }),
    filename: backupFileName(payload.exportedAt),
  }
}

/** Collects, zips and downloads the signed-in user's whole dataset. */
export async function exportUserBackup(
  userId: string,
  onProgress?: (progress: BackupExportProgress) => void,
): Promise<BackupExportResult> {
  const { payload, warnings } = await collectUserBackup(userId, onProgress)

  onProgress?.({ phase: 'zipping' })
  const { blob, filename } = await buildUserBackupZip(payload)
  downloadBlob(blob, filename)

  const counts = {} as Record<BackupSectionKey, number>
  for (const [key, documents] of Object.entries(payload.sections)) {
    counts[key as BackupSectionKey] = documents.length
  }

  return { filename, sizeBytes: blob.size, counts, warnings }
}
