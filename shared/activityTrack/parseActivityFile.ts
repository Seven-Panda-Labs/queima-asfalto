import { looksLikeFit, readFitMessages } from './fit.js'
import { MAX_TRACK_BYTES, TRACK_FILE_EXTENSIONS } from './limits.js'
import { parseFitMessages } from './parseFit.js'
import { parseGpxDocument } from './parseGpx.js'
import { parseTcxDocument } from './parseTcx.js'
import type { ActivityFileFormat, ParseActivityResult } from './types.js'
import { parseXmlDocument } from './xml.js'

/** The samples are named `.GPX`, `.TCX` and `.FIT`, so extension checks are case insensitive. */
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

function parseActivityFit(bytes: Uint8Array): ParseActivityResult {
  // `malformed_xml` is the code for any file that cannot be read; its message names no format.
  const messages = readFitMessages(bytes)
  if (!messages) return { ok: false, code: 'malformed_xml' }

  const activity = parseFitMessages(messages)
  if (!activity) return { ok: false, code: 'no_track_points' }

  return { ok: true, activity }
}

/** The content decides here too: a FIT carries its signature in the header. */
export function parseActivityBytes(bytes: Uint8Array): ParseActivityResult {
  if (looksLikeFit(bytes)) return parseActivityFit(bytes)
  return parseActivityXml(new TextDecoder().decode(bytes))
}

export async function parseActivityFile(file: File): Promise<ParseActivityResult> {
  if (trackExtensionOf(file.name) === null) return { ok: false, code: 'unsupported_type' }
  if (file.size > MAX_TRACK_BYTES) return { ok: false, code: 'file_too_large' }
  return parseActivityBytes(new Uint8Array(await file.arrayBuffer()))
}
