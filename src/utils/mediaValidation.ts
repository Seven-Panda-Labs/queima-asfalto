import {
  MAX_MEDIA_PER_EVENT,
  MAX_PHOTO_BYTES,
  MAX_PHOTO_DIMENSION,
  MAX_VIDEO_BYTES,
  MAX_VIDEO_DURATION_SECONDS,
  PHOTO_EXTENSION_TO_MIME,
  PHOTO_FILE_EXTENSIONS,
  PHOTO_MIME_TYPES,
  VIDEO_EXTENSION_TO_MIME,
  VIDEO_FILE_EXTENSIONS,
  VIDEO_MIME_TYPES,
} from '../constants/eventMedia'
import type { EventMediaType } from '../types/EventMedia'

export type MediaValidationErrorCode =
  | 'unsupported_type'
  | 'photo_too_large'
  | 'video_too_large'
  | 'video_too_long'
  | 'limit_reached'

export type MediaValidationResult =
  | { ok: true; type: EventMediaType }
  | { ok: false; code: MediaValidationErrorCode }

const GENERIC_MIME_TYPES = new Set(['', 'application/octet-stream', 'binary/octet-stream'])

function fileExtension(file: File): string | null {
  const match = /\.([^.]+)$/i.exec(file.name.trim())
  return match?.[1]?.toLowerCase() ?? null
}

function isPhotoMime(mimeType: string): boolean {
  return (PHOTO_MIME_TYPES as readonly string[]).includes(mimeType)
}

function isVideoMime(mimeType: string): boolean {
  return (VIDEO_MIME_TYPES as readonly string[]).includes(mimeType)
}

export function detectMediaType(mimeType: string): EventMediaType | null {
  if (isPhotoMime(mimeType)) return 'photo'
  if (isVideoMime(mimeType)) return 'video'
  return null
}

export function resolveMediaType(file: File): EventMediaType | null {
  if (file.type && !GENERIC_MIME_TYPES.has(file.type)) {
    const fromMime = detectMediaType(file.type)
    if (fromMime) return fromMime
  }

  const extension = fileExtension(file)
  if (!extension) return null

  if ((PHOTO_FILE_EXTENSIONS as readonly string[]).includes(extension)) return 'photo'
  if ((VIDEO_FILE_EXTENSIONS as readonly string[]).includes(extension)) return 'video'

  return null
}

export function resolveMediaMimeType(file: File, mediaType: EventMediaType): string {
  if (file.type && !GENERIC_MIME_TYPES.has(file.type) && detectMediaType(file.type) === mediaType) {
    return file.type
  }

  const extension = fileExtension(file)
  if (!extension) return file.type || (mediaType === 'photo' ? 'image/jpeg' : 'video/mp4')

  if (mediaType === 'photo') {
    return (
      PHOTO_EXTENSION_TO_MIME[extension as keyof typeof PHOTO_EXTENSION_TO_MIME] ?? 'image/jpeg'
    )
  }

  return (
    VIDEO_EXTENSION_TO_MIME[extension as keyof typeof VIDEO_EXTENSION_TO_MIME] ?? 'video/mp4'
  )
}

export function normalizeMediaFile(file: File): File | null {
  const mediaType = resolveMediaType(file)
  if (!mediaType) return null

  const mimeType = resolveMediaMimeType(file, mediaType)
  if (file.type === mimeType) return file

  return new File([file], file.name, { type: mimeType, lastModified: file.lastModified })
}

export function validateMediaFile(
  file: File,
  options: { currentCount: number },
): MediaValidationResult {
  if (options.currentCount >= MAX_MEDIA_PER_EVENT) {
    return { ok: false, code: 'limit_reached' }
  }

  const type = resolveMediaType(file)
  if (!type) {
    return { ok: false, code: 'unsupported_type' }
  }

  if (type === 'photo' && file.size > MAX_PHOTO_BYTES) {
    return { ok: false, code: 'photo_too_large' }
  }

  if (type === 'video' && file.size > MAX_VIDEO_BYTES) {
    return { ok: false, code: 'video_too_large' }
  }

  return { ok: true, type }
}

export function validateMediaBatch(
  files: File[],
  currentCount: number,
): { accepted: File[]; errors: Array<{ fileName: string; code: MediaValidationErrorCode }> } {
  const accepted: File[] = []
  const errors: Array<{ fileName: string; code: MediaValidationErrorCode }> = []
  let count = currentCount

  for (const file of files) {
    const result = validateMediaFile(file, { currentCount: count })
    if (!result.ok) {
      errors.push({ fileName: file.name, code: result.code })
      continue
    }
    accepted.push(file)
    count += 1
  }

  return { accepted, errors }
}

export function getVideoDurationSeconds(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    const objectUrl = URL.createObjectURL(file)

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(video.duration)
    }

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('invalid_video'))
    }

    video.src = objectUrl
  })
}

export async function validateVideoDuration(file: File): Promise<MediaValidationResult> {
  const base = validateMediaFile(file, { currentCount: 0 })
  if (!base.ok || base.type !== 'video') return base

  const normalized = normalizeMediaFile(file) ?? file

  try {
    const duration = await getVideoDurationSeconds(normalized)
    if (!Number.isFinite(duration) || duration > MAX_VIDEO_DURATION_SECONDS) {
      return { ok: false, code: 'video_too_long' }
    }
    return { ok: true, type: 'video' }
  } catch {
    return { ok: false, code: 'unsupported_type' }
  }
}

export { MAX_PHOTO_DIMENSION, MAX_PHOTO_BYTES, MAX_VIDEO_BYTES, MAX_MEDIA_PER_EVENT }
