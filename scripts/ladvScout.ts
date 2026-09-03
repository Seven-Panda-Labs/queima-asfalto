/**
 * LADV, the German athletics federation's own results platform.
 *
 * The reason to read this one rather than a regional portal: it is federal.
 * Every state publishes there, so the same reader that finds races around
 * Hannover finds them around Kassel, and the timing operators' own sites do not
 * have to be visited one by one.
 *
 * Its robots.txt allows these paths and disallows exactly the ones it should:
 * the API, the data exchange, athlete records and certificate printing. The
 * sitemap is advertised there too, which is what makes the enumeration cheap:
 * the event's town is written into the URL, so a whole year of the country can
 * be narrowed to one region without fetching a single page.
 *
 * Pure parsing. Fetching lives in podium-scout.ts.
 */
import { parseDistancesKm } from '../shared/eventDiscovery/distances.js'
import { decodeEntities, parsePodiumTime, type PodiumPlace } from './podiumScout.js'

export const LADV_ORIGIN = 'https://ladv.de'

export type LadvEventLink = {
  eventId: string
  url: string
  /** The slug, readable: "49.-Hermann-Löns-Park-Lauf-Hannover". */
  slug: string
}

const SITEMAP_EVENT = /<loc>\s*([^<\s]*\/veranstaltung\/detail\/(\d+)\/([^<\s]*?)\.htm)\s*<\/loc>/gi

export function parseLadvSitemap(xml: string): LadvEventLink[] {
  const events: LadvEventLink[] = []

  for (const match of xml.matchAll(SITEMAP_EVENT)) {
    events.push({
      eventId: match[2]!,
      url: decodeURI(match[1]!),
      slug: safeDecode(match[3]!),
    })
  }

  return events
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/**
 * Whether an event's slug names one of the towns asked for.
 *
 * The town is the tail of the slug, but not always the last word: real data has
 * "Neustadt-am-Rübenberge" and "Burgdorf-(Region-Hannover)". So this asks
 * whether the town appears at all, which over-matches an event merely named
 * after a place and is corrected by reading the event's own page.
 */
export function slugMentionsTown(slug: string, towns: readonly string[]): boolean {
  const haystack = slug.toLowerCase()
  return towns.some((town) => haystack.includes(town.toLowerCase()))
}

/**
 * Whether a slug is worth a request.
 *
 * LADV is a track and field platform first: of ninety events around Hannover in
 * one year, most are indoor meetings, throwing days and combined events. This
 * keeps what reads like a race on foot over a distance, and the event's own page
 * settles the rest.
 */
const RACE_WORDS = /lauf|cross|marathon|rennen|meile|volkslauf/iu
const NOT_A_ROAD_RACE =
  /mehrkampf|werfer|sportfest|hallen|meeting|vergleich|sprint|staffeltag|bahnserie|abendsportfest/iu

export function slugLooksLikeARace(slug: string): boolean {
  return RACE_WORDS.test(slug) && !NOT_A_ROAD_RACE.test(slug)
}

export type LadvResultList = {
  listId: string
  url: string
  slug: string
}

/**
 * The distances a result list's own slug names.
 *
 * A slug has no spaces, and every organiser hyphenates differently: real data
 * has "Ergebnisliste-5-km", "-5k-", and "-5000m-" for the same distance. Turning
 * the separators back into spaces is what lets one reader see all three, and
 * reading this before fetching is what keeps the marathon lists unfetched.
 */
export function listDistancesKm(slug: string): number[] {
  return parseDistancesKm([slug.replace(/[-_.]+/g, ' ')])
}

export type LadvEvent = {
  name: string
  resultLists: LadvResultList[]
}

const RESULT_LIST_LINK = /href="(\/ergebnisse\/(\d+)\/([^"]*?)\.htm)"/gi

