import { collection, doc, getDocs, query, setDoc, where, writeBatch } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from './firebase'
import { clearAllUserData } from './clearUserData'
import { buildEventMediaStoragePath } from './eventMediaStorage'
import { loadFflate } from './zipLoader'
import {
  BACKUP_SECTION_COLLECTIONS,
  BackupFormatError,
  MAX_BACKUP_BYTES,
  MAX_BACKUP_JSON_ENTRY_BYTES,
  MAX_BACKUP_MEDIA_ENTRY_BYTES,
  backupMediaEntryName,
  decodeDocumentData,
  emptyBackupMediaFiles,
  isBackupMediaEntry,
  isKnownBackupEntry,
  parseBackupTextFiles,
  sanitizeProfileForRestore,
  validateRestoreDocument,
  type BackupDocument,
  type BackupMediaFiles,
  type BackupSectionKey,
  type ParsedBackup,
  type RestorableSectionKey,
  type RestoreRejection,
} from './backupFormat'

/** Proven safe by the 500-document batch case in firestore.rules.test.ts. */
const RESTORE_BATCH_SIZE = 500

/**
 * Media writes cost `get(users/{uid})` plus `get(events/{eventId})`, and each
 * distinct event is a distinct document access call against Firestore's budget
 * of 20 per batched write. The rules tests show 19 distinct events commit and 20
 * do not, so batches are grouped by parent event with headroom.
 */
const MAX_EVENTS_PER_MEDIA_BATCH = 15

export type BackupRestoreMode = 'merge' | 'replace'

export type BackupRestoreOptions = {
  mode: BackupRestoreMode
  includeUserProfile?: boolean
}

export type BackupSectionResult = {
  created: number
  updated: number
  skipped: number
  rejected: number
}

export type BackupRestoreWarning =
  | 'shares_not_restored'
  | 'media_binaries_not_restored'
  | 'media_not_restored_replace_mode'
  | 'media_skipped_different_account'
  | 'media_files_restored'
  | 'different_account'
  | 'profile_write_denied'
  | 'reminders_not_restored'

export type BackupRestoreResult = {
  mode: BackupRestoreMode
  deleted: {
    events: number
    goals: number
    bucketListItems: number
    performanceGoals: number
    eventMedia: number
  } | null
  sections: Record<RestorableSectionKey, BackupSectionResult>
  sharesIgnored: number
  rejections: RestoreRejection[]
  warnings: BackupRestoreWarning[]
  errors: string[]
}

export type BackupRestoreProgress = {
  section: RestorableSectionKey
  done: number
  total: number
}

function emptySectionResult(): BackupSectionResult {
  return { created: 0, updated: 0, skipped: 0, rejected: 0 }
}

function emptySectionResults(): Record<RestorableSectionKey, BackupSectionResult> {
  return {
    events: emptySectionResult(),
    eventMedia: emptySectionResult(),
    goals: emptySectionResult(),
    performanceGoals: emptySectionResult(),
    bucketListItems: emptySectionResult(),
    userProfile: emptySectionResult(),
  }
}

/** Reads a backup zip, rejecting anything that is not one before inflating it. */
export async function readBackupFile(file: File | Blob): Promise<ParsedBackup> {
  if (file.size > MAX_BACKUP_BYTES) {
    throw new BackupFormatError('too_large', String(file.size))
  }

  const { unzipSync, strFromU8 } = await loadFflate()
  const buffer = await file.arrayBuffer()

  let entries: Record<string, Uint8Array>
  try {
    entries = unzipSync(new Uint8Array(buffer), {
      // Runs against the central directory, so oversized or unknown entries are
      // never inflated: the guard happens before allocation, not after.
      filter: (entry) => {
        if (isKnownBackupEntry(entry.name)) {
          return entry.originalSize <= MAX_BACKUP_JSON_ENTRY_BYTES
        }
        return isBackupMediaEntry(entry.name) && entry.originalSize <= MAX_BACKUP_MEDIA_ENTRY_BYTES
      },
    })
  } catch {
    throw new BackupFormatError('corrupt_zip')
  }

  const files: Record<string, string> = {}
  const mediaFiles = emptyBackupMediaFiles()
  for (const [name, data] of Object.entries(entries)) {
    if (isBackupMediaEntry(name)) mediaFiles.set(name, data)
    else files[name] = strFromU8(data)
  }

  return parseBackupTextFiles(files, mediaFiles)
}

