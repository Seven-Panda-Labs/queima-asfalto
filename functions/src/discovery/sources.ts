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
    listingUrl: 'https://www.scc-events.com/kalender',
    baseUrl: 'https://www.scc-events.com',
    city: 'Berlin',
    country: 'DE',
    pageLimit: 1,
  },
]

export function enabledSources(configured = process.env.DISCOVERY_SOURCES): DiscoverySource[] {
  return selectEnabledSources(DISCOVERY_SOURCES, configured)
}

export type { DiscoverySource }
