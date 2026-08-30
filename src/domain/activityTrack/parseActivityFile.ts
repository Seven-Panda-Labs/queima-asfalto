import { MAX_TRACK_BYTES, TRACK_FILE_EXTENSIONS } from '../../constants/activityTrack'
import { parseGpxDocument } from './parseGpx'
import { parseTcxDocument } from './parseTcx'
import type { ActivityFileFormat, ParseActivityResult } from './types'
import { parseXmlDocument } from './xml'

/** The samples are named `.GPX` and `.TCX`, so extension checks are case insensitive. */
export function trackExtensionOf(fileName: string): string | null {
  const match = /\.([^.]+)$/.exec(fileName.trim())
  const extension = match?.[1]?.toLowerCase() ?? null
  if (extension === null) return null
  return (TRACK_FILE_EXTENSIONS as readonly string[]).includes(extension) ? extension : null
}

/** The root element decides, not the file name: renamed exports are common. */
function formatOf(document: Document): ActivityFileFormat | null {
  switch (document.documentElement.localName) {
    case 'gpx':
      return 'gpx'
    case 'TrainingCenterDatabase':
      return 'tcx'
    default:
      return null
  }
}

export function parseActivityXml(xml: string): ParseActivityResult {
  const document = parseXmlDocument(xml)
  if (!document) return { ok: false, code: 'malformed_xml' }

  const format = formatOf(document)
  if (!format) return { ok: false, code: 'unsupported_type' }

  const activity = format === 'gpx' ? parseGpxDocument(document) : parseTcxDocument(document)
  if (!activity) return { ok: false, code: 'no_track_points' }

  return { ok: true, activity }
}

export async function parseActivityFile(file: File): Promise<ParseActivityResult> {
  if (trackExtensionOf(file.name) === null) return { ok: false, code: 'unsupported_type' }
  if (file.size > MAX_TRACK_BYTES) return { ok: false, code: 'file_too_large' }
  return parseActivityXml(await file.text())
}
