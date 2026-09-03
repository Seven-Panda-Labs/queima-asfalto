#!/usr/bin/env npx tsx
/**
 * Scout 5k and 10k races near Berlin whose podium is slow enough to reach.
 *
 * A one-off, run by hand, from your own machine. Not a feature and not
 * scheduled: it reads one portal's public overview pages, one per edition, with
 * a pause between them, and prints a report.
 *
 * Usage:
 *   npx tsx scripts/podium-scout.ts --target 5=20:00,10=42:00
 *   npx tsx scripts/podium-scout.ts --years 2018-2026 --parkrun --out /tmp/scout.md
 *
 * Options:
 *   --source strassenlauf|ladv
 *                        which calendar to read. strassenlauf.org is a Berlin
 *                        and Brandenburg operator's own portal; ladv.de is the
 *                        athletics federation's, which covers every state and
 *                        needs --towns instead of --plz.
 *   --towns Hannover,Garbsen
 *                        for --source ladv: the towns that count as the region
 *   --surface road|any   for --source ladv: road only, or cross-country too
 *   --years 2021-2026    years to read (default: the last five plus this one)
 *   --plz 10,12,13,14    postcode prefixes that count as near Berlin
 *   --distances 5,10     distances to look for, in km
 *   --tolerance 5        how far off a distance may be and still count, in percent
 *   --target 5=20:00,10=42:00
 *                        your mark per distance, which adds the "would have
 *                        podiumed" column. A bare time works when --distances
 *                        names one distance.
 *   --podium m|w|any     which podium to report (default: any)
 *   --min-editions 2     drop races read fewer times than this
 *   --delay 800          ms between requests
 *   --finishers          also count the field of every competition kept, which
 *                        is one more request each
 *   --parkrun            also list parkrun events near Berlin (no results read)
 *   --parkrun-from-file <dir>
 *                        read parkrun from pages saved in a browser. parkrun
 *                        refuses automated readers by user-agent, so this makes
 *                        no request. Two page shapes are recognised and told
 *                        apart by their markup: an event's history page, which
 *                        gives the winner and the field of every edition it has
 *                        ever had, and a single edition's results page, which is
 *                        the only one that gives second and third place.
 *   --parkrun-window 6   how many recent editions of a history page to count
 *   --radius 50          km from the centre, for parkrun
 *   --center 52.52,13.405
 *   --cache              reuse pages already fetched, under node_modules/.cache
 *   --out report.md      write the report to a file instead of stdout
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  aggregatePodiums,
  competitionDistanceKm,
  dedupeEditions,
  formatSeconds,
  isOpenRunningCompetition,
  matchDistance,
  median,
  parseEventOverview,
  parsePodiumTime,
  parkrunEditionsAsPodiums,
  parkrunWinnerSeconds,
  parseParkrunEventHistory,
  parseParkrunEventResults,
  parseYearIndex,
  podiumHits,
  type EditionPodium,
  type ParkrunEdition,
  type ParkrunHistory,
  type PodiumStats,
} from './podiumScout.js'
import {
  buildStrassenlaufApiUrl,
  parseStrassenlaufApiResponse,
} from '../shared/officialResults/strassenlauf.js'
import {
  LADV_ORIGIN,
  parseLadvEventPage,
  parseLadvResultList,
  listDistancesKm,
  parseLadvSitemap,
  slugLooksLikeARace,
  slugMentionsTown,
} from './ladvScout.js'
import {
  catalogSyncDate,
  normalizeParkrunCatalog,
  PARKRUN_EVENTS_URL,
  type RawParkrunEventsJson,
} from '../shared/parkrun/catalogSource.js'
import { haversineKm } from '../shared/parkrun/resolveCatalogEvent.js'

const ORIGIN = 'https://www.strassenlauf.org'

/** Says who it is and where to complain, like the harvest's. */
const USER_AGENT =
  'queima-asfalto-podium-scout/0.1 (+https://github.com/Seven-Panda-Labs/queima-asfalto)'

/**
 * Events whose whole name says they are not a running race.
 *
 * This is a fetch budget, not a filter on results: the distances only exist on
 * the overview page, so every event in the region costs a request unless its
 * name rules it out first. Deliberately narrow, an event can host a 5 km run
 * beside anything else.
 */
