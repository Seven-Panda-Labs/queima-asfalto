/**
 * How fast the podium is, read off a results portal's own overview pages.
 *
 * The question this answers is not "who won", it is "would my time have been
 * top three here". A single edition cannot answer it: a fast visitor turns an
 * easy podium into an impossible one for one Saturday. So everything here is
 * shaped around the same race across years.
 *
 * Pure parsing and aggregation. Fetching, and the politeness that goes with it,
 * lives in podium-scout.ts.
 */
import { parseDistancesKm } from '../shared/eventDiscovery/distances.js'
import { slugify, stripEdition } from '../shared/eventDiscovery/identity.js'

export type IndexEdition = {
  eventId: string
  /** ISO, so editions sort without being parsed twice. */
  date: string
  name: string
  /** As printed: "14476 Groß Glienicke". */
  place: string
  postcode: string | null
}

export type PodiumPlace = {
  position: number
  name: string
  time: string
  seconds: number
}

/**
 * One podium, which is one block of the overview table.
 *
 * The portal prints men first and women second, separated by an empty row, and
 * says so nowhere. A competition with a single block says nothing at all about
 * whose podium it is: a women-only race looks exactly like an open one.
 */
export type PodiumGroup = {
  group: 'm' | 'w' | 'unknown'
  places: PodiumPlace[]
}

export type CompetitionPodiums = {
  competition: string
  /** The portal's index for this competition, which the results API needs. */
  match: string | null
  groups: PodiumGroup[]
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  szlig: 'ß',
  auml: 'ä',
  Auml: 'Ä',
  ouml: 'ö',
  Ouml: 'Ö',
  uuml: 'ü',
  Uuml: 'Ü',
  eacute: 'é',
}

export function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name: string) => ENTITIES[name] ?? ENTITIES[name.toLowerCase()] ?? match)
}

function cellText(cell: string): string {
  return decodeEntities(cell.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

function rowsOf(html: string): string[][] {
  return [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((row) =>
    [...(row[1] ?? '').matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) =>
      cellText(cell[1] ?? ''),
    ),
  )
}

const GERMAN_DATE = /^(\d{2})\.(\d{2})\.(\d{4})$/
const EVENT_LINK = /va_ergebnisse\.php\?id=(\d+)/i
const POSTCODE = /\b(\d{5})\b/

/** The year index: one row per event, with the day, the link and the place. */
export function parseYearIndex(html: string): IndexEdition[] {
  const editions: IndexEdition[] = []

  for (const row of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...(row[1] ?? '').matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(
      (cell) => cell[1] ?? '',
    )
    if (cells.length < 3) continue

    const day = GERMAN_DATE.exec(cellText(cells[0]!))
    if (!day) continue

    const link = EVENT_LINK.exec(cells[1]!)
    if (!link) continue

    const place = cellText(cells[2]!)
    editions.push({
      eventId: link[1]!,
      date: `${day[3]}-${day[2]}-${day[1]}`,
      name: cellText(cells[1]!),
      place,
      postcode: POSTCODE.exec(place)?.[1] ?? null,
    })
  }

  return editions
}

export function parsePodiumTime(value: string): number | null {
  const match = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:[.,]\d+)?$/.exec(value.trim())
  if (!match) return null

  const hours = Number(match[1] ?? 0)
  const minutes = Number(match[2])
  const seconds = Number(match[3])
  if (minutes > 59 || seconds > 59) return null

  return hours * 3600 + minutes * 60 + seconds
}

export function formatSeconds(total: number): string {
  const rounded = Math.round(total)
  const hours = Math.floor(rounded / 3600)
  const minutes = Math.floor((rounded % 3600) / 60)
  const seconds = rounded % 60
  const mmss = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  return hours > 0 ? `${hours}:${mmss}` : mmss
}

const PANEL_START = '<div class="panel[^"]*clickable-panel"'

/**
 * One competition's block, attributes and table kept apart.
 *
 * The attributes are read separately rather than matched in order, so a panel
 * that one day carries them the other way round loses its match index instead
 * of disappearing from the report.
 *
 * Two guards, both paid for in real data. The panel must carry a `title`,
 * because the page ends with a "sign up again" panel that is clickable, has no
 * title and has no table. And the table has to be this panel's own: without the
 * lookahead, that titleless panel swallowed the next competition's table and
 * every competition after it was read under the wrong name.
 */
const PANEL = new RegExp(
  `${PANEL_START}((?=[^>]*title=)[^>]*)>((?:(?!${PANEL_START})[\\s\\S])*?)<\\/table>`,
  'gi',
)

/**
 * Every competition of one edition, with its podiums.
 *
 * The overview page is the whole point of reading this portal: one request per
 * edition, and the top three of every competition already on it. Nothing here
 * needs the per-competition pages, which is a request each.
 */
export function parseEventOverview(html: string): CompetitionPodiums[] {
  const competitions: CompetitionPodiums[] = []

  for (const panel of html.matchAll(PANEL)) {
    const attributes = panel[1] ?? ''
    const competition = decodeEntities(/title="([^"]*)"/i.exec(attributes)?.[1] ?? '').trim()
    if (!competition) continue

    const match = /match=(\d+)/i.exec(attributes)?.[1] ?? null

    const groups: PodiumGroup[] = []
    let places: PodiumPlace[] = []

    const closeGroup = () => {
      if (places.length > 0) groups.push({ group: 'unknown', places })
      places = []
    }

    for (const cells of rowsOf(panel[2] ?? '')) {
      if (cells.length < 4) continue

      const position = Number(cells[0])
      const seconds = parsePodiumTime(cells[3] ?? '')
      // The empty row is the separator between the two podiums, and a header
      // row parses as neither a position nor a time.
      if (!Number.isFinite(position) || position < 1 || seconds == null) {
        closeGroup()
        continue
      }

      places.push({ position, name: cells[1] ?? '', time: cells[3] ?? '', seconds })
    }
    closeGroup()

    // Men first, women second, which is the portal's order wherever both are
    // there. One block on its own stays unknown: that is the shape of a
    // women-only race as much as of an open one.
    if (groups.length >= 2) {
      groups[0]!.group = 'm'
      groups[1]!.group = 'w'
    }

    competitions.push({ competition, match, groups })
  }

  return competitions
}

