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
    // 20 races per page of schema.org, 116 pages of them, and the event page
    // adds nothing the list does not already say. Ordered by date, so the first
    // pages are the races coming up: no rotation, just the nearest 1000.
    id: 'running.life',
    kind: 'listing',
    listingReader: 'schema-org',
    listingUrlTemplate: 'https://running.life/laufkalender/deutschland?page={page}',
    // 429 at the standard pace, fine three seconds apart. 25 pages is 500
    // races and 75 seconds, and the calendar being date ordered means those
    // are the ones coming up: the far end arrives as the weeks pass.
    delayMs: 3000,
    pageLimit: 25,
  },
  {
    /**
     * Half marathons, one calendar per country.
     *
     * The country calendars publish a description too short to read a distance
     * from (one race in twenty), while these pages name the race: "Meia
     * Maratona", "Media Maraton", "Mezza Maratona". Same schema.org as the
     * German calendar, so no reader of its own.
     *
     * Date ordered, six pages each: the nearest 120 of every country, and the
     * far end arrives as the weeks pass.
     */
    id: 'running.life/half-marathons',
    kind: 'listing',
    listingReader: 'schema-org',
    listingCalendars: [
      'https://running.life/halbmarathons/belgien?page={page}',
      'https://running.life/halbmarathons/frankreich?page={page}',
      'https://running.life/halbmarathons/luxemburg?page={page}',
      'https://running.life/halbmarathons/niederlande?page={page}',
      'https://running.life/halbmarathons/osterreich?page={page}',
      'https://running.life/halbmarathons/schweiz?page={page}',
      'https://running.life/halbmarathons/spanien?page={page}',
      'https://running.life/halbmarathons/vereinigtes-konigreich?page={page}',
      'https://running.life/half-marathons/czechia?page={page}',
      'https://running.life/half-marathons/denmark?page={page}',
      'https://running.life/half-marathons/greece?page={page}',
      'https://running.life/half-marathons/hungary?page={page}',
      'https://running.life/half-marathons/italy?page={page}',
      'https://running.life/half-marathons/norway?page={page}',
      'https://running.life/half-marathons/poland?page={page}',
      'https://running.life/half-marathons/portugal?page={page}',
      'https://running.life/half-marathons/sweden?page={page}',
    ],
    delayMs: 3000,
    pageLimit: 6,
  },
  {
    // The whole German year on one page, with the fields as attributes rather
    // than as prose. Cheapest source we read, and the one that finally weighs
    // the catalog towards 5K, 10K and half marathons.
    id: 'kilometerliebe.de',
    kind: 'listing',
    listingReader: 'kilometerliebe',
    listingUrl: 'https://www.kilometerliebe.de/events/',
    baseUrl: 'https://www.kilometerliebe.de/events/',
    country: 'DE',
    pageLimit: 1,
  },
  {
    // A German directory with no schema.org, and worth its own reader for what
    // it has that nothing else does: the city, every distance on offer, and the
    // entry fee per distance. 406 event pages, read a slice at a time.
    id: 'marathon.de',
    kind: 'sitemap',
    sitemapUrl: 'https://www.marathon.de/sitemap.xml',
    pathPrefix: '/laufevent/',
    pageReader: 'marathon-de',
    rotatePages: true,
    pageLimit: 150,
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
