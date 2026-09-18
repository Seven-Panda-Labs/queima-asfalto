/**
 * A parkrun read off a calendar, which the catalog does not want.
 *
 * parkrun is a free weekly 5 km, not an annual race: it has no edition, no
 * entry, no deadline, and the app already carries every venue in a catalog of
 * its own, synced from parkrun itself. When a German calendar lists the
 * Alstervorland parkrun as an event, the harvest writes an annual race that
 * will never have a date worth reminding anybody of, and the runner sees the
 * same venue twice.
 *
 * Two signals, and the name alone is not one of them. "Brescia Park Run" is a
 * half marathon, "Burns Park Run" is a 5 km in Ann Arbor, and "Bark in the
 * Park Run for the Dogs" is exactly what it says: all three are real annual
 * races that a looser test threw out of the catalog.
 */

/**
 * The site's own host, at a label boundary.
 *
 * parkrun.com.de, parkrun.us, parkrun.org.uk. Never burnsparkrun.org, which
 * belongs to a 5 km in Ann Arbor that has nothing to do with parkrun.
 */
const PARKRUN_HOST = /(?:^|\.)parkrun\.[a-z]{2,3}(?:\.[a-z]{2,3})?$/i

/** The word spelled as one, so "Park Run" and "Parkrunde" are left alone. */
const PARKRUN_WORD = /\bparkrun\b/i

function isParkrunHost(url: string | undefined): boolean {
  if (!url) return false
  try {
    return PARKRUN_HOST.test(new URL(url).host)
  } catch {
    return false
  }
}

export function isParkrunListing(race: {
  name: string
  officialUrl?: string
  sourceUrl?: string
}): boolean {
  return (
    PARKRUN_WORD.test(race.name) || isParkrunHost(race.officialUrl) || isParkrunHost(race.sourceUrl)
  )
}
