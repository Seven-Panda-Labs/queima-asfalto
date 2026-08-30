import { MAX_TRACK_BYTES } from '../constants/activityTrack'
import { trackExtensionOf } from '../domain/activityTrack'

export type TrackValidationErrorCode = 'unsupported_type' | 'file_too_large'

export type TrackValidationResult =
  | { ok: true; extension: 'gpx' | 'tcx' }
  | { ok: false; code: TrackValidationErrorCode }

/**
 * Checks what can be known before reading the file. The MIME type is deliberately
 * ignored: browsers report these as `application/gpx+xml`, `text/xml` or
 * `application/octet-stream` depending on the platform.
 */
export function validateTrackFile(file: File): TrackValidationResult {
  const extension = trackExtensionOf(file.name)
  if (extension === null) return { ok: false, code: 'unsupported_type' }
  if (file.size > MAX_TRACK_BYTES) return { ok: false, code: 'file_too_large' }
  if (file.size === 0) return { ok: false, code: 'unsupported_type' }
  return { ok: true, extension: extension as 'gpx' | 'tcx' }
}
