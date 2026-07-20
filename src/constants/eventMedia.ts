export const MAX_MEDIA_PER_EVENT = 10
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024
export const MAX_VIDEO_DURATION_SECONDS = 120
export const MAX_PHOTO_DIMENSION = 2048

export const PHOTO_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const

export const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-m4v',
  'video/mpeg',
] as const

export const VIDEO_FILE_EXTENSIONS = ['mp4', 'm4v', 'mov', 'webm'] as const

export const PHOTO_FILE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'] as const

export const VIDEO_EXTENSION_TO_MIME: Record<
  (typeof VIDEO_FILE_EXTENSIONS)[number],
  (typeof VIDEO_MIME_TYPES)[number]
> = {
  mp4: 'video/mp4',
  m4v: 'video/x-m4v',
  mov: 'video/quicktime',
  webm: 'video/webm',
}

export const PHOTO_EXTENSION_TO_MIME: Record<
  (typeof PHOTO_FILE_EXTENSIONS)[number],
  string
> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
}
