import { NOMINAL_DISTANCE_KM, type EventType } from '../domain/eventCodes.js'

/**
 * The distances an event offers, read off the names of what it sells.
 *
 * `schema.org/Event` has no distance field, which is the one thing discovery
 * needs most. What the sources do carry is an offer per distance, named the way
 * the organiser names it: "Trail Longo 17km", "Caminhada 8km", "10.000 m",
 * "1 Meile".
 */
const UNIT = /kilometern?|km|k\b|milhas?|miles?|meilen?|metern?|m\b/
const DISTANCE_PATTERN = new RegExp(
  String.raw`(\d{1,5})(?:([.,])(\d{1,4}))?\s*(${UNIT.source})`,
  'giu',
)

/** Which unit was written, whatever spelling it was written in. */
function unitOf(written: string): 'km' | 'm' | 'mile' {
  const unit = written.toLowerCase()
  if (unit.startsWith('kilometer') || unit === 'km' || unit === 'k') return 'km'
  if (unit.startsWith('mil') || unit.startsWith('meile')) return 'mile'
  return 'm'
}

/**
 * A relay leg, which is not a distance anybody enters.
 *
 * "Staffellauf über 4 mal 3 Kilometer" is a team running twelve kilometres in
 * threes. Neither number is a race a runner signs up for, so the event keeps no
 * distance rather than gaining a 3 km that would answer a 5K search.
 */
const RELAY_MULTIPLIER = /\d{1,2}\s*(?:mal|x|×)\s*$/iu

const MILE_KM = 1.609344

/**
 * Distances an organiser names instead of measuring.
 *
 * "Halbmarathon" and "Media Maraton" are how half of Europe writes 21.0975 km,
 * and a source that publishes competitions rather than distances says only
 * that. Longest word first, so "halbmarathon" is not read as "marathon".
 */
const DISTANCE_WORDS: [RegExp, number][] = [
  [/viertel\s*marathon|quarter\s*marathon/iu, 10.549],
  [
    /halb\s*marathon|half[\s-]*marathon|semi[\s-]*marathon|meia[\s-]*maratona|media\s*marat[oó]n|mezza\s*maratona|halvmaraton/iu,
    21.0975,
  ],
  [/marathon|maratona|marat[oó]n|maraton/iu, 42.195],
]

/**
 * Races for children, which are not race distances.
 *
 * The same lesson the junior parkruns taught: an event sells a 10K and, beside
 * it, a 2 km "Kinderlauf" or a 100 m "Corrida Jovem". Filing those as races
 * puts a children's dash in an adult's history.
 */
const CHILDREN_WORDS =
  /kinder|bambini|\bkids\b|\bjunior\b|\bjovem\b|\bjovens\b|schüler|minis\b|infantil|\bmini[\s-]/iu

export function isChildrensRace(label: string): boolean {
  return CHILDREN_WORDS.test(label)
}

/**
 * The same word, ready to be located rather than only found.
 *
 * A window cut out of the label would truncate the German compounds this has to
 * recognise: twelve characters of "2000 m Höhenunterschied" is
 * "Höhenuntersc", which matches nothing.
 */
function everywhere(word: RegExp): RegExp {
  return new RegExp(word.source, 'giu')
}

/**
 * Words that make the number beside them something other than a race distance.
 *
 * Each one is a real description that filed a wrong distance, and each applies
 * only to what it sits next to, which is why prose gets a window and the name
 * of an offer does not.
 */
const NOT_A_RACE_DISTANCE = [
  // "Kinder- und Jugendläufen sowie amtlich vermessenen 5 km und 10 km" is two
  // children's races and two measured ones. Applied to the whole sentence, a
  // charity called "Deutsche Kinderhilfe" deletes every distance in it.
  CHILDREN_WORDS,
  // The legs of a triathlon that are not the run: "1,5 km Schwimmen, 40 km
  // Radfahren und 10 km Laufen" offers a 10 km run and no 40 km race.
  /schwimmen|\bswim|radfahren|radstrecke|\brad\b|\bbike\b|cycling/iu,
  // Ground going up, not along: "2000 m Höhenunterschied", "auf 2500 Metern
  // Höhe". Only reachable since the parser started reading "Meter" written as a
  // word, so the guard arrives with the thing that reaches it. Never
  // "Höhenweg", which is a path a real 10 km runs along.
  /höhenmeter|höhenunterschied|\bhöhen?\b|aufstieg|steigung/iu,
].map(everywhere)

