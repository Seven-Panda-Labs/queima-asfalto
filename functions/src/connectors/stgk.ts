import { PDFParse } from 'pdf-parse'
import type { OfficialResultCandidate, UserResultsProfile } from '../shared/types.js'
import { parseStgkUrl } from '../shared/parseUrls.js'
import {
  selectStgkOverallLinks,
  parseStgkResultLinks,
  stgkPdfCandidates,
  type StgkResultLink,
} from '../shared/stgk.js'

const USER_AGENT = 'Mozilla/5.0 (compatible; QueimaAsfalto/1.0)'

/**
 * A ceiling for the case where the race name settles nothing and every distance
 * of the day is a candidate. The site starts refusing under a burst, and a
 * small club's server has not asked to be swept.
 */
const MAX_PDFS_READ = 3

/**
 * The page is Latin-1 and says so only in a meta tag, not in the header, so
 * `response.text()` would decode the umlauts into replacement characters.
 */
async function fetchLatin1(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { accept: 'text/html', 'User-Agent': USER_AGENT },
  })
  if (!response.ok) {
    throw new Error(`STGK page error: ${response.status}`)
  }
  return new TextDecoder('iso-8859-1').decode(await response.arrayBuffer())
}

async function fetchPdfText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { accept: 'application/pdf', 'User-Agent': USER_AGENT },
  })
  if (!response.ok) {
    throw new Error(`STGK results error: ${response.status}`)
  }

  const parser = new PDFParse({ data: new Uint8Array(await response.arrayBuffer()) })
  try {
    return (await parser.getText()).text
  } finally {
    await parser.destroy()
  }
}

async function resolveLinks(
  parts: NonNullable<ReturnType<typeof parseStgkUrl>>,
  eventName: string,
): Promise<StgkResultLink[]> {
  if (parts.pdfUrl) {
    return [{ url: parts.pdfUrl, competition: '', ranking: 'overall' }]
  }

  const html = await fetchLatin1(parts.pageUrl)
  return selectStgkOverallLinks(parseStgkResultLinks(html, parts.origin), eventName)
}

export async function lookupStgk(
  resultsUrl: string,
  profile: UserResultsProfile,
  eventName: string,
): Promise<OfficialResultCandidate[]> {
  const parts = parseStgkUrl(resultsUrl)
  if (!parts) return []

  const links = await resolveLinks(parts, eventName)

  for (const link of links.slice(0, MAX_PDFS_READ)) {
    const text = await fetchPdfText(link.url)
    // The ranking itself is the honest source to cite, not the page of links.
    const candidates = stgkPdfCandidates(text, profile, link.url)
    if (candidates.length > 0) return candidates
  }

  return []
}
