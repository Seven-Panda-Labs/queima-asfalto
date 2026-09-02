import { NOMINAL_DISTANCE_KM, type EventType } from '../domain/eventCodes.js'

/**
 * The distances an event offers, read off the names of what it sells.
 *
 * `schema.org/Event` has no distance field, which is the one thing discovery
 * needs most. What the sources do carry is an offer per distance, named the way
 * the organiser names it: "Trail Longo 17km", "Caminhada 8km", "10.000 m".
 */
const DISTANCE_PATTERN = /(\d{1,5})(?:([.,])(\d{1,4}))?\s*(km|k\b|milhas?|miles?|m\b)/giu

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
 * Anything shorter is a sprint, not a race this app files.
 *
 * Real data: an event with a 10 km race also sells "Corrida Jovem 100m" and
 * "200m". Those are children's dashes, and reading them as distances put a
 * hundred kilometre race in a village 10K.
 */
const MIN_KM = 0.4
/** Anything longer is a stage race or a typo. */
const MAX_KM = 250

export function parseDistancesKm(labels: readonly string[]): number[] {
  const found = new Set<number>()

  for (const label of labels) {
    // A children's race contributes no distance: whatever number it carries is
    // not a distance this app should file.
    if (isChildrensRace(label)) continue

    let readANumber = false

    for (const match of label.matchAll(DISTANCE_PATTERN)) {
      const whole = match[1]!
      const fraction = match[3]
      const unit = match[4]!.toLowerCase()

      // "10.000 m" is ten thousand metres and "21,1 km" is twenty one point one:
      // in metres a group of exactly three digits is a thousands separator,
      // which is also how "42,195 km" keeps its decimals.
      const isThousands = unit === 'm' && fraction?.length === 3
      const value = isThousands
        ? Number(`${whole}${fraction}`)
        : Number(fraction ? `${whole}.${fraction}` : whole)
      if (!Number.isFinite(value)) continue

      const km =
        unit.startsWith('mil') || unit.startsWith('mile')
          ? value * MILE_KM
          : unit === 'm'
            ? value / 1000
            : value

      // Four decimals, because 21,0975 km is a half marathon and 21,098 is a
      // number nobody wrote.
      const rounded = Math.round(km * 10000) / 10000
      if (rounded >= MIN_KM && rounded <= MAX_KM) {
        found.add(rounded)
        readANumber = true
      }
    }

    // The word only fills in for a label that gave no number: "Meia maratona
    // 21,1 km" is 21.1, not 21.1 and 21.0975.
    if (readANumber) continue
    for (const [pattern, km] of DISTANCE_WORDS) {
      if (pattern.test(label)) {
        found.add(km)
        break
      }
    }
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