export type BackupSummary = {
  counts: Record<BackupSectionKey, number>
  restorableTotal: number
  crossAccount: boolean
  /** Photo and video binaries present in the zip. */
  mediaFileCount: number
  mediaFileBytes: number
  /** True when the binaries are in the zip, which is what makes media fully restorable. */
  hasMediaFiles: boolean
  warnings: BackupRestoreWarning[]
}

export function summarizeBackup(parsed: ParsedBackup, currentUserId: string): BackupSummary {
  const counts = {} as Record<BackupSectionKey, number>
  for (const [key, documents] of Object.entries(parsed.sections)) {
    counts[key as BackupSectionKey] = documents.length
  }

  const crossAccount = parsed.manifest.userId !== '' && parsed.manifest.userId !== currentUserId
  const hasMediaFiles = parsed.mediaFiles.size > 0
  let mediaFileBytes = 0
  for (const bytes of parsed.mediaFiles.values()) mediaFileBytes += bytes.byteLength

  const warnings: BackupRestoreWarning[] = ['reminders_not_restored']
  if (counts.shares > 0) warnings.push('shares_not_restored')
  if (crossAccount) warnings.push('different_account')

  // With the binaries in the zip, media restores in either mode and across
  // accounts, because the files can be re-uploaded under the new path.
  if (counts.eventMedia > 0 && !hasMediaFiles) {
    warnings.push('media_binaries_not_restored')
    if (crossAccount) warnings.push('media_skipped_different_account')
  }

  const restorableTotal =
    counts.events +
    counts.goals +
    counts.performanceGoals +
    counts.bucketListItems +
    counts.eventMedia +
    counts.userProfile

  return {
    counts,
    restorableTotal,
    crossAccount,
    mediaFileCount: parsed.mediaFiles.size,
    mediaFileBytes,
    hasMediaFiles,
    warnings,
  }
}

async function readExistingIds(collectionName: string, userId: string): Promise<Set<string>> {
  const snapshot = await getDocs(
    query(collection(db, collectionName), where('userId', '==', userId)),
  )
  return new Set(snapshot.docs.map((document) => document.id))
}

export type ExistingUserDataCounts = {
  events: number
  goals: number
  performanceGoals: number
  bucketListItems: number
}

/** Counts what the account already holds, so the preview can show a real diff. */
export async function countExistingUserData(userId: string): Promise<ExistingUserDataCounts> {
  const [events, goals, performanceGoals, bucketListItems] = await Promise.all([
    readExistingIds('events', userId),
    readExistingIds('goals', userId),
    readExistingIds('performanceGoals', userId),
    readExistingIds('bucketListItems', userId),
  ])

  return {
    events: events.size,
    goals: goals.size,
    performanceGoals: performanceGoals.size,
    bucketListItems: bucketListItems.size,
  }
}

type PreparedDocument = {
  document: BackupDocument
  data: Record<string, unknown>
}

type PreparedSection = {
  prepared: PreparedDocument[]
  rejections: RestoreRejection[]
}

/**
 * Decodes, re-owns and validates a section up front.
 *
 * `writeBatch` is atomic and `permission-denied` names no document, so a single
 * invalid document would sink a whole chunk with nothing to report. Rejecting
 * before the write keeps the failure attributable and the rest writable. The
 * preview runs the same function so what it shows is what the restore will do.
 */
function prepareSection(
  section: Exclude<RestorableSectionKey, 'userProfile'>,
  documents: readonly BackupDocument[],
  userId: string,
  knownEventIds?: ReadonlySet<string>,
): PreparedSection {
  const prepared: PreparedDocument[] = []
  const rejections: RestoreRejection[] = []

  for (const document of documents) {
    let data: Record<string, unknown>
    try {
      data = decodeDocumentData(document.data)
    } catch {
      rejections.push({ section, id: document.id, reason: 'missing_required_field' })
      continue
    }

    // Re-owning makes isOwner(data.userId) trivially true and the zip portable.
    data.userId = userId

    const reason = validateRestoreDocument(section, document, data, { userId, knownEventIds })
    if (reason) {
      rejections.push({ section, id: document.id, reason })
      continue
    }

    prepared.push({ document, data })
  }

  return { prepared, rejections }
}

function absorb(
  section: Exclude<RestorableSectionKey, 'userProfile'>,
  prepared: PreparedSection,
  result: BackupRestoreResult,
): PreparedDocument[] {
  result.sections[section].rejected += prepared.rejections.length
  result.rejections.push(...prepared.rejections)
  return prepared.prepared
}

/**
 * Validates a parsed backup without writing anything, so the preview can list
 * exactly the documents the restore will refuse.
 */
