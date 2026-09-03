import type { DiscoveredRace } from './types.js'

/**
 * A hand kept marathon calendar, three pages of it.
 *
 * The site has one rule and states it: only events with the official 42,195 km
 * are listed. That is why nothing here parses a distance. Everything else is a
 * table somebody types by hand, which is exactly why this parser refuses rather
 * than guesses: a country it cannot resolve is a row it drops.
 *
 * Two layouts, told apart by the row itself rather than by which page it came
 * from, because the pages are edited by hand too:
 *
 * ```
 * Germany   05.09.2026 | 46. Usedom Marathon | 17431      | Wolgast
 * Abroad    05.09.2026 | 19. Baroko Maraton  | Plasy      | CZE | Tschechien
 * ```
 */

const ROW = /<tr[^>]*>(.*?)<\/tr>/gis
const CELL = /<t[dh][^>]*>(.*?)<\/t[dh]>/gis
const DAY = /^(\d{2})\.(\d{2})\.(\d{4})$/
const LINK = /href="(https?:\/\/[^"]+)"/i

/** The site's own footnote, and any tail in brackets: "*(privater Marathonlauf)". */
const FOOTNOTE = /\s*\*?\s*\([^)]*\)\s*$/

/**
 * A marathon that is not a marathon race.
 *
 * The leg of a triathlon relay and a marathon split over three days are both
 * listed here, and neither is a race a runner can enter as a marathon.
 */
const NOT_A_MARATHON = /triathlon|\bin\s+\d+\s+etappen/i

/** What the site takes and nothing else, by its own stated rule. */
const MARATHON_KM = 42.195

/**
 * The country codes the site uses, which are IOC codes typed from memory.
 *
 * So both spellings are here wherever it disagrees with the standard: it writes
 * JAP for Japan, MAY for Malaysia, SER for Serbia, ROM for Romania, and both
 * SLK and SVK for Slovakia. A code that is not in this table drops the row,
 * because `country` is what dedup matches on and a wrong one is worse than a
 * missing race.
 */
const COUNTRY_BY_CODE: Record<string, string> = {
  ALA: 'AX', ALB: 'AL', AND: 'AD', ARG: 'AR', ARM: 'AM', AUS: 'AU', AUT: 'AT',
  AZE: 'AZ', BAH: 'BS', BEL: 'BE', BIH: 'BA', BLR: 'BY', BOT: 'BW', BRA: 'BR',
  BUL: 'BG', CAN: 'CA', CHI: 'CL', CHN: 'CN', CRO: 'HR', CYP: 'CY', CZE: 'CZ',
  DEN: 'DK', EGY: 'EG', ESP: 'ES', EST: 'EE', ETH: 'ET', FIN: 'FI', FRA: 'FR',
  FRO: 'FO', GBR: 'GB', GEO: 'GE', GER: 'DE', GIB: 'GI', GRE: 'GR', GRL: 'GL',
  GUE: 'GG', HKG: 'HK', HUN: 'HU', INA: 'ID', IND: 'IN', IRI: 'IR', IRL: 'IE',
  ISL: 'IS', ISR: 'IL', ITA: 'IT', JAP: 'JP', JOR: 'JO', JPN: 'JP', JEY: 'JE',
  KAZ: 'KZ', KEN: 'KE', KGZ: 'KG', KIR: 'KI', KOR: 'KR', LAT: 'LV', LBN: 'LB',
  LIE: 'LI', LTU: 'LT', LUX: 'LU', MAR: 'MA', MAS: 'MY', MAU: 'MU', MAY: 'MY',
  MCO: 'MC', MDA: 'MD', MDV: 'MV', MEX: 'MX', MLT: 'MT', MNE: 'ME', MKD: 'MK',
  NAM: 'NA', NED: 'NL', NEP: 'NP', NFK: 'NF', NMK: 'MK', NOR: 'NO', NZL: 'NZ',
  PAK: 'PK', PCN: 'PN', PHI: 'PH', POL: 'PL', POR: 'PT', PYF: 'PF', QAT: 'QA',
  RKS: 'XK', ROM: 'RO', ROU: 'RO', RSA: 'ZA', RUS: 'RU', SER: 'RS', SIN: 'SG',
  SLK: 'SK', SLO: 'SI', SMR: 'SM', SRB: 'RS', SUI: 'CH', SVK: 'SK', SWE: 'SE',
  THA: 'TH', TAN: 'TZ', TUN: 'TN', TUR: 'TR', UAE: 'AE', UKR: 'UA', USA: 'US',
  UZB: 'UZ', VIE: 'VN', ZIM: 'ZW',
}

function text(html: string): string {
  return html
    .replace(/<[^>]+>/gis, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&Ouml;/g, 'Ö')
    .replace(/&ouml;/g, 'ö')
    .replace(/&Auml;/g, 'Ä')
    .replace(/&auml;/g, 'ä')
    .replace(/&Uuml;/g, 'Ü')
    .replace(/&uuml;/g, 'ü')
    .replace(/&szlig;/g, 'ß')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, ' ')
    .trim()
}

function cells(row: string): string[] {
  return [...row.matchAll(CELL)].map((match) => match[1] ?? '')
}

export function readPlanetMarathonCalendar(
  html: string,
  options: {
    /** The calendar page, which is the fallback for a race with no own site. */
    sourceUrl: string
    /** The country a page without a country column is about. */
    country?: string
  },
): DiscoveredRace[] {
  const races: DiscoveredRace[] = []

  for (const match of html.matchAll(ROW)) {
    const row = match[1] ?? ''
    const columns = cells(row)
    if (columns.length < 4) continue

    const day = DAY.exec(text(columns[0] ?? ''))
    if (!day) continue

    const [, dd, mm, yyyy] = day
    const rawName = text(columns[1] ?? '')
    if (!rawName || NOT_A_MARATHON.test(rawName)) continue

    const name = rawName.replace(FOOTNOTE, '').trim()
    if (!name) continue

    const abroad = /^[A-Z]{3}$/.test(text(columns[3] ?? ''))
    const city = text(columns[abroad ? 2 : 3] ?? '')
    const country = abroad ? COUNTRY_BY_CODE[text(columns[3] ?? '')] : options.country
    // No country and no city is a row nobody can place, and a placed race is
    // the whole point of a calendar.
    if (!country || !city) continue

    // The organiser's own site, when the row links one. Better than the
    // calendar page: it is where a reviewer would go to check the entry.
    const link = LINK.exec(columns[1] ?? '')

    races.push({
      sourceUrl: link?.[1] ?? options.sourceUrl,
      name,
      startDate: `${yyyy}-${mm}-${dd}`,
      city,
      country,
      distancesKm: [MARATHON_KM],
      cancelled: false,
    })
  }

  return races
}
