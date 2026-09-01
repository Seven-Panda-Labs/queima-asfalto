import { Timestamp } from 'firebase/firestore'
import { APP_VERSION } from '../appVersion'
import { MAX_TRACK_BYTES } from '../constants/activityTrack'
import { MAX_PHOTO_BYTES, MAX_VIDEO_BYTES } from '../constants/eventMedia'
import { EVENT_STATUSES, EVENT_TYPES } from '../domain/eventCodes'
import { RESULTS_PLATFORMS } from '../../shared/officialResults'
import { parseFirestoreTimestamp } from '../utils/firestoreTimestamp'

/**
 * Backup v2 format: a zip of JSON files holding the raw Firestore documents.
 *
 * This module is deliberately free of Firestore I/O so the whole format is
 * unit-testable. It deals in `Record<string, string>` (file name -> JSON text);
 * byte conversion and zipping live in the callers.
 */

export const BACKUP_APP_ID = 'queima-asfalto'
export const BACKUP_KIND = 'user-backup'
/**
 * 2 added the `tracks/` directory and the `eventTracks` section.
 * 3 added the `races` section.
 */
export const BACKUP_SCHEMA_VERSION = 3
export const BACKUP_MANIFEST_FILE = 'manifest.json'
export const BACKUP_MEDIA_DIR = 'media'
export const BACKUP_TRACKS_DIR = 'tracks'

/**
 * Size ceilings.
 *
 * The whole zip is built and read in memory, so these are what keep a backup
 * from killing the tab. MAX_BACKUP_MEDIA_TOTAL_BYTES is the one knob worth
 * tuning: raising it raises peak memory on restore by roughly twice as much,
 * because the file is held as an ArrayBuffer and again inflated.
 */
export const MAX_BACKUP_MEDIA_TOTAL_BYTES = 300 * 1024 * 1024
export const MAX_BACKUP_BYTES = 512 * 1024 * 1024
export const MAX_BACKUP_JSON_ENTRY_BYTES = 32 * 1024 * 1024
export const MAX_BACKUP_MEDIA_ENTRY_BYTES = MAX_VIDEO_BYTES
export const MAX_BACKUP_TRACK_ENTRY_BYTES = MAX_TRACK_BYTES

/** Mirrors the extension allow-list in firestore.rules and storage.rules. */
const MEDIA_EXTENSIONS = 'jpg|png|webp|heic|heif|mp4|mov|webm|bin'
const TRACK_EXTENSIONS = 'gpx|tcx'

export const BACKUP_SECTION_KEYS = [
  'events',
  'eventMedia',
  'eventTracks',
  'goals',
  'performanceGoals',
  'bucketListItems',
  'races',
  'userProfile',
  'shares',
] as const

export type BackupSectionKey = (typeof BACKUP_SECTION_KEYS)[number]

/** Sections a restore can write back. `shares` is server-owned, so export-only. */
export const RESTORABLE_SECTIONS = [
  'events',
  'eventMedia',
  'eventTracks',
  'goals',
  'performanceGoals',
  'bucketListItems',
  'races',
  'userProfile',
] as const

export type RestorableSectionKey = (typeof RESTORABLE_SECTIONS)[number]

export const EXPORT_ONLY_SECTIONS = ['shares'] as const

/** Recorded in the manifest so the UI can tell users what a backup leaves out. */
export const OMITTED_FROM_BACKUP = [
  'storageBinaries',
  'reminderDispatches',
  'rateLimits',
  'fcmTokens',
] as const

export const BACKUP_SECTION_FILES: Record<BackupSectionKey, string> = {
  events: 'events.json',
  eventMedia: 'eventMedia.json',
  eventTracks: 'eventTracks.json',
  goals: 'goals.json',
  performanceGoals: 'performanceGoals.json',
  bucketListItems: 'bucketListItems.json',
  races: 'races.json',
  userProfile: 'userProfile.json',
  shares: 'shares.json',
}

/** Firestore collection name per section. `userProfile` is a single `users/{uid}` doc. */
export const BACKUP_SECTION_COLLECTIONS: Record<
  Exclude<BackupSectionKey, 'eventMedia' | 'eventTracks' | 'userProfile'>,
  string
> = {
  events: 'events',
  goals: 'goals',
  performanceGoals: 'performanceGoals',
  bucketListItems: 'bucketListItems',
  races: 'races',
  shares: 'shares',
}

/** Server-owned fields the client may never write back (see firestore.rules). */
export const PROFILE_FIELDS_NEVER_RESTORED = [
  'accountStatus',
  'approvedAt',
  'approvedBy',
  'rejectedAt',
] as const

/** Device push credentials, stripped at export, never restored. */
export const PROFILE_FIELDS_NEVER_EXPORTED = ['fcmTokens'] as const

/** Identity fields that belong to the exporting account, not the restoring one. */
export const PROFILE_FIELDS_CROSS_ACCOUNT_ONLY = ['name', 'email'] as const

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

export type BackupDocument = {
  id: string
  /** Present on `eventMedia` and `eventTracks`: the parent event's id. */
  eventId?: string
  data: Record<string, JsonValue>
}

export type BackupSectionFile = {
  collection: BackupSectionKey
  count: number
  documents: BackupDocument[]
}

export type BackupMediaFilesManifest = {
  count: number
  sizeBytes: number
}

