import { parseDistancesKm } from './distances.js'
import type { DiscoveredRace } from './types.js'

/**
 * A timing operator's own calendar, on one page.
 *
 * Same bargain as scc-events and the reason both are worth reading: one request
 * answers with every event the operator runs, and these resolve to a results
 * platform the app already imports, so a catalog entry from here arrives with a
 * working results path attached.
 *
 * The markup is Joomla EventBooking, a block per event, and it says three
 * things and no more:
 *
 * ```html
 * <div class="eb-category-1 eb-event-container">
 *   <h2 class="eb-even-title-container"> Foerderturmlauf </h2>
 *   <i class="fa fa-calendar"></i> 17.09.2026
 *   <a href="/essen/view-map…" class="eb-colorbox-map"><span>Essen</span></a>
 *   <a href="https://foerderturmlauf.de/" target="_blank">Veranstaltungswebsite</a>
 * ```
 *
 * No distances anywhere, and none to be had: the registration page behind each
 * block is a RaceResult widget that only exists once a browser has run it, and
 * by the rule in the discovery doc that is not a source. So these arrive with
 * the distance unanswered, which the catalog allows and the runner is asked for
 * when they add one.
 */

/** The typo is the site's: `eb-even-title-container`, no `t`. */
const BLOCK =
  /<div class="eb-category-\d+ eb-event-container">([\s\S]*?)(?=<div class="eb-category-\d+ eb-event-container">|$)/g
const TITLE = /<h2[^>]*class="[^"]*eb-even-title-container[^"]*"[^>]*>([\s\S]*?)<\/h2>/i
const DATE = /(\d{1,2})\.(\d{1,2})\.(\d{4})/
const CITY = /class="[^"]*eb-colorbox-map[^"]*"[^>]*>\s*<span>([\s\S]*?)<\/span>/i
/** The race's own site, which the block links under a button of that name. */
const OFFICIAL = /href="(https?:\/\/[^"]+)"[^>]*>\s*<button[^>]*>\s*Veranstaltungswebsite/i
const REGISTRATION = /href="(\/anmeldung\/[^"]+)"/i

/**
 * What the operator times besides races.
 *
 * They run the clock for the Urban-Hike series and a swim and run, and neither
 * is a race this app has anything to say about. A relay stays: people enter it
 * and run it, and it carries no distance here to get wrong.
 */
const NOT_A_RACE = /hike|wander|marsch|swim|schwimm|triathlon|inline|skat/iu

/**
 * A race with no place to be.
 *
 * The calendar dates the virtual edition to the operator's own town, and there
 * is nothing there on the day. The real #ZeroHungerRun Bonn is three days
 * later on the same calendar, so dropping this loses nothing.
 */
const VIRTUAL = /\bvirtuell\b|\bvirtual\b/iu

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  '#39': "'",
  nbsp: ' ',
}

function text(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&([a-z]+|#\d+);/gi, (whole, name: string) => ENTITIES[name.toLowerCase()] ?? whole)
    .replace(/\s+/g, ' ')
    .trim()
}

export type CologneTimingOptions = {
  /** What the calendar never says: every town on it is in one country. */
  country: string
  /** For turning a registration link into something a runner can open. */
  baseUrl: string
}

export function readCologneTimingCalendar(
  html: string,
  options: CologneTimingOptions,
): DiscoveredRace[] {
  const races: DiscoveredRace[] = []

  for (const match of html.matchAll(BLOCK)) {
    const block = match[1]!

    const name = text(TITLE.exec(block)?.[1] ?? '')
    const city = text(CITY.exec(block)?.[1] ?? '')
    const day = DATE.exec(block)
    // A block with no date is an event nobody has scheduled yet. The first
    // date in it is the first day, which is the one a runner plans around.
    if (!name || !city || !day) continue
    if (NOT_A_RACE.test(name) || VIRTUAL.test(name)) continue

    const startDate = `${day[3]}-${day[2]!.padStart(2, '0')}-${day[1]!.padStart(2, '0')}`

    /**
     * The race's own site, and the registration page only when there is none.
     *
     * Same call marathon.de's reader makes: a runner following the link wants
     * the race, not the page of whoever listed it.
     */
    const official = OFFICIAL.exec(block)?.[1]
    const registration = REGISTRATION.exec(block)?.[1]
    const sourceUrl = official
      ? official
      : registration
        ? new URL(registration, options.baseUrl).toString()
        : options.baseUrl

    races.push({
      sourceUrl,
      name,
      startDate,
      city,
      country: options.country,
      // The calendar publishes no distance, so the name is all there is, and
      // it answers for the two marathons and nothing else.
      distancesKm: parseDistancesKm([name]),
      cancelled: false,
    })
  }

  return races
}
