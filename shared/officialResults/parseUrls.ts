import { isSccEventsResultsPath } from './sccEvents.js'
import { parkrunProfileUrl as parkrunProfileUrlInternal } from './parkrunProfile.js'
import type { MaxFunSportsUrlParts } from './maxFunSports.js'
import { normalizeMyRacePartnerUrl } from './myRacePartner.js'
import type { StrassenlaufUrlParts } from './strassenlauf.js'
import type { ZielZeitUrlParts } from './zielZeit.js'
import { parseEqTimingHash } from './eqTiming.js'
import type { EqTimingUrlParts } from './eqTiming.js'
import type { NsfBerlinUrlParts } from './nsfBerlin.js'
import type { RunCzechUrlParts } from './runCzech.js'
import type { UltimateUrlParts } from './ultimate.js'
import type { VcRunningUrlParts } from './vcRunning.js'
import type { MikaTimingUrlParts } from './mikaTiming.js'
import type { TimatakaUrlParts } from './timataka.js'
import type { WiclaxUrlParts } from './wiclax.js'
import { parseRaceResultEmbedHash } from './raceresult.js'

export type DavengoUrlParts = {
  eventSlug: string
  category: string
  listUrl: string
  pageUrl: string
}

export type SporthiveUrlParts = {
  eventId: string
  raceId: string
  pageUrl: string
  apiUrl: string
}

export type RaceResultUrlParts = {
  eventId?: string
  contest?: string
  listId?: string
  pageUrl: string
}

export type SccEventsUrlParts = {
  pageUrl: string
  refererOrigin: string
}

export type { MaxFunSportsUrlParts } from './maxFunSports.js'

export type MyRacePartnerUrlParts = {
  resultId: string
  eventId?: string
  pageUrl: string
  origin: string
}

export type { StrassenlaufUrlParts } from './strassenlauf.js'
export type { ZielZeitUrlParts } from './zielZeit.js'
export type { EqTimingUrlParts } from './eqTiming.js'
export type { NsfBerlinUrlParts } from './nsfBerlin.js'
export type { RunCzechUrlParts } from './runCzech.js'
export type { UltimateUrlParts } from './ultimate.js'
export type { VcRunningUrlParts } from './vcRunning.js'
export type { MikaTimingUrlParts } from './mikaTiming.js'
export type { TimatakaUrlParts } from './timataka.js'
export type { WiclaxUrlParts } from './wiclax.js'

import { parseMikaTimingUrl as parseMikaTimingUrlInternal } from './mikaTiming.js'
import { parseTimatakaUrl as parseTimatakaUrlInternal } from './timataka.js'
import { parseVcRunningUrl as parseVcRunningUrlInternal } from './vcRunning.js'
import { parseWiclaxUrl as parseWiclaxUrlInternal } from './wiclax.js'

export function parseDavengoUrl(url: string): DavengoUrlParts | null {
  try {
    const parsed = new URL(url)
    if (!parsed.hostname.toLowerCase().includes('davengo.com')) return null

    const match = /\/event\/result\/([^/]+)\/search\/?$/i.exec(parsed.pathname)
    if (!match) return null

    const eventSlug = match[1]!
    const category = parsed.searchParams.get('category')?.trim()
    if (!category) return null

    const pageUrl = parsed.toString()
    const listUrl = `${parsed.origin}/event/result/${eventSlug}/search/list`

    return { eventSlug, category, listUrl, pageUrl }
  } catch {
    return null
  }
}

export function parseSporthiveUrl(url: string): SporthiveUrlParts | null {
  try {
    const parsed = new URL(url)
    if (!parsed.hostname.toLowerCase().includes('sporthive.com')) return null

    const match = /\/events\/s\/(\d+)\/race\/(\d+)\/?$/i.exec(parsed.pathname)
    if (!match) return null

    const eventId = match[1]!
    const raceId = match[2]!
    const pageUrl = parsed.toString()
    const apiUrl = `https://eventresults-api.speedhive.com/sporthive/races/${raceId}/participants`

    return { eventId, raceId, pageUrl, apiUrl }
  } catch {
    return null
  }
}