const NOT_A_RUNNING_EVENT = /schwimm|freiwasser|radrennen|meisterschaft|\bLM\b|\bDM\b/iu

const CACHE_DIR = resolve(import.meta.dirname, '../node_modules/.cache/podium-scout')

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`)
  if (index < 0) return undefined
  const value = process.argv[index + 1]
  return value && !value.startsWith('--') ? value : undefined
}

function flag(name: string): boolean {
  return process.argv.includes(`--${name}`)
}

function numbers(value: string): number[] {
  return value
    .split(',')
    .map((entry) => Number(entry.trim()))
    .filter((entry) => Number.isFinite(entry))
}

function years(): number[] {
  const thisYear = new Date().getFullYear()
  const range = arg('years')
  if (!range) return [thisYear - 5, thisYear - 4, thisYear - 3, thisYear - 2, thisYear - 1, thisYear]

  const [from, to] = range.split('-').map((entry) => Number(entry.trim()))
  if (!Number.isFinite(from)) throw new Error(`Unreadable --years: ${range}`)
  const last = Number.isFinite(to) ? to! : from!
  return Array.from({ length: last - from! + 1 }, (_, offset) => from! + offset)
}

const options = {
  source: arg('source') ?? 'strassenlauf',
  towns: (arg('towns') ?? '').split(',').map((entry) => entry.trim()).filter(Boolean),
  surface: arg('surface') ?? 'road',
  years: years(),
  postcodes: (arg('plz') ?? '10,12,13,14,15,16').split(',').map((entry) => entry.trim()),
  distances: numbers(arg('distances') ?? '5,10'),
  tolerance: Number(arg('tolerance') ?? 5),
  podium: arg('podium') ?? 'any',
  minEditions: Number(arg('min-editions') ?? 1),
  delay: Number(arg('delay') ?? 800),
  finishers: flag('finishers'),
  parkrun: flag('parkrun'),
  parkrunFromFile: arg('parkrun-from-file'),
  parkrunWindow: Number(arg('parkrun-window') ?? 6),
  radius: Number(arg('radius') ?? 50),
  center: numbers(arg('center') ?? '52.52,13.405'),
  cache: flag('cache'),
  out: arg('out'),
}

/**
 * The mark to beat, per distance.
 *
 * Per distance and not one number, because a podium is only ever a podium at
 * one distance: 20:00 says nothing about a 10 km, and comparing it to one would
 * make every 10 km in Brandenburg look winnable.
 */
function parseTargets(): Map<number, number> {
  const raw = arg('target')
  const marks = new Map<number, number>()
  if (!raw) return marks

  for (const entry of raw.split(',')) {
    const [left, right] = entry.split('=').map((part) => part.trim())
    const seconds = parsePodiumTime(right ?? left ?? '')
    if (seconds == null) {
      throw new Error(`Unreadable --target: ${entry}, expected 5=20:00 or mm:ss`)
    }

    if (right == null) {
      if (options.distances.length !== 1) {
        throw new Error(`--target ${entry} needs a distance: write 5=${left} or pass one --distances`)
      }
      marks.set(options.distances[0]!, seconds)
      continue
    }

    const km = Number(left)
    if (!options.distances.includes(km)) {
      throw new Error(`--target ${entry} names ${km} km, which --distances does not`)
    }
    marks.set(km, seconds)
  }

  return marks
}

const targets = parseTargets()

if (!['m', 'w', 'any'].includes(options.podium)) {
  throw new Error(`Unreadable --podium: ${options.podium}, expected m, w or any`)
}

if (!['strassenlauf', 'ladv'].includes(options.source)) {
  throw new Error(`Unreadable --source: ${options.source}, expected strassenlauf or ladv`)
}

if (options.source === 'ladv' && options.towns.length === 0) {
  throw new Error('--source ladv needs --towns, for example --towns Hannover,Garbsen,Lehrte')
}

function sleep(ms: number): Promise<void> {
  return new Promise((done) => setTimeout(done, ms))
}

let fetched = 0
let cacheHits = 0

async function fetchText(
  url: string,
  cacheKey: string,
  headers: Record<string, string> = { accept: 'text/html' },
): Promise<string | null> {
  const cacheFile = resolve(CACHE_DIR, `${cacheKey}.html`)
  if (options.cache && existsSync(cacheFile)) {
    cacheHits += 1
    return readFileSync(cacheFile, 'utf8')
  }

  if (fetched > 0) await sleep(options.delay)
  fetched += 1

  const response = await fetch(url, {
    signal: AbortSignal.timeout(20_000),
    headers: { ...headers, 'user-agent': USER_AGENT },
  })
  if (!response.ok) {
    console.error(`  ${response.status} on ${url}`)
    return null
  }

  const html = await response.text()
  if (options.cache) {
    mkdirSync(CACHE_DIR, { recursive: true })
    writeFileSync(cacheFile, html, 'utf8')
  }
  return html
}

function nearBerlin(postcode: string | null): boolean {
  if (!postcode) return false
  return options.postcodes.some((prefix) => postcode.startsWith(prefix))
}

const rows: EditionPodium[] = []
let editionsRead = 0

for (const year of options.source === 'strassenlauf' ? options.years : []) {
  const index = await fetchText(`${ORIGIN}/va_ergebnisse.php?flt=${year}`, `index-${year}`)
  if (!index) continue

  const candidates = parseYearIndex(index).filter(
    (edition) => nearBerlin(edition.postcode) && !NOT_A_RUNNING_EVENT.test(edition.name),
  )
  console.error(`${year}: ${candidates.length} events near Berlin`)

  for (const edition of candidates) {
    const sourceUrl = `${ORIGIN}/va_ergebnisse.php?id=${edition.eventId}`
    const overview = await fetchText(sourceUrl, `event-${edition.eventId}`)
    if (!overview) continue
    editionsRead += 1

    for (const competition of parseEventOverview(overview)) {
      if (!isOpenRunningCompetition(competition.competition)) continue

      const km = competitionDistanceKm(competition.competition)
      if (km == null) continue

      const nominalKm = matchDistance(km, options.distances, options.tolerance)
      if (nominalKm == null) continue

      for (const group of competition.groups) {
        if (options.podium !== 'any' && group.group !== options.podium) continue
        rows.push({
          edition,
          competition: competition.competition,
          match: competition.match,
          finishers: null,
          distanceKm: km,
          nominalKm,
          group: group.group,
          places: group.places,
          sourceUrl,
        })
      }
    }
  }
}

/**
 * The federation's calendar, narrowed to a region before anything is fetched.
 *
 * The town is in the event's URL, so a year of the whole country costs one
 * request and the region costs nothing on top. Then one page per event for its
 * result lists, and one per list, which the distance in the list's own slug
 * keeps down to the ones asked for.
 */
async function readLadv(): Promise<void> {
  for (const year of options.years) {
    const sitemap = await fetchText(`${LADV_ORIGIN}/sitemap/veranstaltung/${year}`, `ladv-${year}`)
    if (!sitemap) continue

    const candidates = parseLadvSitemap(sitemap).filter(
      (event) => slugMentionsTown(event.slug, options.towns) && slugLooksLikeARace(event.slug),
    )
    console.error(`${year}: ${candidates.length} races in the region`)

    for (const candidate of candidates) {
      const page = await fetchText(candidate.url, `ladv-event-${candidate.eventId}`)
      if (!page) continue

      const event = parseLadvEventPage(page)
      if (!event) continue

      const town =
        options.towns.find((name) => candidate.slug.toLowerCase().includes(name.toLowerCase())) ?? ''

      for (const list of event.resultLists) {
        const wanted = listDistancesKm(list.slug).some(
          (km) => matchDistance(km, options.distances, options.tolerance) != null,
        )
        if (!wanted) continue

        const html = await fetchText(list.url, `ladv-list-${list.listId}`)
        if (!html) continue
        editionsRead += 1

        for (const section of parseLadvResultList(html)) {
          // Only the open men's and women's races: LADV names the class, so an
          // age group is skipped rather than guessed at.
          if (section.group == null) continue
          if (options.surface === 'road' && section.surface !== 'road') continue
          if (section.date == null || section.distanceKm == null) continue

          const nominalKm = matchDistance(section.distanceKm, options.distances, options.tolerance)
          if (nominalKm == null) continue
          if (options.podium !== 'any' && section.group !== options.podium) continue

          rows.push({
            edition: {
              eventId: candidate.eventId,
              date: section.date,
              name: event.name,
              place: town,
              postcode: null,
            },
            competition: section.discipline,
            match: null,
            finishers: section.finishers,
            distanceKm: section.distanceKm,
            nominalKm,
            group: section.group,
            places: section.places,
            sourceUrl: list.url,
          })
        }
      }
    }
  }
}

if (options.source === 'ladv') await readLadv()

/**
 * How many ran, for the podiums that survived deduplication.
 *
 * The count is the whole competition, both podiums together, because that is
 * what the portal counts. It is fetched last and only for what the report will
 * show: every other order would pay for rows that get dropped.
 */
async function countFinishers(kept: EditionPodium[]): Promise<void> {
  const counted = new Map<string, number | null>()

  for (const row of kept) {
    if (row.match == null) continue

    const key = `${row.edition.eventId}|${row.match}`
    if (!counted.has(key)) {
      const apiUrl = buildStrassenlaufApiUrl(
        { eventId: row.edition.eventId, match: row.match, cert: '', origin: ORIGIN },
        '',
        { length: 1 },
      )
      if (!apiUrl) continue

      const referer = `${ORIGIN}/va_ergebnisse.php?id=${row.edition.eventId}&match=${row.match}`
      const body = await fetchText(apiUrl, `field-${key.replace('|', '-')}`, {
        accept: 'application/json, text/javascript, */*; q=0.01',
        'x-requested-with': 'XMLHttpRequest',
        Referer: referer,
      })

      let total: number | null = null
      if (body) {
        try {
          total = parseStrassenlaufApiResponse(JSON.parse(body))?.recordsTotal ?? null
        } catch {
          // A body that is not JSON is a template change, and one missing field
          // size is not worth failing a run over.
          total = null
        }
      }
      counted.set(key, total)
    }

    row.finishers = counted.get(key) ?? null
  }
}

const kept = dedupeEditions(rows)
if (options.finishers) await countFinishers(kept)

const stats = aggregatePodiums(kept).filter((entry) => entry.editions >= options.minEditions)

function medianThird(entry: PodiumStats): number {
  // A race whose podium was never filled is the best news there is, so it
  // sorts above every measured one rather than off the bottom of the table.
  return median(entry.thirdSeconds) ?? Number.POSITIVE_INFINITY
}

const GROUP_LABEL: Record<string, string> = { m: 'M', w: 'W', unknown: '?' }

function time(seconds: number | null): string {
  return seconds == null ? '-' : formatSeconds(seconds)
}

const lines: string[] = []
lines.push(`# Podium scout: ${options.distances.join(' and ')} km`)
lines.push('')
lines.push(
  options.source === 'ladv'
    ? `Source: ladv.de, years ${options.years[0]} to ${options.years.at(-1)}, towns ${options.towns.join(', ')}.`
    : `Source: strassenlauf.org, years ${options.years[0]} to ${options.years.at(-1)}, postcodes ${options.postcodes.join(', ')}xxx.`,
)
lines.push(
  `${editionsRead} editions read, ${fetched} requests, ${cacheHits} from cache. Distances ${options.distances.join(' and ')} km, within ${options.tolerance}%.`,
)
lines.push('')
if (options.source === 'ladv') {
  lines.push('Group M and W are the classes the federation names, so nothing here is inferred:')
  lines.push('a race run as an age class is not a podium anybody can enter and is left out.')
  lines.push('"Field" is everyone in that class. Road races only, unless --surface any.')
} else {
  lines.push("Group M and W are the portal's own two blocks, men first. A competition with a")
  lines.push('single podium is marked ?, because a women-only race looks exactly like an open')
  lines.push('one. "Field" is the median number of finishers in the competition, both podiums')
  lines.push('together, and it is only there with --finishers.')
}
lines.push('"Open" counts editions with fewer than three finishers in that group: a place')
lines.push('nobody took, which is why an open podium counts as one you would have reached.')