export function planBackupRestore(
  parsed: ParsedBackup,
  userId: string,
  mode: BackupRestoreMode,
): RestoreRejection[] {
  const rejections: RestoreRejection[] = []

  for (const section of ['events', 'goals', 'performanceGoals', 'bucketListItems'] as const) {
    rejections.push(...prepareSection(section, parsed.sections[section], userId).rejections)
  }

  // Media is only ever restored in merge mode, and only for events the account
  // will have; anything else is reported as skipped rather than rejected.
  if (mode === 'merge' && parsed.sections.eventMedia.length > 0) {
    const zipEventIds = new Set(parsed.sections.events.map((document) => document.id))
    const mediaEventIds = new Set(
      parsed.sections.eventMedia.map((document) => document.eventId as string),
    )
    const knownEventIds = new Set([...zipEventIds, ...mediaEventIds])
    rejections.push(
      ...prepareSection('eventMedia', parsed.sections.eventMedia, userId, knownEventIds).rejections,
    )
  }

  return rejections
}

async function writeFlatSection(
  section: Exclude<RestorableSectionKey, 'userProfile' | 'eventMedia'>,
  prepared: readonly PreparedDocument[],
  existingIds: ReadonlySet<string>,
  result: BackupRestoreResult,
  onProgress?: (progress: BackupRestoreProgress) => void,
): Promise<void> {
  const collectionName = BACKUP_SECTION_COLLECTIONS[section]
  let done = 0
  onProgress?.({ section, done, total: prepared.length })

  for (let index = 0; index < prepared.length; index += RESTORE_BATCH_SIZE) {
    const chunk = prepared.slice(index, index + RESTORE_BATCH_SIZE)
    const batch = writeBatch(db)
    for (const entry of chunk) {
      // Preserved document id, unlike the Excel import which mints new auto-ids.
      batch.set(doc(db, collectionName, entry.document.id), entry.data)
    }

    try {
      await batch.commit()
      for (const entry of chunk) {
        if (existingIds.has(entry.document.id)) result.sections[section].updated += 1
        else result.sections[section].created += 1
      }
    } catch (error) {
      result.sections[section].skipped += chunk.length
      result.errors.push(`${collectionName}[${index}..${index + chunk.length - 1}]: ${String(error)}`)
    }

    done += chunk.length
    onProgress?.({ section, done, total: prepared.length })
  }
}

/**
 * Writes media grouped by parent event, capped at MAX_EVENTS_PER_MEDIA_BATCH
 * distinct events per batch to stay inside the rules access-call budget.
 */
async function writeEventMedia(
  prepared: readonly PreparedDocument[],
  existingMediaIds: ReadonlySet<string>,
  result: BackupRestoreResult,
  onProgress?: (progress: BackupRestoreProgress) => void,
): Promise<void> {
  const byEvent = new Map<string, PreparedDocument[]>()
  for (const entry of prepared) {
    const eventId = entry.document.eventId as string
    const key = `${eventId}/${entry.document.id}`
    if (existingMediaIds.has(key)) {
      // media is `allow update: if false`, so an existing id can only be skipped.
      result.sections.eventMedia.skipped += 1
      continue
    }
    const group = byEvent.get(eventId)
    if (group) group.push(entry)
    else byEvent.set(eventId, [entry])
  }

  const groups = [...byEvent.values()]
  const total = groups.reduce((sum, group) => sum + group.length, 0)
  let done = 0
  onProgress?.({ section: 'eventMedia', done, total })

  for (let index = 0; index < groups.length; index += MAX_EVENTS_PER_MEDIA_BATCH) {
    const slice = groups.slice(index, index + MAX_EVENTS_PER_MEDIA_BATCH).flat()

    for (let offset = 0; offset < slice.length; offset += RESTORE_BATCH_SIZE) {
      const chunk = slice.slice(offset, offset + RESTORE_BATCH_SIZE)
      const batch = writeBatch(db)
      for (const entry of chunk) {
        batch.set(
          doc(db, 'events', entry.document.eventId as string, 'media', entry.document.id),
          entry.data,
        )
      }

      try {
        await batch.commit()
        result.sections.eventMedia.created += chunk.length
      } catch (error) {
        result.sections.eventMedia.skipped += chunk.length
        result.errors.push(`eventMedia[${index}]: ${String(error)}`)
      }

      done += chunk.length
      onProgress?.({ section: 'eventMedia', done, total })
    }
  }
}

/** Uploads binaries one at a time, so a single failure is attributable. */
const MEDIA_UPLOAD_CONCURRENCY = 3

