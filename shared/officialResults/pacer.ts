import type { UserResultsProfile } from './types.js'

export type PacerUrlParts = {
  eventId: string
  raceId: string
  pageUrl: string
  origin: string
  apiUrl: string
}

/** What the race says about how it ranks. The site reads these, so we read them too. */
export type PacerRace = {
  name?: string
  distance?: string
  measurement?: string
  showRankings?: boolean
  chipTimeDisplay?: boolean
  gunTimeDisplay?: boolean
  overallTimingPreference?: string
  genderTimingPreference?: string
  categoryTimingPreference?: string
}

export type PacerChipTime = {
  firstName?: string | null
  lastName?: string | null
  participantBibNumber?: string | null
  bibNumber?: number | null
  gender?: string | null
  category?: string | null
  club?: string | null
  chipSeconds?: number | null
  gunSeconds?: number | null
}

export type PacerResultsPayload = {
  event?: { name?: string }
  race?: PacerRace
  chipTimes?: Record<string, PacerChipTime>
}

export type PacerRankedResult = {
  participantId: string
  name: string
  bibNumber: string
  position: number
  chipTimeMs: number
  gunTimeMs: number
}

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
const RESULTS_PATH = new RegExp(`^/results/(${UUID})/(${UUID})/?$`, 'i')

export function isPacerHostname(hostname: string): boolean {
  return hostname.toLowerCase().endsWith('poweredbypacer.com')
}

export function parsePacerUrl(url: string): PacerUrlParts | null {
  try {
    const parsed = new URL(url.trim())
    if (!isPacerHostname(parsed.hostname)) return null

    const match = RESULTS_PATH.exec(parsed.pathname)
    if (!match?.[1] || !match[2]) return null

    const eventId = match[1].toLowerCase()
    const raceId = match[2].toLowerCase()
    return {
      eventId,
      raceId,
      pageUrl: parsed.toString(),
      origin: parsed.origin,
      apiUrl: `${parsed.origin}/api/public/events/${eventId}/races/${raceId}`,
    }
  } catch {
    return null
  }
}

/**
 * Whole seconds, rounded up.
 *
 * Pacer stores fractional seconds and its results table ceils them, so
 * 1:00:17.483 is published as 1:00:18. Truncating would disagree with the page
 * on roughly every runner.
 */
export function formatPacerTime(milliseconds: number): string {
  const total = Math.ceil(milliseconds / 1000)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

type TimingPreference = 'gun' | 'chip'

/** The race picks which clock decides the order, and a race ranked on the gun is not ranked on the chip. */
export function pacerOverallPreference(race: PacerRace | undefined): TimingPreference {
  const stated = race?.overallTimingPreference ?? race?.genderTimingPreference
  return stated === 'gun' ? 'gun' : 'chip'
}

function rankingTimeMs(result: PacerRankedResult, preference: TimingPreference): number {
  return preference === 'gun' ? result.gunTimeMs : result.chipTimeMs
}

function toMilliseconds(seconds: number | null | undefined): number {
  return typeof seconds === 'number' && Number.isFinite(seconds) ? Math.round(seconds * 1000) : 0
}

/**
 * The finishers in the order the results table shows them.
 *
 * Pacer publishes no placing of its own: the page ranks the field in the
 * browser, so reproducing a runner's place means reproducing that rule. Ties
 * break on the participant id, which is the key the payload is already keyed
 * by, so the order is the same one every reader sees.
 */
export function rankPacerResults(payload: PacerResultsPayload): PacerRankedResult[] {
  const preference = pacerOverallPreference(payload.race)
  const entries = Object.entries(payload.chipTimes ?? {})

  const results: PacerRankedResult[] = entries.map(([participantId, row]) => ({
    participantId,
    name: [row.firstName, row.lastName].filter(Boolean).join(' ').trim(),
    bibNumber: (row.participantBibNumber ?? '').toString().trim(),
    position: 0,
    chipTimeMs: toMilliseconds(row.chipSeconds),
    gunTimeMs: toMilliseconds(row.gunSeconds),
  }))

  // Ranked on the gun, a runner with no gun time is not in the standings at all.
  const ranked =
    preference === 'gun' ? results.filter((result) => result.gunTimeMs > 0) : results

  ranked.sort((left, right) => {
    const leftTime = rankingTimeMs(left, preference)
    const rightTime = rankingTimeMs(right, preference)
    const leftFinished = leftTime > 0
    const rightFinished = rightTime > 0

    if (!leftFinished && !rightFinished) {
      return left.participantId.localeCompare(right.participantId)
    }
    if (!leftFinished) return 1
    if (!rightFinished) return -1
    if (leftTime !== rightTime) return leftTime - rightTime
    return left.participantId.localeCompare(right.participantId)
  })

  return ranked.map((result, index) => ({ ...result, position: index + 1 }))
}

/** The time to record: the chip, unless the race publishes only the gun. */
export function pacerFinishTimeMs(
  result: PacerRankedResult,
  race: PacerRace | undefined,
): number {
  if (race?.chipTimeDisplay === false) return result.gunTimeMs || result.chipTimeMs
  return result.chipTimeMs || result.gunTimeMs
}

export function buildPacerSearchName(profile: UserResultsProfile): string | null {
  const first = profile.resultFirstName?.trim()
  const last = profile.resultLastName?.trim()
  const full = [first, last].filter(Boolean).join(' ')
  return full.length >= 2 ? full : null
}
