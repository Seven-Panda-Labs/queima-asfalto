import { getFirestore } from 'firebase-admin/firestore'
import { RACE_CATALOG_COLLECTION, type RaceCatalogEntry } from '../shared/raceCatalog/index.js'
import {
  placeQueryFor,
  racesNeedingPlace,
  readPlace,
} from '../shared/eventDiscovery/geocode.js'
import { delay } from './fetchPage.js'

/**
 * How many towns one run looks up.
 *
 * Geoapify's free tier is 3000 requests a day and this runs once a night, so
 * the ceiling is politeness rather than quota: three hundred clears the 3816
 * entries that have no place in under a fortnight, and costs about a minute.
 */
const LOOKUPS_PER_RUN = 300

/** The harvest is the job. This stops rather than costing it its timeout. */
const BUDGET_MS = 120_000

/** Enough to be a good citizen of an API nobody is paying for. */
const DELAY_MS = 150

const TIMEOUT_MS = 10_000

/**
 * Finds out where the catalog's races are.
 *
 * Two thirds of the catalog publishes no coordinates, and without them a race
 * is missing from the map and invisible to somebody searching within fifty
 * kilometres of a town. The sources will not start publishing them, so the
 * town and the country they do publish are turned into a point here.
 *
 * Best effort and bounded: a race with no place is a race that is harder to
 * find, not a broken one.
 */
export async function geocodeCatalogRaces(
  today: string,
  apiKey = process.env.GEOAPIFY_API_KEY?.trim(),
): Promise<{ asked: number; placed: number }> {
  if (!apiKey) return { asked: 0, placed: 0 }

  const db = getFirestore()
  const catalog = (await db.collection(RACE_CATALOG_COLLECTION).get()).docs.map(
    (document) => document.data() as RaceCatalogEntry,
  )
  const wanted = racesNeedingPlace(catalog, LOOKUPS_PER_RUN)

  const until = Date.now() + BUDGET_MS
  let asked = 0
  let placed = 0

  for (const entry of wanted) {
    if (Date.now() > until) break
    const query = placeQueryFor(entry)
    if (!query) continue
    asked += 1

    let place: { latitude: number; longitude: number } | null = null
    try {
      const url = new URL('https://api.geoapify.com/v1/geocode/search')
      url.searchParams.set('text', query.text)
      url.searchParams.set('filter', `countrycode:${query.country}`)
      url.searchParams.set('type', 'city')
      url.searchParams.set('limit', '1')
      url.searchParams.set('format', 'json')
      url.searchParams.set('apiKey', apiKey)

      const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
      if (response.ok) place = readPlace(await response.json())
    } catch (error) {
      // Asked and not answered is the same as answered with nothing: the day
      // is recorded either way and the next run moves on.
      console.error(`geocode: ${entry.id} failed`, error)
    }

    await db
      .collection(RACE_CATALOG_COLLECTION)
      .doc(entry.id)
      .set(
        place ? { ...place, placeReadAt: today } : { placeReadAt: today },
        { merge: true },
      )
    if (place) placed += 1

    await delay(DELAY_MS)
  }

  return { asked, placed }
}
