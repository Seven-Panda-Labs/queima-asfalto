import { toIsoCountry } from './countries.js'
import type { DiscoveredRace } from './types.js'

/**
 * One event page from a German race directory, read by its labels.
 *
 * No `schema.org` anywhere, but the page is written the same way every time,
 * and it carries what no other source we read has all at once: the city, the
 * distances on offer, and the entry fee per distance.
 *
 * ```html
 * <h1>Usedom Marathon</h1>
 * <strong>Datum:</strong> Samstag, 05.09.2026 <br>
 * <strong>Ort:</strong> Wolgast, Deutschland<br>
 * <strong>Homepage:</strong> <a href="https://usedom-marathon.com">…</a><br>
 * <strong>Distanzen:</strong> 21 km / 42 km<br>
 * <h2>Startgebühr</h2>
 * <tr><td>21 km Halbmarathon</td><td>16,00 - 25,00 Euro</td></tr>
 * ```
 */

const NAME = /<h1[^>]*>([\s\S]*?)<\/h1>/i
const LABEL = (label: string) =>
  new RegExp(`<strong>\\s*${label}\\s*:?\\s*<\\/strong>([\\s\\S]*?)(?:<br|<\\/p|<h2)`, 'i')
const DAY = /(\d{1,2})\.(\d{1,2})\.(\d{4})/
const HOMEPAGE = /<strong>\s*Homepage\s*:?\s*<\/strong>[\s\S]*?href="([^"]+)"/i
const FEE_ROW = /<tr>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/gi
const KM = /(\d{1,3})(?:[.,](\d{1,3}))?\s*km/gi
const MONEY = /(\d{1,5})(?:[.,](\d{2}))?\s*(?:-\s*(\d{1,5})(?:[.,](\d{2}))?\s*)?(Euro|EUR|USD|CHF|GBP|SEK|NOK|DKK|PLN|CZK)/i

/** The site says the race is off, in the middle of the page's own prose. */
const CANCELLED = /\babgesagt\b|\bentf[äa]llt\b|\bfindet nicht statt\b/i

const CURRENCY_BY_WORD: Record<string, string> = {
  euro: 'EUR', eur: 'EUR', usd: 'USD', chf: 'CHF', gbp: 'GBP',
  sek: 'SEK', nok: 'NOK', dkk: 'DKK', pln: 'PLN', czk: 'CZK',
}

function text(html: string): string {
  return html
    .replace(/<[^>]+>/gis, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&raquo;/gi, '»')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, ' ')
    .trim()
}

function field(html: string, label: string): string {
  const match = LABEL(label).exec(html)
  return match ? text(match[1] ?? '') : ''
}

/** German decimal comma, in a directory that writes "16,00 - 25,00 Euro". */
function amount(whole: string | undefined, cents: string | undefined): number | undefined {
  if (!whole) return undefined
  return Number(`${whole}.${(cents ?? '0').padEnd(2, '0')}`)
}

function distances(value: string): number[] {
  const found = new Set<number>()
  for (const match of value.matchAll(KM)) {
    const km = amount(match[1], match[2])
    // A three digit "distance" in this field is a typo or a lap count, and a
    // zero is neither.
    if (km !== undefined && km > 0 && km <= 500) found.add(km)
  }
  return [...found].sort((left, right) => left - right)
}

export function readMarathonDePage(
  html: string,
  options: { sourceUrl: string },
): DiscoveredRace | null {
  const name = text((NAME.exec(html) ?? [])[1] ?? '')
  if (!name) return null

  const day = DAY.exec(field(html, 'Datum'))
  // A date range ("04.09.2026 - 05.09.2026") starts on the first day, and a
  // page whose date is still "noch offen" is not a race we can plan around.
  if (!day) return null

  // "Wolgast, Deutschland", and sometimes a third part in the middle: "Dalt
  // Vila, Ibiza, Spanien". The country is the last part, the city the first.
  const place = field(html, 'Ort').split(',').map((part) => part.trim())
  const city = place[0] ?? ''
  const country = toIsoCountry(place[place.length - 1])
  if (!city || place.length < 2 || !country) return null

  const km = distances(field(html, 'Distanzen'))
  if (km.length === 0) return null

  // Every fee on the page, across distances. The cheapest and the dearest,
  // which is what the field means: one number for a race that sells a 5K and a
  // marathon would be a number about neither.
  const fees: number[] = []
  let currency: string | undefined
  for (const row of html.matchAll(FEE_ROW)) {
    const money = MONEY.exec(text(row[2] ?? ''))
    if (!money) continue
    const low = amount(money[1], money[2])
    const high = amount(money[3], money[4])
    if (low !== undefined) fees.push(low)
    if (high !== undefined) fees.push(high)
    currency ??= CURRENCY_BY_WORD[(money[5] ?? '').toLowerCase()]
  }

  const [, dd, mm, yyyy] = day
  const homepage = HOMEPAGE.exec(html)?.[1]

  return {
    // The organiser's own site when the page links one: it is where a reviewer
    // would go, and this page is only where we read it.
    sourceUrl: homepage?.startsWith('http') ? homepage : options.sourceUrl,
    name,
    startDate: `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`,
    city,
    country,
    distancesKm: km,
    ...(fees.length > 0 && currency
      ? { lowPrice: Math.min(...fees), highPrice: Math.max(...fees), currency }
      : {}),
    cancelled: CANCELLED.test(text(html)),
  }
}