export function parseRaceResultUrl(url: string): RaceResultUrlParts | null {
  try {
    const parsed = new URL(url.trim())
    const hostname = parsed.hostname.toLowerCase()

    if (hostname.includes('raceresult.com')) {
      const match = /^\/(\d+)(?:\/results)?\/?$/i.exec(parsed.pathname)
      if (!match) return null

      const eventId = match[1]!
      let contest: string | undefined
      let listId: string | undefined
      const hash = parsed.hash.replace(/^#/, '')
      if (hash) {
        const hashMatch = /^([^_]+)_(.+)$/.exec(hash)
        if (hashMatch) {
          contest = hashMatch[1]
          listId = hashMatch[2]
        }
      }

      return { eventId, contest, listId, pageUrl: parsed.toString() }
    }

    const embed = parseRaceResultEmbedHash(url)
    if (embed) {
      return { ...embed, pageUrl: parsed.toString() }
    }
  } catch {
    return null
  }

  return null
}

export function parseSccEventsUrl(url: string): SccEventsUrlParts | null {
  try {
    const parsed = new URL(url)
    if (!isSccEventsResultsPath(parsed.pathname)) return null

    return {
      pageUrl: parsed.toString(),
      refererOrigin: parsed.origin,
    }
  } catch {
    return null
  }
}

export function parseMaxFunSportsUrl(url: string): MaxFunSportsUrlParts | null {
  try {
    const parsed = new URL(url)
    if (!parsed.hostname.toLowerCase().includes('maxfunsports.com')) return null

    const competitionId = parsed.searchParams.get('id')?.trim()
    if (!competitionId || !/^\d+$/.test(competitionId)) return null

    const path = parsed.pathname.replace(/\/+$/, '')
    let fetchBasePath: MaxFunSportsUrlParts['fetchBasePath'] | null = null
    if (/\/result\/competition$/i.test(path)) fetchBasePath = '/result/competition'
    else if (/\/event\/competition$/i.test(path)) fetchBasePath = '/event/competition'
    else return null

    return {
      competitionId,
      pageUrl: parsed.toString(),
      fetchBasePath,
      origin: parsed.origin,
      lang: parsed.searchParams.get('lang')?.trim() || undefined,
    }
  } catch {
    return null
  }
}

export function parseMyRacePartnerUrl(url: string): MyRacePartnerUrlParts | null {
  try {
    const parsed = new URL(normalizeMyRacePartnerUrl(url))
    if (!parsed.hostname.toLowerCase().includes('myracepartner.com')) return null
    if (!/ergebnisse/i.test(parsed.pathname)) return null

    const resultId =
      parsed.searchParams.get('result-id')?.trim() ??
      parsed.searchParams.get('result_id')?.trim()
    const eventId = parsed.searchParams.get('event-id')?.trim()

    if (!resultId && (!eventId || !/^\d+$/.test(eventId))) return null
    if (resultId && !/^\d+$/.test(resultId)) return null

    return {
      resultId: resultId ?? '',
      eventId: eventId || undefined,
      pageUrl: parsed.toString(),
      origin: parsed.origin,
    }
  } catch {
    return null
  }
}

export function parseStrassenlaufUrl(url: string): StrassenlaufUrlParts | null {
  try {
    const parsed = new URL(url.trim())
    if (!parsed.hostname.toLowerCase().includes('strassenlauf.org')) return null
    if (!/va_ergebnisse\.php$/i.test(parsed.pathname)) return null

    const eventId = parsed.searchParams.get('id')?.trim()
    if (!eventId || !/^\d+$/.test(eventId)) return null

    const match = parsed.searchParams.get('match')?.trim()
    if (match && !/^-?\d+$/.test(match)) return null

    return {
      eventId,
      match: match || undefined,
      cert: parsed.searchParams.get('cert')?.trim() || '1',
      pageUrl: parsed.toString(),
      origin: parsed.origin,
    }
  } catch {
    return null
  }
}

export function parseZielZeitUrl(url: string): ZielZeitUrlParts | null {
  try {
    const parsed = new URL(url.trim())
    if (!parsed.hostname.toLowerCase().includes('ziel-zeit.de')) return null
    if (!/\/ergebnisse\//i.test(parsed.pathname)) return null
    if (!/\.pdf$/i.test(parsed.pathname)) return null

    return {
      pdfPath: parsed.pathname,
      pageUrl: parsed.toString(),
      origin: 'https://ziel-zeit.de',
    }
  } catch {
    return null
  }
}

export function parseEqTimingUrl(url: string): EqTimingUrlParts | null {
  try {
    const parsed = new URL(url.trim())
    if (!parsed.hostname.toLowerCase().includes('eqtiming.com')) return null

    const eventMatch = /^\/(\d+)\/?$/.exec(parsed.pathname)
    if (!eventMatch?.[1]) return null

    const hashParts = parseEqTimingHash(parsed.hash)
    return {
      eventId: eventMatch[1],
      etappeId: hashParts.etappeId,
      stationId: hashParts.stationId,
      pageUrl: parsed.toString(),
      origin: parsed.origin,
    }
  } catch {
    return null
  }
}

export function parseNsfBerlinUrl(url: string): NsfBerlinUrlParts | null {
  try {
    const parsed = new URL(url.trim())
    if (!parsed.hostname.toLowerCase().includes('nsf-la.de')) return null
    if (!/\/ergebnisse\/index\.php$/i.test(parsed.pathname)) return null

    const eventPath = parsed.pathname.replace(/\/index\.php$/i, '')
    if (!eventPath || eventPath === '/') return null

    return {
      eventPath,
      pageUrl: parsed.toString(),
      origin: parsed.origin,
      strecke: parsed.searchParams.get('Strecke')?.trim() || undefined,
    }
  } catch {
    return null
  }
}

export function parseRunCzechUrl(url: string): RunCzechUrlParts | null {
  try {
    const parsed = new URL(url.trim())
    if (!parsed.hostname.toLowerCase().includes('runczech.com')) return null

    const match = /^\/(en|cs)\/(results|vysledky-zavodu)\/([^/]+)\/?$/i.exec(parsed.pathname)
    if (!match?.[1] || !match[2] || !match[3]) return null

    const locale = match[1].toLowerCase()
    const section = match[2]
    const eventSlug = match[3]

    return {
      eventSlug,
      locale,
      pageUrl: `${parsed.origin}/${locale}/${section}/${eventSlug}`,
      origin: parsed.origin,
      race: parsed.searchParams.get('race')?.trim() || undefined,
    }
  } catch {
    return null
  }
}

export function parseUltimateUrl(url: string): UltimateUrlParts | null {
  try {
    const parsed = new URL(url.trim())
    if (!parsed.hostname.toLowerCase().includes('ultimate.dk')) return null

    const eventId = parsed.searchParams.get('eventid')?.trim()
    if (!eventId || !/^\d+$/.test(eventId)) return null

    const language = parsed.searchParams.get('language')?.trim() || 'us'

    return {
      eventId,
      pageUrl: `${parsed.origin}/desktop/front/index.php?eventid=${eventId}`,
      origin: parsed.origin,
      language,
      distance: parsed.searchParams.get('distance')?.trim() || undefined,
      category: parsed.searchParams.get('category')?.trim() || undefined,
    }
  } catch {
    return null
  }
}

export function parkrunProfileUrl(parkrunnerId: string): string {
  return parkrunProfileUrlInternal(parkrunnerId)
}

export function parseVcRunningUrl(url: string, fallbackYear?: number): VcRunningUrlParts | null {
  return parseVcRunningUrlInternal(url, fallbackYear)
}

export function parseMikaTimingUrl(url: string): MikaTimingUrlParts | null {
  return parseMikaTimingUrlInternal(url)
}

export function parseTimatakaUrl(url: string): TimatakaUrlParts | null {
  return parseTimatakaUrlInternal(url)
}

export function parseWiclaxUrl(url: string): WiclaxUrlParts | null {
  return parseWiclaxUrlInternal(url)
}
