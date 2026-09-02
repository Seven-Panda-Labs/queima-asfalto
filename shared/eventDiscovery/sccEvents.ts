import { isChildrensRace, parseDistancesKm } from './distances.js'
import type { DiscoveredRace } from './types.js'

/**
 * A timing operator's own calendar, on one page.
 *
 * This is the case where reading somebody's HTML pays: one request answers with
 * every event they run, dates and distances included, where a sitemap harvest
 * would be a page per event. The markup is a card per event, and what the
 * parser needs from it is the name, the link, the date and the distances.
 */
const CARD = /<div class="card-group-element-item">([\s\S]*?)(?=<div class="card-group-element-item">|$)/g
const TITLE = /<h3[^>]*class="[^"]*card-title[^"]*"[^>]*>\s*<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i
const SUBTITLE = /<span[^>]*class="[^"]*card-subtitle[^"]*"[^>]*>([\s\S]*?)<\/span>/i
const DISTANCES = /Streckenl[äa]nge:\s*<\/strong>([\s\S]*?)<\/p>/i
const DISCIPLINE = /Disziplinen?:\s*<\/strong>([\s\S]*?)<\/p>/i

/** Sports the app has no vocabulary for, as the calendar names them. */
const OTHER_SPORTS = /inline|skating|\brad\b|schwimm|triathlon|wander/iu

/**
 * What a calendar carries besides races.
 *
 * The marathon weekend has an expo, and the expo has a date and a card like
 * everything else.
 */
const NOT_A_RACE = /\bexpo\b|\bmesse\b|\bparty\b|\bgala\b|kongress/iu

/**
 * Running only, out of a calendar that also times skating and hiking.
 *
 * Two rules, because the calendar has two kinds of card. One names its
 * discipline, and then it has to say running: "Laufen (kein Nordic Walking)"
 * qualifies, "Inlineskating" and "Marathonwandern" do not. The other names no
 * discipline at all, which is what the flagship events do, and there the name
 * is all there is to go on: BMW BERLIN-MARATHON stays, and BMW
 * BERLIN-MARATHON Inlineskating does not.
 */
function isRunning(discipline: string, name: string): boolean {
  if (discipline) return /lauf/iu.test(discipline) && !OTHER_SPORTS.test(discipline)
  return !OTHER_SPORTS.test(name)
}

function text(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, ' · ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * The first day a card names.
 *
 * Dates come as `23.08.2026`, and a multi day event as `24. bis 26.09.2026`.
 * The first day is the one a runner plans around, and the rest of the app has
 * no vocabulary for a race that lasts a weekend.
 */
export function parseSccDate(value: string): string | null {
  const full = /(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(value)
  if (!full) return null

  const range = /(\d{1,2})\.\s*(?:bis|-|–)\s*\d{1,2}\.(\d{1,2})\.(\d{4})/.exec(value)
  const [day, month, year] = range
    ? [range[1]!, range[2]!, range[3]!]
    : [full[1]!, full[2]!, full[3]!]

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

export type SccOptions = {
  /** Where the operator's events are, since the calendar never says. */
  city: string
  country: string
  /** For turning a relative link into something a runner can open. */
  baseUrl: string
}

export function readSccCalendar(html: string, options: SccOptions): DiscoveredRace[] {
  const races: DiscoveredRace[] = []

  for (const card of html.matchAll(CARD)) {
    const block = card[1]!
    const title = TITLE.exec(block)
    if (!title) continue

    const name = text(title[2]!)
    const date = parseSccDate(text(SUBTITLE.exec(block)?.[1] ?? ''))
    // No date is an event nobody has scheduled yet.
    if (!name || !date) continue
    if (NOT_A_RACE.test(name)) continue

    // A children's race is decided by the card, not by one label on it: "Kids
    // Skating" names its distance somewhere else entirely.
    if (isChildrensRace(name)) continue
    if (!isRunning(text(DISCIPLINE.exec(block)?.[1] ?? ''), name)) continue

    const href = title[1]!
    const sourceUrl = href.startsWith('http')
      ? href
      : `${options.baseUrl.replace(/\/$/, '')}${href.startsWith('/') ? '' : '/'}${href}`

    /**
     * The card's own distances first, and the name only when it has none.
     *
     * Both halves matter. "Garmin BERLIN MILE beim GENERALI BERLINER
     * HALBMARATHON" says one mile on its card and mentions the half marathon it
     * runs alongside, so reading the name there would double it. And the
     * flagship events, GENERALI BERLINER HALBMARATHON among them, carry no
     * distance line at all, so the name is the only thing left.
     */
    const distances = DISTANCES.exec(block)
    const distancesKm = distances
      ? parseDistancesKm(text(distances[1]!).split(' · '))
      : parseDistancesKm([name])

    races.push({
      sourceUrl,
      name,
      startDate: date,
      city: options.city,
      country: options.country,
      distancesKm,
      cancelled: false,
    })
  }

  return races
}
