import {
  selectEnabledSources,
  type DiscoverySource,
} from '../shared/eventDiscovery/sources.js'

/**
 * The sources this codebase knows how to read.
 *
 * A source earns its place by data shape and permission, in that order: a
 * sitemap advertised in `robots.txt`, and event pages carrying a `schema.org`
 * `Event` node. Anything needing bespoke HTML scraping, or sitting behind a bot
 * challenge, is not a source. None of these run unless `DISCOVERY_SOURCES`
 * names them.
 */
export const DISCOVERY_SOURCES: DiscoverySource[] = [
  {
    id: 'acorrer.pt',
    sitemapUrl: 'https://acorrer.pt/sitemap.xml',
    pathPrefix: '/eventos/',
    pageLimit: 120,
  },
]

export function enabledSources(configured = process.env.DISCOVERY_SOURCES): DiscoverySource[] {
  return selectEnabledSources(DISCOVERY_SOURCES, configured)
}

export type { DiscoverySource }
