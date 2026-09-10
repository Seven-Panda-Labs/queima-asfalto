/**
 * The results link an edition can hold, out of the one a runner saved.
 *
 * A runner's results URL is not automatically shareable. Measured on a real
 * instance, of 39 saved links three carried the runner: `?term=neves` is a
 * davengo search for their surname, `?result-id=207297` is one person's row on
 * myracepartner, and `?match=2` is a row index on strassenlauf. The rest name
 * the event, the edition or the distance, which is exactly what the catalog
 * wants.
 *
 * So the personal part is dropped rather than the whole link: what remains is
 * the edition's own results page, which is what everybody else needs. When the
 * path itself is somebody's result, there is nothing to salvage and this
 * returns nothing.
 *
 * Deliberately a denylist. A new timing platform's parameter is not going to
 * be known here, and the failure of an allowlist is a link that stops working
 * for everyone, while the failure here is one parameter we have not seen yet.
 * The pairing is that only the runner's own verified result feeds this, never
 * a scrape, and the same rule runs on both the client and the backfill.
 */

/** Query parameters that name a person rather than a race. */
const PERSONAL_PARAMS = new Set([
  'term',
  'search',
  'q',
  'query',
  'name',
  'firstname',
  'first_name',
  'lastname',
  'last_name',
  'surname',
  'nachname',
  'vorname',
  'bib',
  'startnumber',
  'startnr',
  'startno',
  'nr',
  'participant',
  'teilnehmer',
  'athlete',
  'runner',
  'person',
  'result-id',
  'resultid',
  'result_id',
  'pid',
  'uid',
  'email',
  'match',
])

/** A path that is one person's result, which no stripping can widen. */
const PERSONAL_SEGMENTS = new Set([
  'athlete',
  'athletes',
  'participant',
  'participants',
  'teilnehmer',
  'runner',
  'person',
  'profile',
  'mein-ergebnis',
])

export function shareableResultsUrl(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return undefined

  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return undefined
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined
  // Credentials in a URL are never the race's.
  if (url.username || url.password) return undefined

  const segments = url.pathname.split('/').filter(Boolean)
  if (segments.some((segment) => PERSONAL_SEGMENTS.has(segment.toLowerCase()))) return undefined

  for (const key of [...url.searchParams.keys()]) {
    if (PERSONAL_PARAMS.has(key.toLowerCase())) url.searchParams.delete(key)
  }
  // Rewritten even when nothing was dropped, so two runners who saved the same
  // page report the same string: the corroboration rule compares them. A space
  // stays percent-encoded because "+" for a space is a convention and not
  // every server reads it.
  url.search = url.searchParams.toString().replace(/\+/g, '%20')
  // A fragment is where a page puts the row it scrolled to.
  url.hash = ''

  return url.toString()
}
