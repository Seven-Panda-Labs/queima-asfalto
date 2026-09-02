import { NOMINAL_DISTANCE_KM, type EventType } from '../../src/domain/eventCodes.js'

/**
 * The distances an event offers, read off the names of what it sells.
 *
 * `schema.org/Event` has no distance field, which is the one thing discovery
 * needs most. What the sources do carry is an offer per distance, named the way
 * the organiser names it: "Trail Longo 17km", "Caminhada 8km", "10.000 m".
 */
const DISTANCE_PATTERN = /(\d{1,5}(?:[.,]\d{1,3})?)\s*(km|k\b|milhas?|miles?|m\b)/giu

const MILE_KM = 1.609344

/** Anything shorter is a lap count or a bib number, not a race. */
const MIN_KM = 0.4
/** Anything longer is a stage race or a typo. */
const MAX_KM = 250

export function parseDistancesKm(labels: readonly string[]): number[] {
  const found = new Set<number>()

  for (const label of labels) {
    for (const match of label.matchAll(DISTANCE_PATTERN)) {
      const raw = Number(match[1]!.replace(',', '.'))
      if (!Number.isFinite(raw)) continue

      const unit = match[2]!.toLowerCase()
      // A bare "m" is metres, and "10.000 m" arrives as 10 once the thousands
      // separator is read as a decimal point, so metres are only believed when
      // the number is big enough to be a distance in them.
      const km =
        unit.startsWith('mil') || unit.startsWith('mile')
          ? raw * MILE_KM
          : unit === 'm'
            ? raw >= 400
              ? raw / 1000
              : raw
            : raw

      const rounded = Math.round(km * 1000) / 1000
      if (rounded >= MIN_KM && rounded <= MAX_KM) found.add(rounded)
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
