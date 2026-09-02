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

export type DiscoverySource = {
  /** Matches `DISCOVERY_SOURCES`, and lands in the catalog as `source`. */
  id: string
  kind: DiscoverySourceKind
  /** Pages per run. The collapse guard is what keeps a partial run unpublished. */
  pageLimit: number
  /** `sitemap`: where the sitemap is, and which paths in it are events. */
  sitemapUrl?: string
  pathPrefix?: string
  /** `search`: the paged endpoint, with the page number appended. */
  searchUrl?: string
  /** `listing`: the one page, and what the calendar never says. */
  listingUrl?: string
  baseUrl?: string
  city?: string
  country?: string
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