/**
 * A lap, which is the race distance only when the label says nothing longer.
 *
 * The same three words mean opposite things: "eine 6,8 km Runde mit Zeitnahme"
 * is a 6.8 km race, while "100 km auf einem flachen 5 km Rundkurs" is a hundred
 * kilometres and no 5 km race at all. So a lap waits, and counts only if the
 * label announces neither a longer distance nor a named one.
 *
 * Never bare "rund", the German for "around" and for "about": "Rund um den
 * Sorpesee", "Ultralauf mit rund 126 km".
 */
const LAP = everywhere(/rund(?:e|en|kurs|enkurs)\b/)

/**
 * A race measured in time, where the lap is all the prose gives and the
 * distance is whatever the runner manages.
 *
 * The time has to be part of what the format is called, so a marathon that
 * closes its finish line "nach 6 Stunden" keeps its distance.
 */
const TIMED_RACE = /(?:viertel)?stunden[\s-]*lauf|minuten[\s-]*lauf|backyard/iu

/**
 * How far past a number one of those words still applies to it.
 *
 * Wide enough for "7,5 km Runde" and "km-Runden", narrow enough that the
 * charity at the end of the paragraph does not reach the race at the start.
 */
const PROSE_WINDOW = 12

/**
 * Whether the word qualifies the number that ends at `at + length`.
 *
 * Forward only, because that is the order the sentence is written in: "1,5 km
 * Schwimmen, 40 km Radfahren und 10 km Laufen" gives each number the discipline
 * that follows it, and a backward look would read the bike leg onto the run.
 *
 * And never past the next number, which has its own qualifier: in "5 km, 10 km
 * und 1 km Kids Run" the children's race is the 1 km, and reading twelve plain
 * characters ahead took the 10 km with it.
 */
function saysAfter(word: RegExp, label: string, at: number, length: number): boolean {
  const from = at + length
  const next = label.slice(from).search(/\d/)
  const to = Math.min(from + PROSE_WINDOW, next < 0 ? Infinity : from + next)

  for (const hit of label.matchAll(word)) {
    if (hit.index >= from && hit.index < to) return true
  }
  return false
}

function isNotARaceDistance(label: string, at: number, length: number): boolean {
  return NOT_A_RACE_DISTANCE.some((word) => saysAfter(word, label, at, length))
}

/**
 * Anything shorter is a sprint, not a race this app files.
 *
 * Real data: an event with a 10 km race also sells "Corrida Jovem 100m" and
 * "200m". Those are children's dashes, and reading them as distances put a
 * hundred kilometre race in a village 10K.
 */
const MIN_KM = 0.4
/** Anything longer is a stage race or a typo. */
const MAX_KM = 250

/**
 * Numbers that share the unit at the end: "drei Strecken (3,3 / 6,6 / 9,9 km)",
 * "Laufstrecken von 21 bis 42 Kilometer".
 *
 * The main pattern needs the unit beside the number, so a list like that gave
 * up its last distance and dropped the other two. Real prose from a calendar
 * that publishes no offers, where the description is the only place a distance
 * exists at all.
 */
const SEPARATOR = /\s*(?:[/&+]|\bbis\b|\bto\b)\s*/giu
const SHARED_UNIT = new RegExp(
  String.raw`(\d{1,3}(?:[.,]\d{1,3})?(?:${SEPARATOR.source}\d{1,3}(?:[.,]\d{1,3})?)+)\s*(${UNIT.source})`,
  'giu',
)

function sharedUnitDistances(label: string): string[] {
  const expanded: string[] = []
  for (const match of label.matchAll(SHARED_UNIT)) {
    const unit = match[2]!
    for (const number of match[1]!.split(SEPARATOR)) {
      if (number.trim()) expanded.push(`${number.trim()} ${unit}`)
    }
  }
  return expanded
}

