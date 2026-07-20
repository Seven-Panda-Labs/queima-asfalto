import type { ResultsPlatform } from './types.js'
import { isParkrunEventName } from './types.js'
import { isSccEventsResultsPath } from './sccEvents.js'
import { normalizeMyRacePartnerUrl } from './myRacePartner.js'
import { isVcRunningMarketingPath, isVcRunningResultsPath } from './vcRunning.js'
import { isMikatimingCustomResultsUrl, isMikatimingHostname, parseMikaTimingUrl } from './mikaTiming.js'
import { isTimatakaHostname, isTimatakaResultsPath, parseTimatakaUrl } from './timataka.js'
import { isWiclaxResultsPath, parseWiclaxUrl } from './wiclax.js'
import { parseRaceResultEmbedHash } from './raceresult.js'

export function detectPlatformFromUrl(url: string): ResultsPlatform | null {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.toLowerCase()
    if (hostname.includes('davengo.com')) return 'davengo'
    if (hostname.includes('sporthive.com')) return 'sporthive'
    if (hostname.includes('raceresult.com')) return 'myraceresult'
    if (hostname.includes('maxfunsports.com')) return 'maxfunsports'
    if (hostname.includes('myracepartner.com') && /ergebnisse/i.test(parsed.pathname)) {
      const normalized = new URL(normalizeMyRacePartnerUrl(url))
      const resultId =
        normalized.searchParams.get('result-id')?.trim() ??
        normalized.searchParams.get('result_id')?.trim()
      const eventId = normalized.searchParams.get('event-id')?.trim()
      if ((resultId && /^\d+$/.test(resultId)) || (eventId && /^\d+$/.test(eventId))) {
        return 'myracepartner'
      }
    }
    if (isSccEventsResultsPath(parsed.pathname)) return 'sccevents'
    if (hostname.includes('strassenlauf.org') && /va_ergebnisse\.php$/i.test(parsed.pathname)) {
      const eventId = parsed.searchParams.get('id')?.trim()
      if (eventId && /^\d+$/.test(eventId)) return 'strassenlauf'
    }
    if (hostname.includes('ziel-zeit.de') && /\/ergebnisse\//i.test(parsed.pathname) && /\.pdf$/i.test(parsed.pathname)) {
      return 'zielzeit'
    }
    if (hostname.includes('eqtiming.com') && /^\/\d+\/?$/.test(parsed.pathname)) {
      return 'eqtiming'
    }
    if (hostname.includes('nsf-la.de') && /\/ergebnisse\/index\.php$/i.test(parsed.pathname)) {
      return 'nsfberlin'
    }
    if (hostname.includes('runczech.com') && /^\/(en|cs)\/(results|vysledky-zavodu)\/[^/]+\/?$/i.test(parsed.pathname)) {
      return 'runczech'
    }
    if (hostname.includes('ultimate.dk')) {
      const eventId = parsed.searchParams.get('eventid')?.trim()
      if (eventId && /^\d+$/.test(eventId)) return 'ultimate'
    }
    if (hostname.includes('valenciaciudaddelrunning.com')) {
      if (hostname.startsWith('resultados.') && isVcRunningResultsPath(parsed.pathname)) {
        return 'vcrunning'
      }
      if (!hostname.startsWith('resultados.') && isVcRunningMarketingPath(parsed.pathname)) {
        return 'vcrunning'
      }
    }
    if (parseWiclaxUrl(url)) return 'wiclax'
    if (isWiclaxResultsPath(parsed.pathname)) return 'wiclax'
    if (parseTimatakaUrl(url)) return 'timataka'
    if (isTimatakaHostname(parsed.hostname) && isTimatakaResultsPath(parsed.pathname)) {
      return 'timataka'
    }
    if (parseMikaTimingUrl(url)) return 'mikatiming'
    if (isMikatimingHostname(parsed.hostname)) return 'mikatiming'
    if (isMikatimingCustomResultsUrl(parsed.hostname, parsed.pathname)) return 'mikatiming'
    if (parseRaceResultEmbedHash(url)) return 'myraceresult'
  } catch {
    return null
  }
  return null
}

export function detectPlatform(
  resultsUrl?: string,
  eventName?: string,
): ResultsPlatform | null {
  if (resultsUrl?.trim()) {
    const fromUrl = detectPlatformFromUrl(resultsUrl.trim())
    if (fromUrl) return fromUrl
  }
  if (eventName && isParkrunEventName(eventName)) return 'parkrun'
  return null
}