/**
 * Not a running race anybody enters, whatever distance its name carries.
 *
 * Real data, all of it from Brandenburg in one year: "10km Radfahren" is a bike
 * ride that finishes a 10 km in 24:27, "10 Km: Mannschaftswertung" is a team's
 * three times added up, and "4,8km U40 m" is an age class. None of them is a
 * podium an adult can walk up to and enter.
 */
const NOT_A_RUN =
  /walking|walker|nordic|\bw-nw\b|\bnw\b|schwimm|freiwasser|staffel|mannschaft|team\b|radfahren|radrennen|radfahrt|\brad\b|\bmtb\b|\bbike\b|inline|skate|kinderwagen|handbike|rollstuhl|duathlon|triathlon|hunde|paarlauf|jugend|senioren|masters|\bU\s?\d{1,3}\b/iu

/**
 * A birth-year window, which is how the portal writes an age-restricted race.
 *
 * Real data: "5 km Laufen 2009-2011" and "5 km Lauf 2008 2010" are both youth
 * races, and neither podium is one an adult can enter. The separator is a dash
 * or nothing at all, so a space counts. A single year is not a window: "10 km
 * 2025" is just an edition.
 */
const AGE_WINDOW = /(?:19|20)\d{2}\s*(?:[-/–]|\s)\s*(?:19|20)?\d{2}\b/u

export function isOpenRunningCompetition(label: string): boolean {
  return !NOT_A_RUN.test(label) && !AGE_WINDOW.test(label)
}

/** The distance a competition's name carries, or null when it carries none. */
export function competitionDistanceKm(label: string): number | null {
  return parseDistancesKm([label])[0] ?? null
}

/**
 * The wanted distance a real one counts as, or null.
 *
 * A share of the distance, not a fixed number of metres: a 9,6 km course is a
 * 10 km anybody compares against their 10 km, and a 5,6 km one is a different
 * race whose podium times say nothing about a 5 km mark.
 */
