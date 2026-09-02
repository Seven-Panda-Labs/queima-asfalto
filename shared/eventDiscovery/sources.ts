/**
 * A source a harvest may read, and the switch that keeps it off.
 *
 * Discovery reads other people's pages, so whether a deployment does that at
 * all is the instance operator's call: nothing is enabled unless
 * `DISCOVERY_SOURCES` names it. A self-hosted instance must never start
 * scraping a third party because it upgraded.
 */
export type DiscoverySource = {
  /** Matches `DISCOVERY_SOURCES`, and lands in the catalog as `source`. */
  id: string
  sitemapUrl: string
  /** Event pages live under this path. */
  pathPrefix: string
  /** Pages per run. The collapse guard is what keeps a partial run unpublished. */
  pageLimit: number
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
