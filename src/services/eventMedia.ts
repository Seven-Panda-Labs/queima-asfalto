import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDocsFromServer,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { EventMedia, EventMediaCreate, EventMediaType } from '../types/EventMedia'
import { compressImageFile } from '../utils/imageCompression'
import {
  normalizeMediaFile,
  resolveMediaType,
  getVideoDurationSeconds,
  validateMediaBatch,
  validateMediaFile,
  validateVideoDuration,
  type MediaValidationErrorCode,
} from '../utils/mediaValidation'
import {
  buildEventMediaStoragePath,
  deleteEventMediaFile,
  extensionForMimeType,
  uploadEventMediaFile,
} from './eventMediaStorage'

export type UploadMediaItemResult =
  | { fileName: string; ok: true; media: EventMedia }
  | { fileName: string; ok: false; code: MediaValidationErrorCode }

export type UploadMediaBatchResult = {
  uploaded: EventMedia[]
  failures: Array<{ fileName: string; code: MediaValidationErrorCode }>
}

function timestampToDate(value: Timestamp | undefined): Date {
  return value?.toDate() ?? new Date(0)
}

export function docToEventMedia(
  eventId: string,
  id: string,
  data: Record<string, unknown>,
): EventMedia {
  return {
    id,
    eventId,
    userId: data.userId as string,
    type: data.type as EventMediaType,
    storagePath: data.storagePath as string,
    downloadUrl: data.downloadUrl as string,
    mimeType: data.mimeType as string,
    sizeBytes: data.sizeBytes as number,
    durationSeconds: (data.durationSeconds as number | null) ?? undefined,
    createdAt: timestampToDate(data.createdAt as Timestamp | undefined),
  }
}

export function eventMediaCollectionRef(eventId: string) {
  return collection(db, 'events', eventId, 'media')
}

export function eventMediaDocRef(eventId: string, mediaId: string) {
  return doc(db, 'events', eventId, 'media', mediaId)
}

export function eventMediaCollectionQuery(eventId: string) {
  return query(eventMediaCollectionRef(eventId), orderBy('createdAt', 'asc'))
}

export async function listEventMediaFromServer(eventId: string): Promise<EventMedia[]> {
  const snapshot = await getDocsFromServer(eventMediaCollectionQuery(eventId))
  return snapshot.docs.map((document) =>
    docToEventMedia(eventId, document.id, document.data()),
  )
}

export async function listEventMedia(eventId: string): Promise<EventMedia[]> {
  const snapshot = await getDocs(eventMediaCollectionQuery(eventId))
  return snapshot.docs.map((document) =>
    docToEventMedia(eventId, document.id, document.data()),
  )
}

export async function createEventMediaRecord(
  eventId: string,
  mediaId: string,
  data: EventMediaCreate,
): Promise<void> {
  await setDoc(eventMediaDocRef(eventId, mediaId), {
    userId: data.userId,
    type: data.type,
    storagePath: data.storagePath,
    downloadUrl: data.downloadUrl,
    mimeType: data.mimeType,
    sizeBytes: data.sizeBytes,
    durationSeconds: data.durationSeconds ?? null,
    createdAt: serverTimestamp(),
  })
}

export async function deleteEventMediaRecord(eventId: string, mediaId: string): Promise<void> {
  await deleteDoc(eventMediaDocRef(eventId, mediaId))
}

export async function deleteEventMedia(
  eventId: string,
  media: Pick<EventMedia, 'id' | 'storagePath'>,
): Promise<void> {
  await deleteEventMediaFile(media.storagePath)
  await deleteEventMediaRecord(eventId, media.id)
}

export async function deleteAllEventMedia(eventId: string): Promise<void> {
  const items = await listEventMedia(eventId)
  await Promise.all(
    items.map(async (item) => {
      await deleteEventMediaFile(item.storagePath)
      await deleteEventMediaRecord(eventId, item.id)
    }),
  )
}

async function prepareUploadFile(file: File, type: EventMediaType): Promise<File> {
  if (type === 'photo') {
    return compressImageFile(file)
  }
  return file
}

export async function uploadEventMediaFiles(
  eventId: string,
  userId: string,
  files: File[],
  currentCount: number,
): Promise<UploadMediaBatchResult> {
  const { accepted, errors } = validateMediaBatch(files, currentCount)
  const uploaded: EventMedia[] = []
  const failures = [...errors]
  let count = currentCount

  for (const originalFile of accepted) {
    const mediaType = resolveMediaType(originalFile)
    if (!mediaType) {
      failures.push({ fileName: originalFile.name, code: 'unsupported_type' })
      continue
    }

    const normalized = normalizeMediaFile(originalFile)
    if (!normalized) {
      failures.push({ fileName: originalFile.name, code: 'unsupported_type' })
      continue
    }

    const slotCheck = validateMediaFile(normalized, { currentCount: count })
    if (!slotCheck.ok) {
      failures.push({ fileName: originalFile.name, code: slotCheck.code })
      continue
    }

    if (mediaType === 'video') {
      const durationResult = await validateVideoDuration(normalized)
      if (!durationResult.ok) {
        failures.push({ fileName: originalFile.name, code: durationResult.code })
        continue
      }
    }

    try {
      const file = await prepareUploadFile(normalized, mediaType)
      const mediaId = crypto.randomUUID()
      const extension = extensionForMimeType(file.type)
      const storagePath = buildEventMediaStoragePath(userId, eventId, mediaId, extension)
      const downloadUrl = await uploadEventMediaFile(storagePath, file)
      const durationSeconds =
        mediaType === 'video' ? await getVideoDurationSeconds(file) : undefined

      const payload: EventMediaCreate = {
        userId,
        type: mediaType,
        storagePath,
        downloadUrl,
        mimeType: file.type,
        sizeBytes: file.size,
        durationSeconds,
      }

      await createEventMediaRecord(eventId, mediaId, payload)
      uploaded.push({
        id: mediaId,
        eventId,
        ...payload,
        createdAt: new Date(),
      })
      count += 1
    } catch {
      failures.push({ fileName: originalFile.name, code: 'unsupported_type' })
    }
  }

  return { uploaded, failures }
}