export function matchDistance(
  km: number,
  wanted: readonly number[],
  tolerancePercent: number,
): number | null {
  let best: number | null = null
  let bestGap = Number.POSITIVE_INFINITY

  for (const target of wanted) {
    const gap = Math.abs(km - target) / target
    if (gap <= tolerancePercent / 100 && gap < bestGap) {
      best = target
      bestGap = gap
    }
  }

  return best
}

/**
 * The same race, one year apart.
 *
 * Same idea as the catalog's duplicate rule, different problem: here the two
 * names are the same organiser's, a year apart, so what drifts is spelling and
 * not sponsors. Real data: "Natursportpark Blankenfeld" became "Blankenfelde".
 * So a token counts as present when one is a prefix of the other.
 */
export function namesAgreeAcrossYears(left: string, right: string): boolean {
  const tokens = (name: string) =>
    slugify(stripEdition(name))
      .split('-')
      .filter((token) => token.length > 2)

  const a = tokens(left)
  const b = tokens(right)
  if (a.length === 0 || b.length === 0) return false

  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a]
  return shorter.every((token) =>
    longer.some(
      (other) =>
        other === token ||
        (token.length >= 4 && other.startsWith(token)) ||
        (other.length >= 4 && token.startsWith(other)),
    ),
  )
}

export type EditionPodium = {
  edition: IndexEdition
  competition: string
  /** The portal's index for this competition, or null when the page changed shape. */
  match: string | null
  /**
   * How many finished this competition, both podiums together, or null when it
   * was not asked for. One request each, so it is opt-in.
   */
  finishers: number | null
  distanceKm: number
  /** The wanted distance this counts as, which is what groups editions. */
  nominalKm: number
  group: PodiumGroup['group']
  places: PodiumPlace[]
  sourceUrl: string
}

export type PodiumStats = {
  raceName: string
  place: string
  postcode: string | null
  nominalKm: number
  group: PodiumGroup['group']
  editions: number
  lastDate: string
  lastSourceUrl: string
  /** Third place, one per edition that had one, ascending. */
  thirdSeconds: number[]
  /** Editions where the third place was never taken: fewer than three finishers. */
  openPodiums: number
  winnerSeconds: number[]
  /** Field size, one per edition that was counted, ascending. */
  finishers: number[]
}

function statsKey(row: EditionPodium): string {
  return `${row.edition.postcode ?? slugify(row.edition.place)}|${row.nominalKm}|${row.group}`
}

/**
 * One podium per edition, distance and group.
 *
 * An event sells the same distance more than once: id 926 has a "10 Km" and a
 * "10 km extern", which are one race classified twice. Counting both would
 * inflate the edition count and mix two views of one day. The one kept is the
 * least encouraging, a filled podium over an empty one and the fastest third
 * place of those, because this report exists to be trusted and not to sell.
 */
export function dedupeEditions(rows: readonly EditionPodium[]): EditionPodium[] {
  const best = new Map<string, EditionPodium>()

  const rank = (row: EditionPodium) => {
    const third = row.places.find((place) => place.position === 3)
    return third ? third.seconds : Number.POSITIVE_INFINITY
  }

  for (const row of rows) {
    const key = `${row.edition.eventId}|${row.nominalKm}|${row.group}`
    const held = best.get(key)
    if (!held || rank(row) < rank(held)) best.set(key, row)
  }

  return [...best.values()]
}