export function parseLadvEventPage(html: string): LadvEvent | null {
  const name = decodeEntities(/<title>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '')
    // "[akt.]" is the platform marking a list it has updated, not part of a name.
    .replace(/\[akt\.?\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!name) return null

  const seen = new Set<string>()
  const resultLists: LadvResultList[] = []

  for (const match of html.matchAll(RESULT_LIST_LINK)) {
    const listId = match[2]!
    if (seen.has(listId)) continue
    seen.add(listId)

    resultLists.push({
      listId,
      url: `${LADV_ORIGIN}${decodeURI(match[1]!)}`,
      slug: safeDecode(match[3]!),
    })
  }

  return { name, resultLists }
}

export type LadvSection = {
  /** As printed: "5 km Straße (5-km Lauf männlich/Finale) - Männer". */
  discipline: string
  distanceKm: number | null
  /** The class the page names, and only the open one counts as a podium. */
  group: 'm' | 'w' | null
  surface: 'road' | 'cross' | 'track' | 'unknown'
  date: string | null
  places: PodiumPlace[]
  /** Everyone in this section, not just the podium: the list is the whole class. */
  finishers: number
}

const SECTION = /<div class="erg_headline">([\s\S]*?)<\/div>([\s\S]*?)(?=<div class="erg_headline">|<div id="footer|$)/gi
const SECTION_DATE = /<div class="erg_headline_right">\s*(\d{2})\.(\d{2})\.(\d{4})/i
const RESULT_ROW = /<div class="erg_row">([\s\S]*?)<\/div>\s*<\/div>/gi
const PLACE_CELL = /<div class="platz">\s*(\d+)\s*\.?\s*<\/div>/i
const TIME_CELL = /<div class="performance">\s*([^<]*?)\s*<\/div>/i

/**
 * The open men's and women's races, and nothing else.
 *
 * LADV states the class rather than implying it, so this requires the open one
 * instead of listing the ones to exclude: "- Männer" and "- Frauen" are podiums
 * anybody can enter, and "- M40", "männliche Jugend U18" and the rest are not.
 */
function readGroup(discipline: string): 'm' | 'w' | null {
  if (/-\s*Männer\s*$/iu.test(discipline)) return 'm'
  if (/-\s*Frauen\s*$/iu.test(discipline)) return 'w'
  return null
}

function readSurface(discipline: string): LadvSection['surface'] {
  if (/stra(ß|ss)e/iu.test(discipline)) return 'road'
  if (/cross|gelände|gelaende|wald/iu.test(discipline)) return 'cross'
  if (/bahn|stadion|halle/iu.test(discipline)) return 'track'
  return 'unknown'
}

function text(value: string): string {
  return decodeEntities(value.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseLadvResultList(html: string): LadvSection[] {
  const sections: LadvSection[] = []

  for (const match of html.matchAll(SECTION)) {
    const discipline = text(match[1] ?? '')
    if (!discipline) continue

    const body = match[2] ?? ''
    const day = SECTION_DATE.exec(body)
    const times: { time: string; seconds: number }[] = []
    let finishers = 0

    for (const row of body.matchAll(RESULT_ROW)) {
      // A row with no place cell is not a result: it is the layout around one.
      if (!PLACE_CELL.test(row[1] ?? '')) continue
      finishers += 1

      const time = text(TIME_CELL.exec(row[1] ?? '')?.[1] ?? '')
      const seconds = parsePodiumTime(time)
      if (seconds == null) continue

      // Names and birth years are in this row and are not read: a podium needs
      // three times, and this is a federation's athlete record.
      times.push({ time, seconds })
    }

    // The podium is the three fastest, worked out here rather than read off the
    // page, because the printed place is not always the race's. Some lists are
    // one ranking and some are grouped by age class with every class starting
    // again at one: the women's 10 km at the Eilenriederennen opens with a W80
    // in 1:01:50 marked first. Sorting is right for both shapes.
    const places: PodiumPlace[] = times
      .sort((left, right) => left.seconds - right.seconds)
      .slice(0, 3)
      .map((entry, index) => ({ position: index + 1, name: '', time: entry.time, seconds: entry.seconds }))

    sections.push({
      discipline,
      distanceKm: parseDistancesKm([discipline])[0] ?? null,
      group: readGroup(discipline),
      surface: readSurface(discipline),
      date: day ? `${day[3]}-${day[2]}-${day[1]}` : null,
      places,
      finishers,
    })
  }

  return sections
}
