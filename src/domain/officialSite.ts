import { isListingPage } from '../../shared/eventDiscovery/organiserLink'
import type { RaceCatalogEntry } from '../../shared/raceCatalog'
import type { Race } from '../types/Race'

/**
 * The race's site: the organiser's own when anything knows it, and otherwise
 * whatever page we have for the race.
 *
 * The catalog comes first, because an entry gets its organiser link resolved
 * after the runner's race copied it. A calendar page is only a fallback: it is
 * what a harvest records when it found no organiser link, and it still beats
 * no link at all.
 */
export function officialSite(
  race: Pick<Race, 'officialUrl'> | undefined,
  entry: Pick<RaceCatalogEntry, 'officialUrl' | 'sourceUrl' | 'registrationUrl'> | null | undefined,
): string | undefined {
  const known = [entry?.officialUrl, race?.officialUrl, entry?.registrationUrl, entry?.sourceUrl]
    .map(webUrl)
    .filter((url): url is string => Boolean(url))
  return known.find((url) => !isListingPage(url)) ?? known[0]
}

/** Only a web address goes into an `href`: a typed link could be anything. */
export function webUrl(value: string | undefined): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value.trim())
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined
  } catch {
    return undefined
  }
}
