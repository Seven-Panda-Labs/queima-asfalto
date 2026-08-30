/** A marathon TCX with per second sensor data runs to a few megabytes. */
export const MAX_TRACK_BYTES = 20 * 1024 * 1024

export const TRACK_FILE_EXTENSIONS = ['gpx', 'tcx'] as const

/**
 * Kept only as a picker hint. Browsers report these files as `application/gpx+xml`,
 * `application/octet-stream` or `text/xml` depending on the platform, so nothing
 * downstream trusts the MIME type.
 */
export const TRACK_FILE_ACCEPT = '.gpx,.tcx,.GPX,.TCX,application/gpx+xml,application/xml,text/xml'
