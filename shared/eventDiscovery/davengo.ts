import { isChildrensRace, parseDistancesKm } from './distances.js'
import type { DiscoveredRace } from './types.js'

/**
 * davengo, which publishes a calendar as JSON and its distances in a page.
 *
 * `/event/search?page=0` answers with the whole shape its own front end uses:
 * name, date, "Deutschland, Berlin", and an action per link. What it never
 * carries is the distance, and the event page hides it inside a Vaadin app. The
 * starter list does carry it, as an embedded competition list, which is why the
 * distances come from there.
 */
export type DavengoSearchResponse = {
  futureEvents?: number
  futurePages?: number
  requestedPage?: number
  eventEntries?: DavengoEntry[]
}

export type DavengoEntry = {
  name?: string
  /** `dd.mm.yyyy`. */
  date?: string
  location?: string
  isPast?: boolean
  actions?: { actionName?: string; actionType?: number; actionLink?: string }[]
}

/**
 * Country names as davengo writes them.
 *
 * Only what it actually serves. An unmapped country is left blank rather than
 * guessed: the city still shows, and a wrong code would filter the race out of
 * the one search that would have found it.
 */
const COUNTRY_CODES: Record<string, string> = {
  deutschland: 'DE',
  österreich: 'AT',
  oesterreich: 'AT',
  schweiz: 'CH',
  niederlande: 'NL',
  belgien: 'BE',
  dänemark: 'DK',
  daenemark: 'DK',
  polen: 'PL',
  tschechien: 'CZ',
  frankreich: 'FR',
  italien: 'IT',
  spanien: 'ES',
  luxemburg: 'LU',
}

/** `19.10.2025` to `2025-10-19`, which is what everything downstream reads. */
export function parseGermanDate(value: string): string | null {
  const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(value.trim())
  if (!match) return null
  const [, day, month, year] = match
  return `${year}-${month!.padStart(2, '0')}-${day!.padStart(2, '0')}`
}

function splitLocation(location: string | undefined): { city?: string; country?: string } {
  if (!location) return {}
  const [countryName, ...rest] = location.split(',')
  const city = rest.join(',').trim()
  const country = COUNTRY_CODES[(countryName ?? '').trim().toLowerCase()]
  return { city: city || undefined, country }
}

/** The event page, which is also where the competitions live. */
export function davengoStarterUrl(entry: DavengoEntry): string | undefined {
  const starter = entry.actions?.find((action) =>
    (action.actionLink ?? '').includes('/event/starter/'),
  )
  return starter?.actionLink
}

/**
 * The races on one page of davengo's calendar.
 *
 * Past entries are dropped here rather than downstream: the same endpoint
 * serves both, negatively indexed, and only the future ones can be entered.
 */
export function readDavengoSearch(response: DavengoSearchResponse): DiscoveredRace[] {
  const races: DiscoveredRace[] = []

  for (const entry of response.eventEntries ?? []) {
    if (entry.isPast) continue
    if (!entry.name || !entry.date) continue

    const startDate = parseGermanDate(entry.date)
    if (!startDate) continue

    const sourceUrl =
      entry.actions?.find((action) => action.actionType === 1)?.actionLink ??
      davengoStarterUrl(entry)
    if (!sourceUrl) continue

    const { city, country } = splitLocation(entry.location)

    races.push({
      sourceUrl,
      name: entry.name,
      startDate,
      city,
      country,
      // The name is all there is at this point. The starter list fills it in.
      distancesKm: parseDistancesKm([entry.name]),
      // Whether entries are still open is on the page as a word ("Anmeldung"
      // or "Geschlossen") and never as a date. Writing the race date as the
      // deadline would be inventing one, so the catalog says nothing.
      cancelled: false,
    })
  }

  return races
}

/**
 * One competition, as the starter list names it.
 *
 * Kept whole rather than flattened into labels, because the id and the title
 * say different things and only together: the children's race at S25 Berlin is
 * `{"id":"2km", "title":{"DE":"Kinderlauf"}}`, and reading the id on its own
 * would file a two kilometre children's race as a race.
 */
export type DavengoCompetition = {
  id: string
  titles: string[]
}

/**
 * The competitions a starter list names.
 *
 * The page carries them as an embedded configuration, one object per
 * competition with an id and a localised title. Ids and titles both, because
 * one says `25km` where the other says `25 km`, and either may be the one that
 * parses.
 */
export function readDavengoCompetitions(html: string): DavengoCompetition[] {
  const competitions: DavengoCompetition[] = []
  for (const match of html.matchAll(
    /\{"id":"([^"]+)","visible":(?:true|false),"title":\{([^}]*)\}/g,
  )) {
    const id = match[1]!
    if (id === 'DEFAULT') continue
    competitions.push({
      id,
      titles: [...match[2]!.matchAll(/"[A-Z]{2}":"([^"]*)"/g)].map((title) => title[1]!),
    })
  }
  return competitions
}

/** The race with whatever the starter list added to it. */
export function withDavengoDistances(race: DiscoveredRace, html: string): DiscoveredRace {
  const found = new Set<number>()
  for (const competition of readDavengoCompetitions(html)) {
    const labels = [competition.id, ...competition.titles]
    // The whole competition is a children's race or it is not: the title is
    // often the only half that says so.
    if (labels.some(isChildrensRace)) continue
    for (const km of parseDistancesKm(labels)) found.add(km)
  }

  if (found.size === 0) return race
  return {
    ...race,
    distancesKm: [...new Set([...race.distancesKm, ...found])].sort((a, b) => a - b),
  }
}
