import { toIsoCountry } from './countries.js'
import { parseDistancesKm } from './distances.js'
import type { DiscoveredRace } from './types.js'

/**
 * One parser for every source that publishes `schema.org` events.
 *
 * The point of choosing sources by data shape: a site whose pages carry an
 * `Event` node costs a URL, a paginator and a fixture, not a connector. Nothing
 * here fetches, so the same code runs in the harvester and in its tests.
 */
const JSON_LD_BLOCK = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi

export function extractJsonLd(html: string): unknown[] {
  const parsed: unknown[] = []
  for (const match of html.matchAll(JSON_LD_BLOCK)) {
    try {
      parsed.push(JSON.parse(match[1]!))
    } catch {
      // A single malformed block is not a reason to drop the page.
    }
  }
  return parsed
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Every node in a document, whether it arrived bare, in an `@graph` or in an array. */
function flattenNodes(documents: readonly unknown[]): Record<string, unknown>[] {
  const nodes: Record<string, unknown>[] = []
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item)
      return
    }
    if (!isRecord(value)) return
    nodes.push(value)
    if ('@graph' in value) visit(value['@graph'])
    // A calendar page publishes its events as an ItemList of ListItems, each
    // wrapping the event in `item`. Without walking that, a page that describes
    // every race on it reads as no races at all.
    if ('itemListElement' in value) visit(value.itemListElement)
    if ('item' in value) visit(value.item)
  }
  for (const document of documents) visit(document)
  return nodes
}

const EVENT_TYPES = new Set(['Event', 'SportsEvent'])

function isEventNode(node: Record<string, unknown>): boolean {
  const type = node['@type']
  if (typeof type === 'string') return EVENT_TYPES.has(type)
  if (Array.isArray(type)) return type.some((value) => typeof value === 'string' && EVENT_TYPES.has(value))
  return false
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function money(value: unknown): number | undefined {
  const parsed = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : NaN
  return Number.isFinite(parsed) ? parsed : undefined
}

type Offer = Record<string, unknown>

function offersOf(node: Record<string, unknown>): Offer[] {
  const offers = node.offers
  if (Array.isArray(offers)) return offers.filter(isRecord)
  return isRecord(offers) ? [offers] : []
}

/**
 * The deadline the source publishes, which is the latest offer still on sale.
 *
 * An event sells one offer per distance and they close together, but when they
 * do not, the last one is the honest answer to "can I still get in".
 */
function latestValidThrough(offers: readonly Offer[]): string | undefined {
  const dates = offers
    .map((offer) => text(offer.validThrough))
    .filter((value): value is string => value !== undefined)
    .sort()
  return dates[dates.length - 1]
}

/**
 * Below this, a number in prose is not a race.
 *
 * An offer named "400m" is a race somebody can enter. The same 400 in a
 * sentence is the lap of a track ("auf der 400 m Bahn") or the children's dash
 * in a programme that runs "von 400 m bis 10 km". Reading those filed a track
 * sprint on 88 of 470 village races.
 */
const PROSE_MIN_KM = 2

function fromProse(labels: readonly string[]): number[] {
  return parseDistancesKm(labels).filter((km) => km >= PROSE_MIN_KM)
}

export function readEventNode(node: Record<string, unknown>): DiscoveredRace | null {
  if (!isEventNode(node)) return null

  const sourceUrl = text(node.url) ?? text(node['@id'])
  const name = text(node.name)
  const startDate = text(node.startDate)
  if (!sourceUrl || !name || !startDate) return null

  const location = isRecord(node.location) ? node.location : undefined
  const address = location && isRecord(location.address) ? location.address : undefined

  const offers = offersOf(node)
  const aggregate = offers.find((offer) => offer['@type'] === 'AggregateOffer')
  const labels = offers
    .map((offer) => text(offer.name))
    .filter((value): value is string => value !== undefined)

  // Documented as ISO 3166-1 alpha-2 and published as anything: "PT" from one
  // source, "Deutschland" from the next.
  const country = toIsoCountry(text(address?.addressCountry))

  return {
    sourceUrl,
    name,
    startDate,
    city: text(address?.addressLocality),
    region: text(address?.addressRegion),
    country,
    // The offers name the distances when there are offers. Otherwise the name
    // and the description are all there is, and a calendar that sells nothing
    // on the page ("Teamlauf über 5,5 km") says it there or nowhere.
    distancesKm:
      labels.length > 0
        ? parseDistancesKm(labels)
        : fromProse([name, text(node.description) ?? '']),
    registrationClosesAt: latestValidThrough(offers),
    lowPrice: money(aggregate?.lowPrice) ?? money(offers[0]?.price),
    highPrice: money(aggregate?.highPrice),
    currency: text(aggregate?.priceCurrency) ?? text(offers[0]?.priceCurrency),
    cancelled: (text(node.eventStatus) ?? '').endsWith('EventCancelled'),
  }
}

/** Every race a page publishes. Zero for a page that carries none. */
export function readRacesFromHtml(html: string): DiscoveredRace[] {
  return flattenNodes(extractJsonLd(html))
    .map(readEventNode)
    .filter((race): race is DiscoveredRace => race !== null)
}

/** For a source that hands over parsed JSON rather than a page. */
export function readRacesFromJsonLd(documents: readonly unknown[]): DiscoveredRace[] {
  return flattenNodes(documents)
    .map(readEventNode)
    .filter((race): race is DiscoveredRace => race !== null)
}