/** Raw GPX and TCX under `tracks/`. Absent in schema v1 backups. */
export type BackupTrackFilesManifest = {
  count: number
  sizeBytes: number
}

export type BackupManifest = {
  app: string
  kind: string
  schemaVersion: number
  appVersion: string
  exportedAt: string
  userId: string
  counts: Record<BackupSectionKey, number>
  files: Record<BackupSectionKey, string>
  /** Photo and video binaries under `media/`. Absent in schema v1 backups. */
  mediaFiles: BackupMediaFilesManifest
  trackFiles: BackupTrackFilesManifest
  restorable: string[]
  exportOnly: string[]
  omitted: string[]
}

export type BackupSections = Record<BackupSectionKey, BackupDocument[]>

export type BackupPayload = {
  userId: string
  exportedAt: Date
  appVersion: string
  sections: BackupSections
}

/** Photo and video binaries keyed by their zip entry name. */
export type BackupMediaFiles = Map<string, Uint8Array>

export function emptyBackupMediaFiles(): BackupMediaFiles {
  return new Map()
}

/** Raw activity files keyed by their zip entry name. */
export type BackupTrackFiles = Map<string, Uint8Array>

export function emptyBackupTrackFiles(): BackupTrackFiles {
  return new Map()
}

export type ParsedBackup = {
  manifest: BackupManifest
  sections: BackupSections
  /** Zip entries we do not know, kept for diagnostics. */
  unknownFiles: string[]
  /** Empty for a metadata-only backup. */
  mediaFiles: BackupMediaFiles
  trackFiles: BackupTrackFiles
}

export type BackupErrorCode =
  | 'corrupt_zip'
  | 'too_large'
  | 'missing_manifest'
  | 'invalid_manifest'
  | 'foreign_backup'
  | 'unsupported_schema_version'
  | 'invalid_collection_file'
  | 'count_mismatch'
  | 'empty_backup'
  | 'unsupported_value'
  | 'looks_like_excel'

export class BackupFormatError extends Error {
  readonly code: BackupErrorCode
  readonly detail?: string

  constructor(code: BackupErrorCode, detail?: string) {
    super(detail ? `${code}: ${detail}` : code)
    this.name = 'BackupFormatError'
    this.code = code
    this.detail = detail
  }
}

export function emptyBackupSections(): BackupSections {
  return {
    events: [],
    eventMedia: [],
    eventTracks: [],
    goals: [],
    performanceGoals: [],
    bucketListItems: [],
    races: [],
    userProfile: [],
    shares: [],
  }
}

// ---------------------------------------------------------------------------
// Value (de)serialization
// ---------------------------------------------------------------------------

const TYPE_TAG = '__type'

type TaggedTimestamp = {
  __type: 'timestamp'
  iso: string
  seconds: number
  nanoseconds: number
}

type TaggedDouble = {
  __type: 'double'
  value: 'NaN' | 'Infinity' | '-Infinity'
}

function isTimestampLike(value: object): value is Timestamp {
  if (value instanceof Timestamp) return true
  const candidate = value as { toDate?: unknown; seconds?: unknown; nanoseconds?: unknown }
  return (
    typeof candidate.toDate === 'function' &&
    typeof candidate.seconds === 'number' &&
    typeof candidate.nanoseconds === 'number'
  )
}

function isPlainObject(value: object): boolean {
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function encodeTimestamp(value: Timestamp): TaggedTimestamp {
  return {
    __type: 'timestamp',
    iso: value.toDate().toISOString(),
    seconds: value.seconds,
    nanoseconds: value.nanoseconds,
  }
}

function encodeValue(value: unknown, label: string, path: string): JsonValue {
  if (value === null) return null

  if (typeof value === 'string' || typeof value === 'boolean') return value

  if (typeof value === 'number') {
    if (Number.isFinite(value)) return value
    const tagged: TaggedDouble = {
      __type: 'double',
      value: Number.isNaN(value) ? 'NaN' : value > 0 ? 'Infinity' : '-Infinity',
    }
    return tagged
  }

  if (value instanceof Date) return encodeTimestamp(Timestamp.fromDate(value))

  if (Array.isArray(value)) {
    return value.map((entry, index) => encodeValue(entry, label, `${path}[${index}]`))
  }

  if (typeof value === 'object') {
    if (isTimestampLike(value)) return encodeTimestamp(value as Timestamp)

    if (!isPlainObject(value)) {
      throw new BackupFormatError('unsupported_value', `${label} ${path}`)
    }

    const source = value as Record<string, unknown>
    if (Object.prototype.hasOwnProperty.call(source, TYPE_TAG)) {
      throw new BackupFormatError('unsupported_value', `${label} ${path} (reserved ${TYPE_TAG} key)`)
    }

    const encoded: Record<string, JsonValue> = {}
    for (const [key, entry] of Object.entries(source)) {
      if (entry === undefined) continue
      encoded[key] = encodeValue(entry, label, path ? `${path}.${key}` : key)
    }
    return encoded
  }

  throw new BackupFormatError('unsupported_value', `${label} ${path} (${typeof value})`)
}

/**
 * Encodes a raw Firestore document into JSON-safe values.
 *
 * Raw snapshot data on purpose: the `docToX()` mappers coerce missing
 * timestamps to epoch 0 and normalize still-valid legacy enum encodings, both
 * of which would turn a backup into a silent one-way data migration.
 */
export function encodeDocumentData(
  data: Record<string, unknown>,
  docLabel: string,
): Record<string, JsonValue> {
  const encoded: Record<string, JsonValue> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue
    encoded[key] = encodeValue(value, docLabel, key)
  }
  return encoded
}