/** One row per race, distance and podium, across every edition read. */
export function aggregatePodiums(rows: readonly EditionPodium[]): PodiumStats[] {
  const buckets: { key: string; rows: EditionPodium[] }[] = []

  for (const row of dedupeEditions(rows)) {
    const key = statsKey(row)
    const bucket = buckets.find(
      (candidate) =>
        candidate.key === key &&
        candidate.rows.some((other) => namesAgreeAcrossYears(other.edition.name, row.edition.name)),
    )
    if (bucket) bucket.rows.push(row)
    else buckets.push({ key, rows: [row] })
  }

  return buckets.map(({ rows: group }) => {
    const byDate = [...group].sort((left, right) => right.edition.date.localeCompare(left.edition.date))
    const latest = byDate[0]!

    const thirds: number[] = []
    const winners: number[] = []
    const fields: number[] = []
    let openPodiums = 0

    for (const row of group) {
      if (row.finishers != null) fields.push(row.finishers)

      const third = row.places.find((place) => place.position === 3)
      if (third) thirds.push(third.seconds)
      else openPodiums += 1

      const winner = row.places.find((place) => place.position === 1)
      if (winner) winners.push(winner.seconds)
    }

    return {
      raceName: stripEdition(latest.edition.name),
      place: latest.edition.place,
      postcode: latest.edition.postcode,
      nominalKm: latest.nominalKm,
      group: latest.group,
      editions: group.length,
      lastDate: latest.edition.date,
      lastSourceUrl: latest.sourceUrl,
      thirdSeconds: thirds.sort((left, right) => left - right),
      openPodiums,
      winnerSeconds: winners.sort((left, right) => left - right),
      finishers: fields.sort((left, right) => left - right),
    }
  })
}

export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 1) return sorted[middle]!
  return (sorted[middle - 1]! + sorted[middle]!) / 2
}

/**
 * How often a mark would have been enough.
 *
 * An edition nobody finished third in counts as a hit: three finishers is what
 * fills a podium, and a group of two leaves a place empty for anyone who shows
 * up. That is the whole opportunity, and dropping those editions would hide it.
 */
export function podiumHits(stats: PodiumStats, targetSeconds: number): number {
  return stats.openPodiums + stats.thirdSeconds.filter((seconds) => seconds > targetSeconds).length
}

/**
 * A parkrun event results page, read from a file a person saved.
 *
 * parkrun refuses automated readers by user-agent: an agent that says what it
 * is gets 403 even on robots.txt, while a browser gets served. So this reads
 * what a browser already fetched, and makes no request of its own.
 *
 * Names are deliberately not read. A podium needs three times, not three
 * people, and these pages are full of real runners.
 */
export type ParkrunEdition = {
  slug: string
  date: string
  finishers: number | null
  places: PodiumPlace[]
}