/**
 * @param prose the labels are sentences, not the names of what is on sale.
 *
 * The difference is what a children's word disqualifies: the whole label when
 * it names one product, and only the numbers beside it in a description.
 */
export function parseDistancesKm(
  labels: readonly string[],
  { prose = false }: { prose?: boolean } = {},
): number[] {
  const found = new Set<number>()

  for (const raw of labels) {
    // A children's race contributes no distance: whatever number it carries is
    // not a distance this app should file.
    if (!prose && isChildrensRace(raw)) continue

    // A timed race announces a lap and an hour count. Neither is a distance.
    if (prose && TIMED_RACE.test(raw)) continue

    // Rewritten so every number in a shared unit list carries that unit, which
    // the pattern below needs to see them at all.
    const expanded = sharedUnitDistances(raw)
    const label = expanded.length > 0 ? `${raw} ${expanded.join(' ')}` : raw

    const measured = new Set<number>()
    /** Laps, kept only if nothing else in this label is a distance. */
    const laps = new Set<number>()

    for (const match of label.matchAll(DISTANCE_PATTERN)) {
      const whole = match[1]!
      const fraction = match[3]
      const unit = unitOf(match[4]!)

      if (prose && RELAY_MULTIPLIER.test(label.slice(0, match.index))) continue

      // "10.000 m" is ten thousand metres and "21,1 km" is twenty one point one:
      // in metres a group of exactly three digits is a thousands separator,
      // which is also how "42,195 km" keeps its decimals.
      const isThousands = unit === 'm' && fraction?.length === 3
      const value = isThousands
        ? Number(`${whole}${fraction}`)
        : Number(fraction ? `${whole}.${fraction}` : whole)
      if (!Number.isFinite(value)) continue

      const km = unit === 'mile' ? value * MILE_KM : unit === 'm' ? value / 1000 : value

      // Four decimals, because 21,0975 km is a half marathon and 21,098 is a
      // number nobody wrote.
      const rounded = Math.round(km * 10000) / 10000
      if (prose && isNotARaceDistance(label, match.index, match[0].length)) continue
      if (rounded < MIN_KM || rounded > MAX_KM) continue

      if (prose && saysAfter(LAP, label, match.index, match[0].length)) laps.add(rounded)
      else measured.add(rounded)
    }

    if (measured.size > 0) {
      for (const km of measured) found.add(km)
      continue
    }

    // The word only fills in for a label that gave no number: "Meia maratona
    // 21,1 km" is 21.1, not 21.1 and 21.0975.
    const named = DISTANCE_WORDS.find(([pattern]) => pattern.test(label))
    if (named) {
      found.add(named[1])
      continue
    }

    // Nothing else was said, so the lap is the race: "eine 6,8 km Runde mit
    // Zeitnahme" is how a company run publishes its distance.
    for (const km of laps) found.add(km)
  }

  return [...found].sort((left, right) => left - right)
}

const BUCKETS = (Object.keys(NOMINAL_DISTANCE_KM) as EventType[]).map((eventType) => ({
  eventType,
  km: NOMINAL_DISTANCE_KM[eventType],
}))

/**
 * The preset distance a real one belongs to.
 *
 * Nearest by ratio, not by difference: 8 km is much closer to 10 than the two
 * kilometres suggest, while 2 km away from a marathon is nothing. Ratio also
 * keeps the short track distances from swallowing everything.
 */
export function nearestEventType(km: number): EventType {
  return BUCKETS.reduce((best, bucket) => {
    const ratio = (value: number) => (value > km ? value / km : km / value)
    return ratio(bucket.km) < ratio(best.km) ? bucket : best
  }).eventType
}

/** The presets an event's distances map onto, in the catalog's order, deduplicated. */
export function toDisciplines(distancesKm: readonly number[]): EventType[] {
  const seen = new Set<EventType>()
  for (const km of distancesKm) seen.add(nearestEventType(km))
  return BUCKETS.filter((bucket) => seen.has(bucket.eventType)).map((bucket) => bucket.eventType)
}
