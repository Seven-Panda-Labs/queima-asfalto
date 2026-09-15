export { MAX_TRACK_BYTES, TRACK_FILE_EXTENSIONS } from '../../shared/activityTrack/limits.js'

/**
 * Kept only as a picker hint. Browsers report these files as `application/gpx+xml`,
 * `application/octet-stream` or `text/xml` depending on the platform, so nothing
 * downstream trusts the MIME type.
 */
export const TRACK_FILE_ACCEPT = '.gpx,.tcx,.GPX,.TCX,application/gpx+xml,application/xml,text/xml'