/**
 * Firestore persists timestamps at microsecond precision, so encoding the wire
 * representation rather than a `Date` (millisecond) is what keeps a backup
 * lossless. The nanoseconds field is carried verbatim either way.
 */
function decodeTimestamp(tagged: Record<string, JsonValue>): Timestamp {
  const { seconds, nanoseconds } = tagged
  if (typeof seconds === 'number' && Number.isFinite(seconds)) {
    const nanos = typeof nanoseconds === 'number' && Number.isFinite(nanoseconds) ? nanoseconds : 0
    return new Timestamp(seconds, nanos)
  }
  return Timestamp.fromDate(parseFirestoreTimestamp(tagged.iso))
}

function decodeValue(value: JsonValue): unknown {
  if (value === null) return null
  if (typeof value !== 'object') return value

  if (Array.isArray(value)) return value.map(decodeValue)

  const tag = value[TYPE_TAG]
  if (typeof tag === 'string') {
    if (tag === 'timestamp') return decodeTimestamp(value)
    if (tag === 'double') {
      if (value.value === 'NaN') return Number.NaN
      if (value.value === 'Infinity') return Number.POSITIVE_INFINITY
      if (value.value === '-Infinity') return Number.NEGATIVE_INFINITY
      throw new BackupFormatError('unsupported_value', `double ${String(value.value)}`)
    }
    throw new BackupFormatError('unsupported_value', `${TYPE_TAG} ${tag}`)
  }

  const decoded: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value)) {
    if (entry === undefined) continue
    decoded[key] = decodeValue(entry)
  }
  return decoded
}

/** Decodes a backup document back into Firestore-writable values. */
export function decodeDocumentData(data: Record<string, JsonValue>): Record<string, unknown> {
  const decoded: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue
    decoded[key] = decodeValue(value)
  }
  return decoded
}

// ---------------------------------------------------------------------------
// File assembly and parsing
// ---------------------------------------------------------------------------

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** `queima_asfalto_backup_2026-08-03.zip`. */
export function backupFileName(exportedAt: Date): string {
  const stamp = `${exportedAt.getFullYear()}-${pad(exportedAt.getMonth() + 1)}-${pad(exportedAt.getDate())}`
  return `queima_asfalto_backup_${stamp}.zip`
}

const KNOWN_ENTRIES = new Set<string>([
  BACKUP_MANIFEST_FILE,
  ...Object.values(BACKUP_SECTION_FILES),
])

/** True for the manifest and the per-collection JSON files. */
export function isKnownBackupEntry(name: string): boolean {
  return KNOWN_ENTRIES.has(name)
}

const MEDIA_ENTRY_PATTERN = new RegExp(
  `^${BACKUP_MEDIA_DIR}/([^/]+)/([^/]+)\\.(${MEDIA_EXTENSIONS})$`,
)

export function isBackupMediaEntry(name: string): boolean {
  return MEDIA_ENTRY_PATTERN.test(name)
}

export function parseBackupMediaEntryName(
  name: string,
): { eventId: string; mediaId: string; extension: string } | null {
  const match = MEDIA_ENTRY_PATTERN.exec(name)
  if (!match) return null
  return { eventId: match[1], mediaId: match[2], extension: match[3] }
}

const TRACK_ENTRY_PATTERN = new RegExp(
  `^${BACKUP_TRACKS_DIR}/([^/]+)/([^/]+)\\.(${TRACK_EXTENSIONS})$`,
)

export function isBackupTrackEntry(name: string): boolean {
  return TRACK_ENTRY_PATTERN.test(name)
}

export function parseBackupTrackEntryName(
  name: string,
): { eventId: string; trackId: string; extension: string } | null {
  const match = TRACK_ENTRY_PATTERN.exec(name)
  if (!match) return null
  return { eventId: match[1], trackId: match[2], extension: match[3] }
}

/** The stored `format` is the extension, so it needs no parsing from the path. */
export function backupTrackEntryName(
  eventId: string,
  trackId: string,
  format: unknown,
): string | null {
  if (format !== 'gpx' && format !== 'tcx') return null
  return `${BACKUP_TRACKS_DIR}/${eventId}/${trackId}.${format}`
}

/** Reads the file extension a media document's storagePath ends in. */
export function mediaExtensionFromStoragePath(storagePath: unknown): string | null {
  if (typeof storagePath !== 'string') return null
  const match = new RegExp(`\\.(${MEDIA_EXTENSIONS})$`).exec(storagePath)
  return match ? match[1] : null
}

export function backupMediaEntryName(
  eventId: string,
  mediaId: string,
  storagePath: unknown,
): string | null {
  const extension = mediaExtensionFromStoragePath(storagePath)
  if (!extension) return null
  // Ids are Firestore ids / UUIDs, so they cannot introduce path segments.
  if (eventId.includes('/') || mediaId.includes('/')) return null
  return `${BACKUP_MEDIA_DIR}/${eventId}/${mediaId}.${extension}`
}

