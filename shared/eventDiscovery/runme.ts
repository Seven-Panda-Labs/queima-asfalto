import { parseDistancesKm } from './distances.js'
import { toIsoCountry } from './countries.js'
import type { DiscoveredRace } from './types.js'

/**
 * A worldwide race calendar, one month of it per page.
 *
 * The only source we read where Germany is the minority: a September page is
 * 112 races in the United States, 54 in Germany, then Austria, Switzerland,
 * Czechia, Italy, France, Colombia. Twelve pages, one per month, and the month
 * is a word rather than a date, so the same twelve URLs roll forward for ever.
 *
 * Every event carries what the catalog needs, and the distances come from the
 * names of what it sells rather than from prose:
 *
 * ```html
 * <div class="event-header__description">
 *   <h2 class="event-header__title"><a href="/deutschland/abendlauf">45. Abendlauf</a></h2>
 *   <div class="distance-promo">… 46499 Hamminkeln, Nordrhein-Westfalen, DE …
 *   <li><span>5 km</span>…  d-n="5 km"        d-d="2026-09-04"
 *   <li><span>10 km</span>… d-n="10 km"       d-d="2026-09-04"
 * ```
 */

const BLOCK = /<div class="event-header__description/
const TITLE = /class="event-header__title"[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i
const PLACE = /glyphicon-map-marker"><\/span>\s*([^<]+)/i
const COMPETITION = /d-n="([^"]+)"\s+d-d="(\d{4}-\d{2}-\d{2})"/gi
/**
 * A postcode, wherever the country puts it and whatever it looks like.
 *
 * Germany writes "46499 Hamminkeln", the United States "Mountain Home 83647",
 * Andorra "AD300 Ordino" and Argentina "Q8370 San Martin de los Andes". Only at
 * an end, so a number inside a town's name survives.
 */
const POSTCODE = /^[A-Z]{0,3}[-\s]?\d{3,6}[A-Z]?\s+|\s+[A-Z]{0,3}[-\s]?\d{3,6}[A-Z]?$/g
/** "Brandenburg (Bundesland)" is a region with its own label attached. */
const REGION_LABEL = /\s*\((?:bundesland|state|land)\)\s*$/i

/**
 * A competition that is not a run.
 *
 * The calendar sells walks beside the races and names them: "5 km-W",
 * "1 Meilen-W", "5 km-W/NW". A name that says both ("5 km-Laufen & Walking")
 * is a run somebody can also walk, and it stays.
 */
const WALK_ONLY = /-\s*(?:w|nw|w\/nw)\b|nordic[\s-]*walking|wandern/i
const RUNNING_TOO = /laufen|lauf\b|run\b|running/i

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
}

function decode(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&([a-z]+|#\d+);/gi, (whole, name: string) =>
      name.startsWith('#')
        ? String.fromCharCode(Number(name.slice(1)))
        : (ENTITIES[name.toLowerCase()] ?? whole),
    )
    .replace(/\s+/g, ' ')
    .trim()
}

/** "16278 Angermünde, Brandenburg (Bundesland), DE" and "Lakeland 33803, Florida, US". */
function readPlace(value: string): { city: string; region?: string; country?: string } {
  const parts = value.split(',').map((part) => part.trim()).filter(Boolean)
  if (parts.length < 2) return { city: '' }

  const country = toIsoCountry(parts[parts.length - 1])
  const region = parts.length >= 3 ? parts[parts.length - 2]!.replace(REGION_LABEL, '') : undefined
  const city = (parts[0] ?? '').replace(POSTCODE, '').replace(/\s+/g, ' ').trim()

  return { city, ...(region ? { region } : {}), ...(country ? { country } : {}) }
}

function isRunning(competition: string): boolean {
  return !WALK_ONLY.test(competition) || RUNNING_TOO.test(competition)
}

export function readRunmeCalendar(
  html: string,
  options: { baseUrl: string },
): DiscoveredRace[] {
  const races: DiscoveredRace[] = []

  for (const block of html.split(BLOCK)) {
    const title = TITLE.exec(block)
    if (!title) continue

    const name = decode(title[2] ?? '')
    const place = readPlace(decode(PLACE.exec(block)?.[1] ?? ''))
    if (!name || !place.city || !place.country) continue

    const competitions = [...block.matchAll(COMPETITION)].map((match) => ({
      name: decode(match[1] ?? ''),
      day: match[2]!,
    }))
    const running = competitions.filter((competition) => isRunning(competition.name))
    if (running.length === 0) continue

    // An event that runs over a weekend sells each day separately, and the race
    // starts on the first of them.
    const startDate = running.map((competition) => competition.day).sort()[0]!

    races.push({
      sourceUrl: new URL(title[1] ?? '', options.baseUrl).toString(),
      name,
      startDate,
      city: place.city,
      ...(place.region ? { region: place.region } : {}),
      country: place.country,
      // The competition names are what the event sells, so a short one is a
      // race and not a lap length: no prose floor here.
      distancesKm: parseDistancesKm(running.map((competition) => competition.name)),
      cancelled: false,
    })
  }

  return races
}
