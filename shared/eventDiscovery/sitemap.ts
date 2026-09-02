/**
 * Enumerating a source's event pages.
 *
 * A sitemap is the permission-respecting way to find every page a site wants
 * found: it is advertised in `robots.txt`, it costs one request, and it needs no
 * guessing about pagination parameters the operator did not publish.
 */
export type SitemapEntry = {
  url: string
  /** As published, when the sitemap carries one. */
  lastmod?: string
}

const URL_BLOCK = /<url\b[^>]*>([\s\S]*?)<\/url>/gi
const LOC = /<loc>\s*([\s\S]*?)\s*<\/loc>/i
const LASTMOD = /<lastmod>\s*([\s\S]*?)\s*<\/lastmod>/i

function decode(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, '&')
}

export function parseSitemap(xml: string): SitemapEntry[] {
  const entries: SitemapEntry[] = []
  for (const block of xml.matchAll(URL_BLOCK)) {
    const body = block[1]!
    const loc = LOC.exec(body)?.[1]
    if (!loc) continue
    const lastmod = LASTMOD.exec(body)?.[1]
    entries.push({ url: decode(loc), ...(lastmod ? { lastmod: decode(lastmod) } : {}) })
  }
  return entries
}

export type EventUrlSelection = {
  /** Only paths under here are event pages. Everything else is the site itself. */
  pathPrefix: string
  /** A harvest that never ends is a harvest that never publishes. */
  limit: number
}

/**
 * The event pages worth fetching, newest change first.
 *
 * `lastmod` orders the work rather than filtering it: a source that stops
 * publishing `lastmod` would silently harvest nothing if this filtered, while
 * ordering by it just loses the priority.
 */
export function selectEventUrls(
  entries: readonly SitemapEntry[],
  selection: EventUrlSelection,
): string[] {
  const seen = new Set<string>()
  return entries
    .filter((entry) => {
      let path: string
      try {
        path = new URL(entry.url).pathname
      } catch {
        return false
      }
      // The listing page itself lives at the prefix, and carries no event.
      return path.startsWith(selection.pathPrefix) && path.length > selection.pathPrefix.length
    })
    .sort((left, right) => (right.lastmod ?? '').localeCompare(left.lastmod ?? ''))
    .map((entry) => entry.url)
    .filter((url) => {
      if (seen.has(url)) return false
      seen.add(url)
      return true
    })
    .slice(0, selection.limit)
}