function countsFrom(sections: BackupSections): Record<BackupSectionKey, number> {
  const counts = {} as Record<BackupSectionKey, number>
  for (const key of BACKUP_SECTION_KEYS) {
    counts[key] = sections[key].length
  }
  return counts
}

function trackFilesManifest(trackFiles?: BackupTrackFiles): BackupTrackFilesManifest {
  if (!trackFiles || trackFiles.size === 0) return { count: 0, sizeBytes: 0 }
  let sizeBytes = 0
  for (const bytes of trackFiles.values()) sizeBytes += bytes.byteLength
  return { count: trackFiles.size, sizeBytes }
}

function mediaFilesManifest(mediaFiles?: BackupMediaFiles): BackupMediaFilesManifest {
  if (!mediaFiles || mediaFiles.size === 0) return { count: 0, sizeBytes: 0 }
  let sizeBytes = 0
  for (const bytes of mediaFiles.values()) sizeBytes += bytes.byteLength
  return { count: mediaFiles.size, sizeBytes }
}

export function buildBackupManifest(
  payload: BackupPayload,
  mediaFiles?: BackupMediaFiles,
  trackFiles?: BackupTrackFiles,
): BackupManifest {
  const media = mediaFilesManifest(mediaFiles)
  const tracks = trackFilesManifest(trackFiles)
  return {
    app: BACKUP_APP_ID,
    kind: BACKUP_KIND,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    appVersion: payload.appVersion || APP_VERSION,
    exportedAt: payload.exportedAt.toISOString(),
    userId: payload.userId,
    counts: countsFrom(payload.sections),
    files: { ...BACKUP_SECTION_FILES },
    mediaFiles: media,
    trackFiles: tracks,
    restorable: [...RESTORABLE_SECTIONS],
    exportOnly: [...EXPORT_ONLY_SECTIONS],
    // Binaries are only omitted when none of either kind were collected.
    omitted:
      media.count > 0 || tracks.count > 0
        ? OMITTED_FROM_BACKUP.filter((entry) => entry !== 'storageBinaries')
        : [...OMITTED_FROM_BACKUP],
  }
}

export function buildBackupTextFiles(
  payload: BackupPayload,
  mediaFiles?: BackupMediaFiles,
  trackFiles?: BackupTrackFiles,
): Record<string, string> {
  const files: Record<string, string> = {
    [BACKUP_MANIFEST_FILE]: `${JSON.stringify(buildBackupManifest(payload, mediaFiles, trackFiles), null, 2)}\n`,
  }

  for (const key of BACKUP_SECTION_KEYS) {
    const documents = payload.sections[key]
    const file: BackupSectionFile = { collection: key, count: documents.length, documents }
    files[BACKUP_SECTION_FILES[key]] = `${JSON.stringify(file, null, 2)}\n`
  }

  return files
}

