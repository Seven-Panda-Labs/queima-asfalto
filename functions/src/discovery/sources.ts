import {
  selectEnabledSources,
  type DiscoverySource,
} from '../shared/eventDiscovery/sources.js'

/**
 * The sources this codebase knows how to read.
 *
 * A source earns its place by data shape and permission, in that order: the
 * path is allowed, and the events arrive as something a parser can read without
 * driving somebody's app. Three shapes have turned out to be worth it, and each
 * one is a `kind` here:
 *
 * | kind      | Shape                                   | Cost per run     |
 * |-----------|-----------------------------------------|------------------|
 * | `sitemap` | a page per event, each with `schema.org` | one fetch each   |
 * | `search`  | a JSON calendar, plus a page per event   | one fetch each   |
 * | `listing` | the whole calendar on one page           | one fetch, total |
 *
 * None of them run unless `DISCOVERY_SOURCES` names them.
 */
export const DISCOVERY_SOURCES: DiscoverySource[] = [
  {
    id: 'acorrer.pt',
    kind: 'sitemap',
    sitemapUrl: 'https://acorrer.pt/sitemap.xml',
    pathPrefix: '/eventos/',
    pageLimit: 120,
  },
  {
    // The calendar is JSON and the distances are on the starter list, because
    // the event page hides them inside a Vaadin app.
    id: 'davengo.com',
    kind: 'search',
    searchUrl: 'https://www.davengo.com/event/search?page=',
    pageLimit: 6,
  },
  {
    // A timing operator's own events, all in Berlin, on one page with dates and
    // distances. This is the case where reading somebody's HTML pays.
    id: 'scc-events.com',
    kind: 'listing',
    listingReader: 'scc-events',
    listingUrl: 'https://www.scc-events.com/kalender',
    baseUrl: 'https://www.scc-events.com',
    city: 'Berlin',
    country: 'DE',
    pageLimit: 1,
  },
  {
    // A calendar one person keeps by hand, and the widest reach we have: every
    // continent, and nothing but the official 42,195 km, which is the site's
    // own stated rule. No HTTPS and no declared charset, both handled here
    // rather than in the parser.
    id: 'planet-marathon.de',
    kind: 'listing',
    listingReader: 'planet-marathon',
    listingUrls: [
      'http://www.planet-marathon.de/marathon_d.html',
      'http://www.planet-marathon.de/marathon_europa.html',
      'http://www.planet-marathon.de/marathon_welt.html',
    ],
    // The German page has no country column: the whole page is one country.
    country: 'DE',
    charset: 'iso-8859-1',
    pageLimit: 3,
  },
]

export function enabledSources(configured = process.env.DISCOVERY_SOURCES): DiscoverySource[] {
  return selectEnabledSources(DISCOVERY_SOURCES, configured)
}

export type { DiscoverySource }
