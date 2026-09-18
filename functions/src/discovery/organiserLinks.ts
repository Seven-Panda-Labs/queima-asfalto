import { getFirestore } from 'firebase-admin/firestore'
import { RACE_CATALOG_COLLECTION, type RaceCatalogEntry } from '../shared/raceCatalog/index.js'
import {
  pagesToReadForOrganiser,
  readOrganiserLink,
} from '../shared/eventDiscovery/organiserLink.js'
import { DELAY_BETWEEN_PAGES_MS, delay, fetchPage } from './fetchPage.js'

/**
 * How many listings one run reads.
 *
 * A harvest writes a few hundred entries and only some of them are new, so a
 * hundred pages a night keeps up with what arrives and still works through
 * what is left over. At a page every 700ms this is under three minutes of the
 * nine the function is allowed.
 */
const PAGES_PER_RUN = 100

/** The harvest is the job. This stops rather than costing it its timeout. */
const BUDGET_MS = 180_000

/**
 * Points entries at the organiser's site instead of the calendar's page.
 *
 * The harvest can only ever write the page it read, so every entry arrives
 * pointing at runme.de or running.life. A one-off script cleared the backlog;
 * this keeps it clear, so an operator is never sent to a platform and two
 * entries for one race can be recognised by the site they share.
 */
export async function resolveOrganiserLinks(
  today: string,
): Promise<{ read: number; resolved: number }> {
  const db = getFirestore()

  const catalog = (await db.collection(RACE_CATALOG_COLLECTION).get()).docs.map(
    (document) => document.data() as RaceCatalogEntry,
  )
  const pages = pagesToReadForOrganiser(catalog, PAGES_PER_RUN)

  const until = Date.now() + BUDGET_MS
  let read = 0
  let resolved = 0

  for (const entry of pages) {
    if (Date.now() > until) break
    const listing = entry.officialUrl!
    read += 1

    let organiser: string | undefined
    try {
      const html = await fetchPage(listing)
      if (html) organiser = readOrganiserLink(html)
    } catch (error) {
      // A page that times out is read again another night, like one with no
      // link: what matters is that the run moves on.
      console.error(`organiser link: ${entry.id} unreachable`, error)
    }

    await db
      .collection(RACE_CATALOG_COLLECTION)
      .doc(entry.id)
      .set(
        organiser
          ? { officialUrl: organiser, sourceUrl: listing, organiserLinkReadAt: today }
          : { organiserLinkReadAt: today },
        { merge: true },
      )
    if (organiser) resolved += 1

    await delay(DELAY_BETWEEN_PAGES_MS)
  }

  return { read, resolved }
}