function parseJson(name: string, text: string): unknown {
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new BackupFormatError(
      name === BACKUP_MANIFEST_FILE ? 'invalid_manifest' : 'invalid_collection_file',
      name,
    )
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseManifest(text: string): BackupManifest {
  const raw = parseJson(BACKUP_MANIFEST_FILE, text)
  if (!isRecord(raw)) throw new BackupFormatError('invalid_manifest', 'not an object')

  const { schemaVersion } = raw
  if (typeof schemaVersion !== 'number' || !Number.isInteger(schemaVersion) || schemaVersion < 1) {
    throw new BackupFormatError('invalid_manifest', 'schemaVersion')
  }

  if (raw.app !== BACKUP_APP_ID || raw.kind !== BACKUP_KIND) {
    throw new BackupFormatError('foreign_backup', `${String(raw.app)}/${String(raw.kind)}`)
  }

  if (schemaVersion > BACKUP_SCHEMA_VERSION) {
    throw new BackupFormatError('unsupported_schema_version', String(schemaVersion))
  }

  const counts = isRecord(raw.counts) ? raw.counts : {}
  const manifestCounts = {} as Record<BackupSectionKey, number>
  for (const key of BACKUP_SECTION_KEYS) {
    const value = counts[key]
    manifestCounts[key] = typeof value === 'number' && Number.isFinite(value) ? value : 0
  }

  // Absent in backups written before media binaries were supported.
  const rawMedia = isRecord(raw.mediaFiles) ? raw.mediaFiles : {}
  const mediaFiles: BackupMediaFilesManifest = {
    count: typeof rawMedia.count === 'number' && Number.isFinite(rawMedia.count) ? rawMedia.count : 0,
    sizeBytes:
      typeof rawMedia.sizeBytes === 'number' && Number.isFinite(rawMedia.sizeBytes)
        ? rawMedia.sizeBytes
        : 0,
  }

  // Absent in schema v1 backups, so a missing block reads as zero rather than invalid.
  const rawTracks = isRecord(raw.trackFiles) ? raw.trackFiles : {}
  const trackFiles: BackupTrackFilesManifest = {
    count:
      typeof rawTracks.count === 'number' && Number.isFinite(rawTracks.count) ? rawTracks.count : 0,
    sizeBytes:
      typeof rawTracks.sizeBytes === 'number' && Number.isFinite(rawTracks.sizeBytes)
        ? rawTracks.sizeBytes
        : 0,
  }

  return {
    app: BACKUP_APP_ID,
    kind: BACKUP_KIND,
    schemaVersion,
    appVersion: typeof raw.appVersion === 'string' ? raw.appVersion : '',
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : '',
    userId: typeof raw.userId === 'string' ? raw.userId : '',
    counts: manifestCounts,
    files: { ...BACKUP_SECTION_FILES },
    mediaFiles,
    trackFiles,
    restorable: Array.isArray(raw.restorable) ? raw.restorable.map(String) : [...RESTORABLE_SECTIONS],
    exportOnly: Array.isArray(raw.exportOnly) ? raw.exportOnly.map(String) : [...EXPORT_ONLY_SECTIONS],
    omitted: Array.isArray(raw.omitted) ? raw.omitted.map(String) : [...OMITTED_FROM_BACKUP],
  }
}

function parseSectionFile(key: BackupSectionKey, name: string, text: string): BackupDocument[] {
  const raw = parseJson(name, text)
  if (!isRecord(raw)) throw new BackupFormatError('invalid_collection_file', name)

  const { documents, count } = raw
  if (!Array.isArray(documents)) {
    throw new BackupFormatError('invalid_collection_file', `${name} documents`)
  }

  const seen = new Set<string>()
  const parsed: BackupDocument[] = documents.map((entry) => {
    if (!isRecord(entry)) throw new BackupFormatError('invalid_collection_file', `${name} document`)

    const { id, eventId, data } = entry
    if (typeof id !== 'string' || id.length === 0) {
      throw new BackupFormatError('invalid_collection_file', `${name} document id`)
    }
    if (!isRecord(data)) {
      throw new BackupFormatError('invalid_collection_file', `${name} ${id} data`)
    }

    const dedupeKey = key === 'eventMedia' ? `${String(eventId)}/${id}` : id
    if (seen.has(dedupeKey)) {
      throw new BackupFormatError('invalid_collection_file', `${name} duplicate id ${id}`)
    }
    seen.add(dedupeKey)

    if (key !== 'eventMedia' && key !== 'eventTracks') {
      return { id, data: data as Record<string, JsonValue> }
    }

    if (typeof eventId !== 'string' || eventId.length === 0) {
      throw new BackupFormatError('invalid_collection_file', `${name} ${id} eventId`)
    }

    // Key order is canonical (id, eventId, data) so re-exporting a restored
    // backup produces byte-identical section files.
    return { id, eventId, data: data as Record<string, JsonValue> }
  })

  if (typeof count === 'number' && count !== parsed.length) {
    throw new BackupFormatError('count_mismatch', `${name} ${count} != ${parsed.length}`)
  }

  return parsed
}

/**
 * Parses the text entries of a backup zip.
 *
 * Forward compatible by construction: unknown entries and unknown sections are
 * ignored, a missing section file reads as empty, and unknown document fields
 * are carried through verbatim.
 */
export function parseBackupTextFiles(
  files: Record<string, string>,
  mediaFiles: BackupMediaFiles = emptyBackupMediaFiles(),
  trackFiles: BackupTrackFiles = emptyBackupTrackFiles(),
): ParsedBackup {
  const manifestText = files[BACKUP_MANIFEST_FILE]
  if (manifestText === undefined) {
    throw new BackupFormatError('missing_manifest')
  }

  const manifest = parseManifest(manifestText)
  const sections = emptyBackupSections()
  const unknownFiles: string[] = []
  let presentSections = 0

  for (const name of Object.keys(files)) {
    if (name === BACKUP_MANIFEST_FILE) continue
    if (!isKnownBackupEntry(name) && !isBackupMediaEntry(name) && !isBackupTrackEntry(name)) {
      unknownFiles.push(name)
    }
  }

  for (const key of BACKUP_SECTION_KEYS) {
    const name = BACKUP_SECTION_FILES[key]
    const text = files[name]
    if (text === undefined) continue

    presentSections += 1
    sections[key] = parseSectionFile(key, name, text)

    const declared = manifest.counts[key]
    if (declared !== sections[key].length) {
      throw new BackupFormatError(
        'count_mismatch',
        `${name} manifest ${declared} != ${sections[key].length}`,
      )
    }
  }

  if (presentSections === 0) {
    throw new BackupFormatError('empty_backup')
  }

  return { manifest, sections, unknownFiles, mediaFiles, trackFiles }
}

// ---------------------------------------------------------------------------
// Media binary planning
// ---------------------------------------------------------------------------

export type PlannedMediaFile = {
  eventId: string
  mediaId: string
  entryName: string
  storagePath: string
  mimeType: string
  sizeBytes: number
}

export type SkippedMediaFile = {
  eventId: string
  mediaId: string
  reason: 'unusable_metadata' | 'entry_too_large'
}

export type MediaExportPlan = {
  files: PlannedMediaFile[]
  skipped: SkippedMediaFile[]
  totalBytes: number
  /** True when the library is larger than the cap, in which case no file is included. */
  capExceeded: boolean
}

/**
 * Decides which binaries to download, from metadata already in hand.
 *
 * All or nothing against the cap: a partially populated `media/` directory
 * would restore some photos and silently drop others, which is worse than a
 * metadata-only backup plus a clear warning.
 */
export function planMediaExport(
  mediaDocuments: readonly BackupDocument[],
  capBytes: number = MAX_BACKUP_MEDIA_TOTAL_BYTES,
): MediaExportPlan {
  const files: PlannedMediaFile[] = []
  const skipped: SkippedMediaFile[] = []

  for (const document of mediaDocuments) {
    const eventId = document.eventId
    const { storagePath, mimeType, sizeBytes, type } = document.data
    if (!eventId || typeof storagePath !== 'string' || typeof mimeType !== 'string') {
      skipped.push({ eventId: eventId ?? '', mediaId: document.id, reason: 'unusable_metadata' })
      continue
    }

    const entryName = backupMediaEntryName(eventId, document.id, storagePath)
    if (!entryName) {
      skipped.push({ eventId, mediaId: document.id, reason: 'unusable_metadata' })
      continue
    }

    const size = typeof sizeBytes === 'number' && Number.isFinite(sizeBytes) ? sizeBytes : 0
    const perFileCap = type === 'video' ? MAX_BACKUP_MEDIA_ENTRY_BYTES : MAX_PHOTO_BYTES
    if (size > perFileCap) {
      skipped.push({ eventId, mediaId: document.id, reason: 'entry_too_large' })
      continue
    }

    files.push({ eventId, mediaId: document.id, entryName, storagePath, mimeType, sizeBytes: size })
  }

  const totalBytes = files.reduce((sum, file) => sum + file.sizeBytes, 0)
  if (totalBytes > capBytes) {
    return { files: [], skipped, totalBytes, capExceeded: true }
  }

  return { files, skipped, totalBytes, capExceeded: false }
}

// ---------------------------------------------------------------------------
// Pre-write validation
// ---------------------------------------------------------------------------

/**
 * Mirrors the write validators in firestore.rules.
 *
 * `writeBatch` is atomic and `permission-denied` carries no document id, so a
 * single invalid document would silently sink a whole 500-document chunk with
 * no way to tell which one was at fault. Rejecting up front keeps the failure
 * attributable and the rest of the batch writable.
 */

/** Legacy Portuguese encodings firestore.rules still accepts. Note: no unaccented `Concluido`. */
const LEGACY_STATUS_VALUES = [
  'Planeado',
  'Confirmado',
  'Concluído',
  'Faltou',
  'Cancelado',
  'Agendado',
] as const

const LEGACY_TYPE_VALUES = ['5Km', '10Km', '21.1Km', '42.2Km', 'Outra'] as const

const ALLOWED_STATUS = new Set<string>([...EVENT_STATUSES, ...LEGACY_STATUS_VALUES])
/** Mirrors `validDisciplineList` in firestore.rules, which enumerates the entries. */
const MAX_BUCKET_LIST_DISCIPLINES = 6

const ALLOWED_TYPE = new Set<string>([...EVENT_TYPES, ...LEGACY_TYPE_VALUES])
const ALLOWED_PLATFORM = new Set<string>(RESULTS_PLATFORMS)

export const RESTORE_REJECTION_CODES = [
  'missing_required_field',
  'invalid_event_type',
  'invalid_race_id',
  'invalid_event_status',
  'invalid_distance',
  'invalid_name',
  'invalid_location',
  'invalid_geocode',
  'invalid_results_field',
  'invalid_target_count',
  'invalid_year',
  'invalid_performance_goal',
  'invalid_disciplines',
  'invalid_track',
  'invalid_media',
  'unknown_event',
  'foreign_user',
] as const

export type RestoreRejectionCode = (typeof RESTORE_REJECTION_CODES)[number]

export type RestoreRejection = {
  section: RestorableSectionKey
  id: string
  reason: RestoreRejectionCode
}

export type RestoreValidationContext = {
  userId: string
  knownEventIds?: ReadonlySet<string>
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function hasAll(data: Record<string, unknown>, keys: string[]): boolean {
  return keys.every((key) => key in data)
}

function isPositiveNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.length > 0
}

function isAbsentOrNull(data: Record<string, unknown>, key: string): boolean {
  return !(key in data) || data[key] === null
}

function isOptionalString(data: Record<string, unknown>, key: string): boolean {
  return isAbsentOrNull(data, key) || typeof data[key] === 'string'
}

function validCoordinates(data: Record<string, unknown>): boolean {
  const latAbsent = isAbsentOrNull(data, 'locationLat')
  const lngAbsent = isAbsentOrNull(data, 'locationLng')
  if (latAbsent && lngAbsent) return true

  const { locationLat: lat, locationLng: lng } = data
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

function validGeocodeFields(data: Record<string, unknown>): boolean {
  if (!validCoordinates(data)) return false
  if (!isOptionalString(data, 'locationGeocodeQuery')) return false
  return (
    isAbsentOrNull(data, 'locationGeocodedAt') || data.locationGeocodedAt instanceof Timestamp
  )
}

function validResultsFields(data: Record<string, unknown>): boolean {
  if (!isOptionalString(data, 'resultsUrl')) return false
  if (!isOptionalString(data, 'parkrunEventSlug')) return false
  if (!isOptionalString(data, 'parkrunCountryUrl')) return false
  if (isAbsentOrNull(data, 'resultsPlatform')) return true
  return typeof data.resultsPlatform === 'string' && ALLOWED_PLATFORM.has(data.resultsPlatform)
}

function validateEvent(data: Record<string, unknown>): RestoreRejectionCode | null {
  if (!hasAll(data, ['userId', 'name', 'date', 'realDistance', 'eventType', 'location', 'status'])) {
    return 'missing_required_field'
  }
  if (!isNonEmptyString(data.name)) return 'invalid_name'
  if (typeof data.location !== 'string') return 'invalid_location'
  if (!isPositiveNumber(data.realDistance)) return 'invalid_distance'
  if (typeof data.eventType !== 'string' || !ALLOWED_TYPE.has(data.eventType)) {
    return 'invalid_event_type'
  }
  if (typeof data.status !== 'string' || !ALLOWED_STATUS.has(data.status)) {
    return 'invalid_event_status'
  }
  if (!validGeocodeFields(data)) return 'invalid_geocode'
  if (!validResultsFields(data)) return 'invalid_results_field'
  if (!validOptionalRaceId(data)) return 'invalid_race_id'
  return null
}

function validateGoal(data: Record<string, unknown>): RestoreRejectionCode | null {
  if (!hasAll(data, ['userId', 'eventType', 'targetCount', 'year'])) return 'missing_required_field'
  if (typeof data.eventType !== 'string' || !ALLOWED_TYPE.has(data.eventType)) {
    return 'invalid_event_type'
  }
  if (typeof data.targetCount !== 'number' || !Number.isInteger(data.targetCount) || data.targetCount <= 0) {
    return 'invalid_target_count'
  }
  if (typeof data.year !== 'number' || !Number.isInteger(data.year)) return 'invalid_year'
  return null
}

function validatePerformanceGoal(data: Record<string, unknown>): RestoreRejectionCode | null {
  if (!hasAll(data, ['userId', 'type', 'eventType', 'year'])) return 'missing_required_field'
  if (typeof data.eventType !== 'string' || !ALLOWED_TYPE.has(data.eventType)) {
    return 'invalid_event_type'
  }
  if (typeof data.year !== 'number' || !Number.isInteger(data.year)) return 'invalid_year'

  const { type } = data
  if (type !== 'pr_target' && type !== 'pace_target' && type !== 'time_target') {
    return 'invalid_performance_goal'
  }
  if (type === 'pace_target' && !isNonEmptyString(data.targetPace)) return 'invalid_performance_goal'
  if (type === 'time_target' && !isNonEmptyString(data.targetTime)) return 'invalid_performance_goal'
  if (type === 'pr_target') {
    if (!isAbsentOrNull(data, 'targetPace') || !isAbsentOrNull(data, 'targetTime')) {
      return 'invalid_performance_goal'
    }
  }
  return null
}

function validateBucketListItem(data: Record<string, unknown>): RestoreRejectionCode | null {
  if (!hasAll(data, ['userId', 'name', 'location', 'realDistance'])) return 'missing_required_field'
  if (!isNonEmptyString(data.name)) return 'invalid_name'
  if (typeof data.location !== 'string') return 'invalid_location'
  if (!isPositiveNumber(data.realDistance)) return 'invalid_distance'

  const { disciplines } = data
  const validDisciplines =
    Array.isArray(disciplines) &&
    disciplines.length > 0 &&
    disciplines.length <= MAX_BUCKET_LIST_DISCIPLINES &&
    disciplines.every((entry) => typeof entry === 'string' && ALLOWED_TYPE.has(entry))
  const validLegacy = typeof data.eventType === 'string' && ALLOWED_TYPE.has(data.eventType)
  if (!validDisciplines && !validLegacy) return 'invalid_disciplines'

  if (!validGeocodeFields(data)) return 'invalid_geocode'
  if (!validOptionalRaceId(data)) return 'invalid_race_id'
  return null
}

function validOptionalRaceId(data: Record<string, unknown>): boolean {
  return data.raceId === undefined || data.raceId === null || typeof data.raceId === 'string'
}

function validateRace(data: Record<string, unknown>): RestoreRejectionCode | null {
  if (!hasAll(data, ['userId', 'name', 'location'])) return 'missing_required_field'
  if (!isNonEmptyString(data.name)) return 'invalid_name'
  if (typeof data.location !== 'string') return 'invalid_location'
  if (!validGeocodeFields(data)) return 'invalid_geocode'
  return null
}

function validateEventMedia(
  document: BackupDocument,
  data: Record<string, unknown>,
  context: RestoreValidationContext,
): RestoreRejectionCode | null {
  const eventId = document.eventId
  if (!eventId) return 'unknown_event'
  if (context.knownEventIds && !context.knownEventIds.has(eventId)) return 'unknown_event'

  if (!hasAll(data, ['userId', 'type', 'storagePath', 'downloadUrl', 'mimeType', 'sizeBytes'])) {
    return 'missing_required_field'
  }

  const { type, storagePath, downloadUrl, mimeType, sizeBytes } = data
  if (type !== 'photo' && type !== 'video') return 'invalid_media'
  if (typeof storagePath !== 'string' || typeof downloadUrl !== 'string') return 'invalid_media'
  if (typeof mimeType !== 'string') return 'invalid_media'
  if (!isPositiveNumber(sizeBytes)) return 'invalid_media'
  if (type === 'photo' && (sizeBytes as number) > MAX_PHOTO_BYTES) return 'invalid_media'
  if (type === 'video' && (sizeBytes as number) > MAX_VIDEO_BYTES) return 'invalid_media'
  if (!isAbsentOrNull(data, 'durationSeconds') && typeof data.durationSeconds !== 'number') {
    return 'invalid_media'
  }

  const uid = escapeRegExp(context.userId)
  const eid = escapeRegExp(eventId)
  const mid = escapeRegExp(document.id)

  const pathPattern = new RegExp(
    `^users/${uid}/events/${eid}/media/${mid}\\.(${MEDIA_EXTENSIONS})$`,
  )
  if (!pathPattern.test(storagePath)) return 'invalid_media'

  const encodedObject = `users%2F${uid}%2Fevents%2F${eid}%2Fmedia%2F${mid}`
  const extension = `\\.(${MEDIA_EXTENSIONS})`
  const googleApis = new RegExp(
    `^https://firebasestorage\\.googleapis\\.com/v0/b/[^/]+/o/${encodedObject}${extension}\\?.*$`,
  )
  const appDomain = new RegExp(
    `^https://[a-z0-9.-]+\\.firebasestorage\\.app/o/${encodedObject}${extension}\\?.*$`,
  )
  if (!googleApis.test(downloadUrl) && !appDomain.test(downloadUrl)) return 'invalid_media'

  return null
}

function validateEventTrack(
  document: BackupDocument,
  data: Record<string, unknown>,
  context: RestoreValidationContext,
): RestoreRejectionCode | null {
  const eventId = document.eventId
  if (!eventId) return 'unknown_event'
  if (context.knownEventIds && !context.knownEventIds.has(eventId)) return 'unknown_event'

  if (
    !hasAll(data, [
      'userId',
      'format',
      'storagePath',
      'downloadUrl',
      'sizeBytes',
      'fileName',
      'startedAt',
      'elapsedSeconds',
      'distanceMeters',
      'splits',
      'route',
      'profile',
    ])
  ) {
    return 'missing_required_field'
  }

  const { format, storagePath, downloadUrl, sizeBytes, splits, route, profile } = data
  if (format !== 'gpx' && format !== 'tcx') return 'invalid_track'
  if (typeof storagePath !== 'string' || typeof downloadUrl !== 'string') return 'invalid_track'
  if (!isPositiveNumber(sizeBytes) || (sizeBytes as number) > MAX_TRACK_BYTES) return 'invalid_track'
  // The rules cap all three lists, so a backup that exceeds them would be rejected on write.
  if (!Array.isArray(splits) || splits.length > 200) return 'invalid_track'
  if (!Array.isArray(route) || route.length > 200) return 'invalid_track'
  if (!Array.isArray(profile) || profile.length > 200) return 'invalid_track'

  const uid = escapeRegExp(context.userId)
  const eid = escapeRegExp(eventId)
  const tid = escapeRegExp(document.id)

  const pathPattern = new RegExp(
    `^users/${uid}/events/${eid}/track/${tid}\\.(${TRACK_EXTENSIONS})$`,
  )
  if (!pathPattern.test(storagePath)) return 'invalid_track'

  const encodedObject = `users%2F${uid}%2Fevents%2F${eid}%2Ftrack%2F${tid}`
  const extension = `\\.(${TRACK_EXTENSIONS})`
  const googleApis = new RegExp(
    `^https://firebasestorage\\.googleapis\\.com/v0/b/[^/]+/o/${encodedObject}${extension}\\?.*$`,
  )
  const appDomain = new RegExp(
    `^https://[a-z0-9.-]+\\.firebasestorage\\.app/o/${encodedObject}${extension}\\?.*$`,
  )
  if (!googleApis.test(downloadUrl) && !appDomain.test(downloadUrl)) return 'invalid_track'

  return null
}

/**
 * Returns the reason a document cannot be restored, or `null` when it is writable.
 *
 * `data` must be the decoded document (Timestamp instances, not tagged JSON)
 * with `userId` already rewritten to the restoring account.
 */
export function validateRestoreDocument(
  section: RestorableSectionKey,
  document: BackupDocument,
  data: Record<string, unknown>,
  context: RestoreValidationContext,
): RestoreRejectionCode | null {
  if (section === 'userProfile') return null

  if (data.userId !== context.userId) return 'foreign_user'

  switch (section) {
    case 'events':
      return validateEvent(data)
    case 'goals':
      return validateGoal(data)
    case 'performanceGoals':
      return validatePerformanceGoal(data)
    case 'bucketListItems':
      return validateBucketListItem(data)
    case 'races':
      return validateRace(data)
    case 'eventMedia':
      return validateEventMedia(document, data, context)
    case 'eventTracks':
      return validateEventTrack(document, data, context)
  }
}

/** Strips the fields firestore.rules refuses on a client profile write. */
export function sanitizeProfileForRestore(
  data: Record<string, unknown>,
  options: { crossAccount: boolean },
): Record<string, unknown> {
  const dropped = new Set<string>([
    ...PROFILE_FIELDS_NEVER_RESTORED,
    ...PROFILE_FIELDS_NEVER_EXPORTED,
    ...(options.crossAccount ? PROFILE_FIELDS_CROSS_ACCOUNT_ONLY : []),
  ])

  return Object.fromEntries(Object.entries(data).filter(([key]) => !dropped.has(key)))
}
