import { parseDistancesKm } from './distances.js'
import type { DiscoveredRace } from './types.js'

/**
 * A German race calendar that hands over its own data.
 *
 * The whole year is one page, and every card carries the fields as attributes
 * rather than as prose, which is as close to an API as a listing gets:
 *
 * ```html
 * <article data-event-card
 *   data-event-title="34. Fohlenhoflauf"  data-event-city="Homburg"
 *   data-event-state="Saarland"           data-event-date="2026-09-03"
 *   data-event-category="lauf"            data-event-distances="5k,10k"
 *   data-event-desc="… Angebotene Distanzen: 4 km, 5 km, 10 km …">
 *   …<span class="distpill">4 km</span><span class="distpill">5 km</span>…
 * ```
 *
 * The pills are what this reads for distances rather than the `distances`
 * attribute: `5k,10k` are the site's filter buckets, and "4 km" is a distance.
 */

const CARD = /<article[^>]*\bdata-event-card\b[\s\S]*?<\/article>/gi
const ATTR = /data-event-([a-z]+)="([^"]*)"/gi
const PILL = /class="distpill"[^>]*>([^<]+)</gi
const LINK = /href="(\/events\/[^"]+)"/i
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

/**
 * The categories that are a running race.
 *
 * The calendar also carries triathlons and hikes, and this app is about neither:
 * a triathlon's swim and bike would land in the catalog as distances nobody ran.
 */
const RUNNING_CATEGORIES = new Set(['lauf', 'trail'])

/** All 16 states on the page are German, so the country never needs reading. */
const COUNTRY = 'DE'

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'", nbsp: ' ',
}

function decode(value: string): string {
  return value
    .replace(/&([a-z]+|#\d+);/gi, (whole, name: string) => ENTITIES[name.toLowerCase()] ?? whole)
    .replace(/\s+/g, ' ')
    .trim()
}

function attributes(card: string): Record<string, string> {
  const found: Record<string, string> = {}
  for (const match of card.matchAll(ATTR)) found[match[1]!.toLowerCase()] = decode(match[2] ?? '')
  return found
}

export function readKilometerliebeCalendar(
  html: string,
  options: { baseUrl: string },
): DiscoveredRace[] {
  const races: DiscoveredRace[] = []

  for (const match of html.matchAll(CARD)) {
    const card = match[0]
    const data = attributes(card)

    const name = data.title
    const date = data.date
    const city = data.city
    if (!name || !city || !ISO_DAY.test(date ?? '')) continue
    if (!RUNNING_CATEGORIES.has((data.category ?? '').toLowerCase())) continue

    // The pills are the distances the race actually offers. The description
    // repeats them in prose ("Angebotene Distanzen: 4 km, 5 km, 10 km"), which
    // is the fallback for a card that shows no pills.
    const pills = [...card.matchAll(PILL)].map((pill) => decode(pill[1] ?? ''))
    const distancesKm = parseDistancesKm(pills.length > 0 ? pills : [data.desc ?? ''])
    if (distancesKm.length === 0) continue

    const href = LINK.exec(card)?.[1]

    races.push({
      sourceUrl: href ? new URL(href, options.baseUrl).toString() : options.baseUrl,
      name,
      startDate: date!,
      city,
      ...(data.state ? { region: data.state } : {}),
      country: COUNTRY,
      distancesKm,
      cancelled: /\babgesagt\b/i.test(data.desc ?? ''),
    })
  }

  return races
}