for (const distance of options.distances) {
  const rowsForDistance = stats.filter((entry) => entry.nominalKm === distance)
  const target = targets.get(distance) ?? null

  rowsForDistance.sort((left, right) => {
    if (target != null) {
      const byHits = podiumHits(right, target) - podiumHits(left, target)
      if (byHits !== 0) return byHits
    }

    const byThird = medianThird(right) - medianThird(left)
    if (byThird !== 0) return byThird

    // Same podium, fewer people to beat: the smaller field goes first.
    return (median(left.finishers) ?? Infinity) - (median(right.finishers) ?? Infinity)
  })

  const header = [
    'Race',
    'Place',
    'Group',
    'Editions',
    '3rd median',
    '3rd slowest',
    '3rd fastest',
    'Winner median',
    'Field',
    'Open',
    'Last',
  ]
  if (target != null) header.splice(4, 0, `Podium with ${formatSeconds(target)}`)

  lines.push('')
  lines.push(`## ${distance} km`)
  lines.push('')
  lines.push(
    target == null
      ? `${rowsForDistance.length} races, slowest podium first.`
      : `${rowsForDistance.length} races, the ones your ${formatSeconds(target)} reached most often first.`,
  )
  lines.push('')
  lines.push(`| ${header.join(' | ')} |`)
  lines.push(`|${header.map(() => '---').join('|')}|`)

  for (const entry of rowsForDistance) {
    const cells = [
      `[${entry.raceName}](${entry.lastSourceUrl})`,
      entry.place,
      GROUP_LABEL[entry.group] ?? '?',
      String(entry.editions),
      time(median(entry.thirdSeconds)),
      time(entry.thirdSeconds.at(-1) ?? null),
      time(entry.thirdSeconds[0] ?? null),
      time(median(entry.winnerSeconds)),
      entry.finishers.length > 0 ? String(median(entry.finishers)) : '-',
      String(entry.openPodiums),
      entry.lastDate,
    ]
    if (target != null) {
      cells.splice(4, 0, `${podiumHits(entry, target)} of ${entry.editions}`)
    }
    lines.push(`| ${cells.join(' | ')} |`)
  }
}