/**
 * Restores media whose binary is in the zip.
 *
 * The bytes are re-uploaded under the restoring account's own storagePath and a
 * fresh `getDownloadURL()` token is minted, because the stored URL's token
 * belongs to the object that was exported. This is what lets media come back in
 * replace mode and across accounts, neither of which metadata alone can do.
 *
 * If the document write later fails, the uploaded object is left behind. That is
 * deliberate: the storagePath is a pure function of (uid, eventId, mediaId), so
 * re-running the same restore overwrites it rather than accumulating orphans.
 */
async function restoreMediaWithFiles(
  userId: string,
  prepared: readonly PreparedDocument[],
  mediaFiles: BackupMediaFiles,
  existingMediaKeys: ReadonlySet<string>,
  result: BackupRestoreResult,
  onProgress?: (progress: BackupRestoreProgress) => void,
): Promise<PreparedDocument[]> {
  const withoutFiles: PreparedDocument[] = []
  const withFiles: Array<{ entry: PreparedDocument; bytes: Uint8Array; entryName: string }> = []

  for (const entry of prepared) {
    const eventId = entry.document.eventId as string
    if (existingMediaKeys.has(`${eventId}/${entry.document.id}`)) {
      result.sections.eventMedia.skipped += 1
      continue
    }

    const entryName = backupMediaEntryName(eventId, entry.document.id, entry.data.storagePath)
    const bytes = entryName ? mediaFiles.get(entryName) : undefined
    if (!entryName || !bytes) {
      withoutFiles.push(entry)
      continue
    }
    withFiles.push({ entry, bytes, entryName })
  }

  let done = 0
  const total = withFiles.length
  if (total > 0) onProgress?.({ section: 'eventMedia', done, total })

  const uploaded: PreparedDocument[] = []
  await mapWithConcurrency(withFiles, MEDIA_UPLOAD_CONCURRENCY, async ({ entry, bytes }) => {
    const eventId = entry.document.eventId as string
    const extension = String(entry.data.storagePath).split('.').pop() ?? 'bin'
    const storagePath = buildEventMediaStoragePath(userId, eventId, entry.document.id, extension)
    const mimeType = String(entry.data.mimeType)

    try {
      const objectRef = ref(storage, storagePath)
      await uploadBytes(objectRef, bytes as Uint8Array<ArrayBuffer>, { contentType: mimeType })
      const downloadUrl = await getDownloadURL(objectRef)

      uploaded.push({
        document: entry.document,
        data: { ...entry.data, storagePath, downloadUrl, sizeBytes: bytes.byteLength },
      })
    } catch (error) {
      result.sections.eventMedia.skipped += 1
      result.errors.push(`eventMedia/${entry.document.id}: ${String(error)}`)
    } finally {
      done += 1
      onProgress?.({ section: 'eventMedia', done, total })
    }
  })

  return [...uploaded, ...withoutFiles]
}

async function mapWithConcurrency<T>(
  items: readonly T[],
  limit: number,
  run: (item: T) => Promise<void>,
): Promise<void> {
  let cursor = 0
  async function worker(): Promise<void> {
    for (;;) {
      const index = cursor
      cursor += 1
      if (index >= items.length) return
      await run(items[index])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()))
}

async function readExistingMediaKeys(eventIds: readonly string[]): Promise<Set<string>> {
  const keys = new Set<string>()
  for (const eventId of eventIds) {
    try {
      const snapshot = await getDocs(collection(db, 'events', eventId, 'media'))
      for (const document of snapshot.docs) keys.add(`${eventId}/${document.id}`)
    } catch {
      // An unreadable event just means nothing to skip for it.
    }
  }
  return keys
}

/**
 * Restores the eventMedia section.
 *
 * Three cases, in order of how much the zip can actually deliver:
 *
 * - Binaries present: upload them under this account's paths, mint fresh
 *   download URLs, and write the documents. Works in either mode and across
 *   accounts.
 * - Metadata only, merge into the same account: the Storage objects are still
 *   there, so the preserved storagePath and token still resolve.
 * - Metadata only, anything else: refuse. Replace mode deleted the binaries and
 *   a different account cannot read them, so writing the documents would create
 *   gallery entries pointing at 404s — and media is `allow update: if false`,
 *   so they could never be repaired, only deleted.
 */
