import { parkrunSlugFromResultsUrl } from '../../shared/officialResults/parkrunEvent'
import type { Event } from '../types/Event'
import { webUrl } from './officialSite'

/**
 * Whether the event is linked to a known parkrun. A race merely named like one,
 * with nothing linking it, does not count.
 *
 * A parkrun has no lottery, no entry window and no fee, and it is not in the
 * race catalog: see "the two models diverge" in docs/race-catalog.md.
 */
export function isKnownParkrun(event: Pick<Event, 'parkrunEventSlug' | 'resultsPlatform'>): boolean {
  return Boolean(event.parkrunEventSlug) || event.resultsPlatform === 'parkrun'
}

type ParkrunSiteFields = Pick<
  Event,
  'parkrunEventSlug' | 'parkrunCountryUrl' | 'resultsPlatform' | 'resultsUrl'
>

/** A results page on a parkrun country site, whose origin and slug are the event's. */
function parkrunResultsPage(resultsUrl: string | undefined): { origin: string; slug: string } | null {
  if (!resultsUrl) return null
  try {
    const url = new URL(resultsUrl.trim())
    if (!/(?:^|\.)parkrun\./i.test(url.hostname)) return null
    const slug = parkrunSlugFromResultsUrl(resultsUrl)
    return slug ? { origin: url.origin, slug: slug.toLowerCase() } : null
  } catch {
    return null
  }
}

/**
 * The parkrun's own page, on its country's site.
 *
 * Built from the event alone when it can be: the slug and country site saved
 * by the picker, or the results page an import left behind. `countryUrlOf` is
 * for a slug saved without its country, which only the parkrun catalog knows.
 */
export function parkrunSite(
  event: ParkrunSiteFields,
  countryUrlOf?: (slug: string) => string | undefined,
): string | undefined {
  if (!isKnownParkrun(event)) return undefined
  const fromResults = parkrunResultsPage(event.resultsUrl)
  const slug = event.parkrunEventSlug?.trim().toLowerCase() || fromResults?.slug
  if (!slug) return undefined
  const base =
    event.parkrunCountryUrl?.trim() ||
    (fromResults?.slug === slug ? fromResults.origin : undefined) ||
    countryUrlOf?.(slug)
  return base ? webUrl(`${base.replace(/\/$/, '')}/${slug}/`) : undefined
}

/** A parkrun whose page needs the catalog to find its country. */
export function parkrunSiteNeedsCatalog(event: ParkrunSiteFields): boolean {
  return isKnownParkrun(event) && Boolean(event.parkrunEventSlug) && !parkrunSite(event)
}
