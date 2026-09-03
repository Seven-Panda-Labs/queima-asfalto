import type { RaceCatalogEntry } from '../raceCatalog/types.js'
import { slugify, stripEdition } from './identity.js'

/**
 * The same race, already in the catalog under another name.
 *
 * Names cannot carry this on their own. The catalog's curated entries were
 * written without a sponsor on purpose and every harvested name has one, and
 * some of them are not even in the same language: "Berlin Half Marathon" and
 * "GENERALI BERLINER HALBMARATHON" are one race and share almost no letters.
 *
 * And the day and the place cannot carry it either, which the Berlin marathon
 * weekend proves: "GENERALI 5K im Rahmen des BMW BERLIN-MARATHON" and "R5K Tour
 * Finale" are both 5 km, both in Berlin, both on 26/09/2026, and they are two
 * different races.
 *
 * So it takes both, in one of two shapes:
 *
 * 1. **A person's entry as the anchor.** Same day, same city, same distance, and
 *    exactly one side reviewed or curated. Somebody checked that entry, and a
 *    harvest turning up with the organiser's own name for it is not news.
 * 2. **Names that plainly agree.** Same day, same city, same distance, and one
 *    name contains the other once the sponsors and the edition are gone.
 */

/** Sponsors and connectives, which is most of what differs between two names. */
const NOISE =
  /\b(bmw|generali|adidas|garmin|volvo|tcs|bnp|paribas|edp|nn|virgin|money|asics|brooks|hoka|puma|nike|presented|powered|by|im|rahmen|des|beim|der|die|das|le|la|el)\b/giu

function normalizeName(name: string): string {
  return slugify(stripEdition(name).replace(NOISE, ' ')).replace(/-+/g, '-')
}

function tokens(name: string): string[] {
  return normalizeName(name).split('-').filter((token) => token.length > 2)
}

/** One name inside the other, once the noise is gone. */
function namesAgree(left: string, right: string): boolean {
  const a = tokens(left)
  const b = tokens(right)
  if (a.length === 0 || b.length === 0) return false

  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a]
  return shorter.every((token) => longer.includes(token))
}

function sameDay(left: RaceCatalogEntry, right: RaceCatalogEntry): boolean {
  const days = (entry: RaceCatalogEntry) =>
    new Set((entry.editions ?? []).map((edition) => edition.raceDate).filter(Boolean))
  const leftDays = days(left)
  if (leftDays.size === 0) return false
  return [...days(right)].some((day) => leftDays.has(day))
}

function samePlace(left: RaceCatalogEntry, right: RaceCatalogEntry): boolean {
  if (left.country.toUpperCase() !== right.country.toUpperCase()) return false
  const city = (entry: RaceCatalogEntry) => slugify(entry.city)
  return Boolean(city(left)) && city(left) === city(right)
}

function shareADistance(left: RaceCatalogEntry, right: RaceCatalogEntry): boolean {
  const mine = new Set(left.disciplines)
  return right.disciplines.some((discipline) => mine.has(discipline))
}

function reviewed(entry: RaceCatalogEntry): boolean {
  return entry.review === 'reviewed' || entry.producer === 'curated'
}

/**
 * The entry a harvested race belongs to, or nothing.
 *
 * Nothing is the safe answer and the common one: two races nobody has checked,
 * on the same day, at the same distance, in the same city, stay two races.
 */
export function findCatalogDuplicate(
  harvested: RaceCatalogEntry,
  catalog: readonly RaceCatalogEntry[],
): RaceCatalogEntry | null {
  for (const entry of catalog) {
    if (entry.id === harvested.id) continue
    if (entry.retired === true) continue
    if (!sameDay(entry, harvested)) continue
    if (!samePlace(entry, harvested)) continue
    if (!shareADistance(entry, harvested)) continue

    // A person checked this one, so the harvest is describing it, not finding
    // something new.
    if (reviewed(entry) && !reviewed(harvested)) return entry
    if (namesAgree(entry.name, harvested.name)) return entry
  }

  return null
}