if (options.parkrunFromFile) {
  const dir = resolve(options.parkrunFromFile)
  const editions: ParkrunEdition[] = []
  const histories: ParkrunHistory[] = []
  const unreadable: string[] = []

  for (const file of readdirSync(dir).filter((name) => /\.html?$/i.test(name)).sort()) {
    const html = readFileSync(resolve(dir, file), 'utf8')

    // The history page's rows carry data-parkrun, a single edition's carry
    // data-position, so the markup says which page this is.
    const history = parseParkrunEventHistory(html)
    if (history) {
      histories.push(history)
      continue
    }

    const edition = parseParkrunEventResults(html)
    if (edition) editions.push(edition)
    else unreadable.push(file)
  }

  if (histories.length > 0) {
    const target = targets.get(5) ?? null
    lines.push('')
    lines.push('## parkrun, from saved history pages')
    lines.push('')
    lines.push(
      `${histories.length} events, the last ${options.parkrunWindow} editions of each, nothing fetched.`,
    )
    lines.push('These pages name the first man and the first woman home and nobody else, so')
    lines.push('this table answers whether you would have won, not whether you would have been')
    lines.push('third. Winner is whichever of the two was faster.')
    lines.push('')

    const header = ['parkrun', 'Where', 'Editions', 'Winner median', 'Winner ranged', 'Field median', 'Fastest ever', 'History', 'Last']
    if (target != null) header.splice(3, 0, `Won with ${formatSeconds(target)}`)
    lines.push(`| ${header.join(' | ')} |`)
    lines.push(`|${header.map(() => '---').join('|')}|`)

    const rows = histories.map((history) => {
      const window = history.editions.slice(0, Math.max(1, options.parkrunWindow))
      const winners = window
        .map(parkrunWinnerSeconds)
        .filter((seconds): seconds is number => seconds != null)
      const allTime = history.editions
        .map(parkrunWinnerSeconds)
        .filter((seconds): seconds is number => seconds != null)
      const fields = window
        .map((edition) => edition.finishers)
        .filter((count): count is number => count != null)

      return {
        history,
        window,
        winners: [...winners].sort((left, right) => left - right),
        fastestEver: allTime.length > 0 ? Math.min(...allTime) : null,
        fields,
        wins: target == null ? 0 : winners.filter((seconds) => seconds > target).length,
      }
    })

    rows.sort((left, right) => {
      if (target != null && right.wins !== left.wins) return right.wins - left.wins
      return (median(right.winners) ?? 0) - (median(left.winners) ?? 0)
    })

    for (const row of rows) {
      const cells = [
        `[${row.history.slug} parkrun](https://www.parkrun.com.de/${row.history.slug}/results/eventhistory/)`,
        row.history.place ?? '-',
        String(row.window.length),
        time(median(row.winners)),
        `${time(row.winners[0] ?? null)}\u2013${time(row.winners.at(-1) ?? null)}`,
        row.fields.length > 0 ? String(median(row.fields)) : '-',
        time(row.fastestEver),
        `${row.history.editions.length} editions`,
        row.history.editions[0]?.date ?? '-',
      ]
      if (target != null) cells.splice(3, 0, `${row.wins} of ${row.window.length}`)
      lines.push(`| ${cells.join(' | ')} |`)
    }
  }

  const parkrunStats = aggregatePodiums(parkrunEditionsAsPodiums(editions))
  const target = targets.get(5) ?? null

  parkrunStats.sort((left, right) => {
    if (target != null) {
      const byHits = podiumHits(right, target) - podiumHits(left, target)
      if (byHits !== 0) return byHits
    }
    return medianThird(right) - medianThird(left)
  })

  if (editions.length === 0 && unreadable.length === 0) {
    // Nothing but history pages in the folder, and that section already ran.
  } else {
  lines.push('')
  lines.push('## parkrun, from saved edition pages')
  lines.push('')
  lines.push(
    `${editions.length} editions read from ${dir}, nothing fetched. Every parkrun is 5 km, and`,
  )
  lines.push('its results table is one podium, not two. Runners\' names are not read.')
  if (unreadable.length > 0) {
    lines.push('')
    lines.push(`Not a results page, skipped: ${unreadable.join(', ')}.`)
  }
  lines.push('')

  const header = ['parkrun', 'Editions', '3rd median', '3rd slowest', '3rd fastest', 'Winner median', 'Field', 'Last']
  if (target != null) header.splice(2, 0, `Podium with ${formatSeconds(target)}`)
  lines.push(`| ${header.join(' | ')} |`)
  lines.push(`|${header.map(() => '---').join('|')}|`)

  for (const entry of parkrunStats) {
    const cells = [
      `[${entry.raceName}](${entry.lastSourceUrl})`,
      String(entry.editions),
      time(median(entry.thirdSeconds)),
      time(entry.thirdSeconds.at(-1) ?? null),
      time(entry.thirdSeconds[0] ?? null),
      time(median(entry.winnerSeconds)),
      entry.finishers.length > 0 ? String(median(entry.finishers)) : '-',
      entry.lastDate,
    ]
    if (target != null) cells.splice(2, 0, `${podiumHits(entry, target)} of ${entry.editions}`)
    lines.push(`| ${cells.join(' | ')} |`)
  }
  }
}

