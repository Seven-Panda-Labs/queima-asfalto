import { PDFParse } from 'pdf-parse'
import type { OfficialResultCandidate, UserResultsProfile } from '../shared/types.js'
import { namesMatch } from '../shared/matchName.js'
import { parseZielZeitUrl } from '../shared/parseUrls.js'
import { buildZielZeitPdfUrl, parseZielZeitPdfText } from '../shared/zielZeit.js'

async function fetchZielZeitPdfText(pdfUrl: string): Promise<string> {
  const parser = new PDFParse({ url: pdfUrl })
  try {
    const result = await parser.getText()
    return result.text
  } finally {
    await parser.destroy()
  }
}

export async function lookupZielZeit(
  resultsUrl: string,
  profile: UserResultsProfile,
): Promise<OfficialResultCandidate[]> {
  const parts = parseZielZeitUrl(resultsUrl)
  if (!parts) return []

  const pdfUrl = buildZielZeitPdfUrl(parts)
  const text = await fetchZielZeitPdfText(pdfUrl)
  const parsed = parseZielZeitPdfText(text)

  for (const row of parsed.rows) {
    if (!namesMatch(profile, row.firstName, row.lastName)) continue

    return [
      {
        platform: 'zielzeit',
        matchedName: row.name,
        time: row.time,
        position: row.position,
        totalParticipants: parsed.totalParticipants,
        sourceUrl: parts.pageUrl,
        confidence: 'high',
      },
    ]
  }

  return []
}