async function restoreEventMedia(
  userId: string,
  parsed: ParsedBackup,
  summary: BackupSummary,
  options: BackupRestoreOptions,
  restoredEvents: readonly PreparedDocument[],
  existingEventIds: ReadonlySet<string>,
  result: BackupRestoreResult,
  onProgress?: (progress: BackupRestoreProgress) => void,
): Promise<void> {
  const documents = parsed.sections.eventMedia
  if (documents.length === 0) return

  if (!summary.hasMediaFiles) {
    if (options.mode === 'replace') {
      result.warnings.push('media_not_restored_replace_mode')
      result.sections.eventMedia.skipped += documents.length
      return
    }
    if (summary.crossAccount) {
      result.sections.eventMedia.skipped += documents.length
      return
    }
  }

  const knownEventIds = new Set<string>([
    ...restoredEvents.map((entry) => entry.document.id),
    ...existingEventIds,
  ])
  const prepared = absorb(
    'eventMedia',
    prepareSection('eventMedia', documents, userId, knownEventIds),
    result,
  )

  const existingMediaKeys = await readExistingMediaKeys([
    ...new Set(prepared.map((entry) => entry.document.eventId as string)),
  ])

  if (!summary.hasMediaFiles) {
    await writeEventMedia(prepared, existingMediaKeys, result, onProgress)
    return
  }

  const withUrls = await restoreMediaWithFiles(
    userId,
    prepared,
    parsed.mediaFiles,
    existingMediaKeys,
    result,
    onProgress,
  )
  // Already filtered against existing ids during the upload pass.
  await writeEventMedia(withUrls, new Set(), result, onProgress)
  result.warnings.push('media_files_restored')
}

/**
 * Restores a parsed backup, preserving the original document ids.
 *
 * `replace` clears the existing data (media documents and their Storage objects
 * included) before writing; `merge` upserts and deletes nothing. Original
 * timestamps are written verbatim — never `serverTimestamp()`, which is the
 * history a backup exists to preserve.
 */
export async function restoreUserBackup(
  userId: string,
  parsed: ParsedBackup,
  options: BackupRestoreOptions,
  onProgress?: (progress: BackupRestoreProgress) => void,
): Promise<BackupRestoreResult> {
  const summary = summarizeBackup(parsed, userId)
  const result: BackupRestoreResult = {
    mode: options.mode,
    deleted: null,
    sections: emptySectionResults(),
    sharesIgnored: parsed.sections.shares.length,
    rejections: [],
    warnings: [...summary.warnings],
    errors: [],
  }

  if (options.mode === 'replace') {
    try {
      const deleted = await clearAllUserData(userId, { includeEventMedia: true })
      result.deleted = {
        events: deleted.eventsDeleted,
        goals: deleted.goalsDeleted,
        bucketListItems: deleted.bucketListDeleted,
        performanceGoals: deleted.performanceGoalsDeleted,
        eventMedia: deleted.eventMediaDeleted,
      }
    } catch (error) {
      result.errors.push(`clear: ${String(error)}`)
      return result
    }
  }

  const existing =
    options.mode === 'replace'
      ? {
          events: new Set<string>(),
          goals: new Set<string>(),
          performanceGoals: new Set<string>(),
          bucketListItems: new Set<string>(),
        }
      : {
          events: await readExistingIds('events', userId),
          goals: await readExistingIds('goals', userId),
          performanceGoals: await readExistingIds('performanceGoals', userId),
          bucketListItems: await readExistingIds('bucketListItems', userId),
        }

  const events = absorb('events', prepareSection('events', parsed.sections.events, userId), result)
  await writeFlatSection('events', events, existing.events, result, onProgress)

  for (const section of ['goals', 'performanceGoals', 'bucketListItems'] as const) {
    const prepared = absorb(section, prepareSection(section, parsed.sections[section], userId), result)
    await writeFlatSection(section, prepared, existing[section], result, onProgress)
  }

  await restoreEventMedia(userId, parsed, summary, options, events, existing.events, result, onProgress)

  if (options.includeUserProfile !== false && parsed.sections.userProfile.length > 0) {
    const [profile] = parsed.sections.userProfile
    try {
      const data = sanitizeProfileForRestore(decodeDocumentData(profile.data), {
        crossAccount: summary.crossAccount,
      })
      // Always merge: a full overwrite would clobber accountStatus and
      // fcmTokens, and users/{uid} is `allow delete: if false`.
      await setDoc(doc(db, 'users', userId), data, { merge: true })
      result.sections.userProfile.updated += 1
    } catch {
      // Non-fatal by design; the rest of the restore already landed.
      result.sections.userProfile.skipped += 1
      result.warnings.push('profile_write_denied')
    }
  }

  return result
}