const PARKRUN_SLUG = /(?:^|["'/])([a-z0-9][a-z0-9-]{2,})\/parkrunner\//i
const PARKRUN_ISO_DATE = /class="format-date"[^>]*>\s*(\d{4})-(\d{2})-(\d{2})/i
const PARKRUN_LOCAL_DATE = /class="format-date"[^>]*>\s*(\d{2})\/(\d{2})\/(\d{4})/i
const PARKRUN_ROW = /<tr[^>]*class="[^"]*Results-table-row[^"]*"([^>]*)>([\s\S]*?)<\/tr>/gi
const PARKRUN_TIME_CELL = /Results-table-td--time[^>]*>([\s\S]*?)<\/td>/i

function parkrunFinishers(html: string): number | null {
  for (const match of html.matchAll(/class="value"[^>]*>\s*([\d.,]+)\s*</gi)) {
    // The label sits just after its value, and the page also counts volunteers.
    const following = html.slice(match.index + match[0].length, match.index + match[0].length + 300)
    if (!/finisher/i.test(following)) continue

    const total = Number((match[1] ?? '').replace(/[.,]/g, ''))
    if (Number.isFinite(total)) return total
  }

  return null
}

export function parseParkrunEventResults(html: string): ParkrunEdition | null {
  const slug = PARKRUN_SLUG.exec(html)?.[1]?.toLowerCase()
  if (!slug) return null

  const iso = PARKRUN_ISO_DATE.exec(html)
  const local = PARKRUN_LOCAL_DATE.exec(html)
  const date = iso
    ? `${iso[1]}-${iso[2]}-${iso[3]}`
    : local
      ? `${local[3]}-${local[2]}-${local[1]}`
      : null
  if (!date) return null

  const places: PodiumPlace[] = []

  for (const row of html.matchAll(PARKRUN_ROW)) {
    const position = Number(/data-position="(\d+)"/i.exec(row[1] ?? '')?.[1])
    if (!Number.isFinite(position) || position > 3) continue

    const time = cellText(PARKRUN_TIME_CELL.exec(row[2] ?? '')?.[1] ?? '')
    const seconds = parsePodiumTime(time)
    if (seconds == null) continue

    places.push({ position, name: '', time, seconds })
  }

  places.sort((left, right) => left.position - right.position)
  return { slug, date, finishers: parkrunFinishers(html), places }
}

/**
 * parkrun editions in the shape the rest of the report already understands.
 *
 * Every parkrun is 5 km and none of them splits its results table by gender,
 * so the group is the one podium there is.
 */
export function parkrunEditionsAsPodiums(editions: readonly ParkrunEdition[]): EditionPodium[] {
  return editions.map((edition) => ({
    edition: {
      eventId: `${edition.slug}-${edition.date}`,
      date: edition.date,
      name: `${edition.slug} parkrun`,
      place: `${edition.slug} parkrun`,
      postcode: `parkrun-${edition.slug}`,
    },
    competition: 'parkrun 5 km',
    match: null,
    finishers: edition.finishers,
    distanceKm: 5,
    nominalKm: 5,
    group: 'unknown' as const,
    places: edition.places,
    sourceUrl: `https://www.parkrun.com.de/${edition.slug}/results/`,
  }))
}

/**
 * The event history page, which is one file for an event's whole life.
 *
 * Every row carries the day, the field, and the first man and first woman home,
 * in data attributes: one saved page answers "how fast do you have to be to win
 * here" for 361 Saturdays. What it does not carry is second and third place, so
 * it triages events and cannot settle a podium.
 *
 * Names are in those attributes too, and are not read.
 */
export type ParkrunHistoryEdition = {
  eventNumber: number
  date: string
  finishers: number | null
  /** First man home, in seconds, and first woman. Either can be missing. */
  maleSeconds: number | null
  femaleSeconds: number | null
}

export type ParkrunHistory = {
  slug: string
  editions: ParkrunHistoryEdition[]
}

/**
 * The page writes 15:35 as "1535", so the digits are read from the right.
 *
 * Anything else would turn a 1:05:30 into nonsense, and a four digit time into
 * fifteen hundred seconds.
 */
export function parseParkrunHistoryTime(value: string): number | null {
  const digits = value.trim()
  if (!/^\d{3,6}$/.test(digits)) return null

  const seconds = Number(digits.slice(-2))
  const minutes = Number(digits.slice(-4, -2))
  const hours = digits.length > 4 ? Number(digits.slice(0, -4)) : 0
  if (seconds > 59 || minutes > 59) return null

  return hours * 3600 + minutes * 60 + seconds
}

const HISTORY_ROW = /<tr[^>]*class="[^"]*Results-table-row[^"]*"([^>]*)>/gi
const HISTORY_SLUG = /(?:^|["'/])([a-z0-9][a-z0-9-]{2,})\/results\/\d+/i

export function parseParkrunEventHistory(html: string): ParkrunHistory | null {
  const slug = HISTORY_SLUG.exec(html)?.[1]?.toLowerCase()
  if (!slug) return null

  const editions: ParkrunHistoryEdition[] = []

  for (const row of html.matchAll(HISTORY_ROW)) {
    const attributes = row[1] ?? ''
    const read = (name: string) =>
      new RegExp(`data-${name}="([^"]*)"`, 'i').exec(attributes)?.[1] ?? ''

    const date = read('date')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue

    const finishers = Number(read('finishers'))
    editions.push({
      eventNumber: Number(read('parkrun')) || 0,
      date,
      finishers: Number.isFinite(finishers) && finishers > 0 ? finishers : null,
      maleSeconds: parseParkrunHistoryTime(read('maletime')),
      femaleSeconds: parseParkrunHistoryTime(read('femaletime')),
    })
  }

  if (editions.length === 0) return null

  editions.sort((left, right) => right.date.localeCompare(left.date))
  return { slug, editions }
}

/** The first finisher, whoever it was: the two the page names are not ranked against each other. */
export function parkrunWinnerSeconds(edition: ParkrunHistoryEdition): number | null {
  const times = [edition.maleSeconds, edition.femaleSeconds].filter(
    (seconds): seconds is number => seconds != null,
  )
  return times.length === 0 ? null : Math.min(...times)
}