if (options.parkrun) {
  const response = await fetch(PARKRUN_EVENTS_URL, { headers: { 'user-agent': USER_AGENT } })
  if (!response.ok) throw new Error(`Failed to fetch parkrun events: ${response.status}`)

  const catalog = normalizeParkrunCatalog(
    (await response.json()) as RawParkrunEventsJson,
    catalogSyncDate(new Date()),
  )
  const [lat, lng] = options.center

  const near = catalog.events
    .filter((event) => event.seriesId === 1)
    .map((event) => ({ event, km: haversineKm(lat!, lng!, event.lat, event.lng) }))
    .filter((entry) => entry.km <= options.radius)
    .sort((left, right) => left.km - right.km)

  lines.push('')
  lines.push(`## parkrun candidates within ${options.radius} km`)
  lines.push('')
  lines.push('From events.json, the feed parkrun publishes for its own map. No results are')
  lines.push('read: parkrun blocks automated reading of its results pages on purpose (405 from')
  lines.push('Google Cloud, 450 through Cloudflare, see issue #204), and a bot challenge is an')
  lines.push('answer. These are places to look at by hand, every one of them a 5 km.')
  lines.push('')
  lines.push('| Event | Location | Km from centre | Page |')
  lines.push('|---|---|---|---|')
  for (const { event, km } of near) {
    lines.push(
      `| ${event.longName} | ${event.location} | ${km.toFixed(1)} | ${event.countryUrl}/${event.slug}/ |`,
    )
  }
}

const report = `${lines.join('\n')}\n`

if (options.out) {
  writeFileSync(options.out, report, 'utf8')
  console.error(`Wrote ${stats.length} races to ${options.out}`)
} else {
  process.stdout.write(report)
}
