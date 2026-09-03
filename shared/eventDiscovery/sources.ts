/**
 * A source a harvest may read, and the switch that keeps it off.
 *
 * Discovery reads other people's pages, so whether a deployment does that at
 * all is the instance operator's call: nothing is enabled unless
 * `DISCOVERY_SOURCES` names it. A self-hosted instance must never start
 * scraping a third party because it upgraded.
 */
/**
 * How a source hands over its calendar.
 *
 * Three shapes have earned their place: a sitemap of event pages, a JSON search
 * endpoint, and a whole calendar on one page. Anything that needs a browser to
 * run before the data exists is not a source.
 */
export type DiscoverySourceKind = 'sitemap' | 'search' | 'listing'

/**
 * Whose calendar HTML a listing source is.
 *
 * A listing is somebody's own markup, so each one needs its own reader. The
 * name is here rather than in the harvest so a source is one object.
 */
export const LISTING_READERS = ['scc-events', 'planet-marathon', 'kilometerliebe'] as const

export type ListingReader = (typeof LISTING_READERS)[number]

/**
 * Whose event page a sitemap source points at.
 *
 * `schema-org` is the reason a sitemap source is cheap: the page describes
 * itself. A directory without it needs its own reader, and is worth one only
 * when it carries something nobody else publishes.
 */
export const PAGE_READERS = ['schema-org', 'marathon-de'] as const

export type PageReader = (typeof PAGE_READERS)[number]

export type DiscoverySource = {
  /** Matches `DISCOVERY_SOURCES`, and lands in the catalog as `source`. */
  id: string
  kind: DiscoverySourceKind
  /** Pages per run. The collapse guard is what keeps a partial run unpublished. */
  pageLimit: number
  /** `sitemap`: where the sitemap is, and which paths in it are events. */
  sitemapUrl?: string
  pathPrefix?: string
  /** Which reader understands an event page. Defaults to `schema.org`. */
  pageReader?: PageReader
  /**
   * Read a different slice each week.
   *
   * For a sitemap with no `lastmod`: without it, `pageLimit` would read the
   * same pages for ever and the rest of the calendar would never arrive.
   */
  rotatePages?: boolean
  /** `search`: the paged endpoint, with the page number appended. */
  searchUrl?: string
  /** `listing`: the one page, and what the calendar never says. */
  listingUrl?: string
  /** More than one page of the same calendar, when a source splits it. */
  listingUrls?: string[]
  /** Which reader understands this calendar's HTML. */
  listingReader?: ListingReader
  baseUrl?: string
  city?: string
  country?: string
  /**
   * What the pages are, for a server that does not say.
   *
   * Only where it matters: a bare `text/html` and no meta charset means the
   * fetch decodes as UTF-8, which mangles every accent on a Latin-1 page.
   */
  charset?: string
}

export function selectEnabledSources<T extends { id: string }>(
  sources: readonly T[],
  configured: string | undefined,
): T[] {
  const names = (configured ?? '')
    .split(',')
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean)
  if (names.length === 0) return []
  if (names.includes('all')) return [...sources]
  return sources.filter((source) => names.includes(source.id.toLowerCase()))
}
