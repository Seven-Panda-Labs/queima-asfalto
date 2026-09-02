/**
 * What the app knows about arranging a season, and no more than that.
 *
 * Not a training plan: no sessions, no load, no weekly volume. A handful of rules
 * that came out of the interviews, written down so discovery can rank a candidate
 * and the calendar can say when something looks off. The list is curated and
 * grows by PR, which is the whole reason it is a module and not a condition
 * buried in a component.
 */

/** What a race that is not an anchor is for. An anchor is `isAnchor`, not a role. */
export const RACE_ROLES = ['build_up', 'test', 'none'] as const

export type RaceRole = (typeof RACE_ROLES)[number]

export function isRaceRole(value: string): value is RaceRole {
  return (RACE_ROLES as readonly string[]).includes(value)
}

export type SeasonRace = {
  id: string
  name: string
  date: Date
  distanceKm: number
  isAnchor: boolean
  role?: RaceRole
  /** The anchor this race is preparing for. */
  servesRaceId?: string
  /** The race was run, or should have been, and produced no result. */
  failed?: boolean
}

export const SEASON_RULES = [
  'tune_up_window',
  'taper_clash',
  'crowded_month',
  'anchor_failed',
] as const

export type SeasonRuleId = (typeof SEASON_RULES)[number]

export type SeasonWarning = {
  rule: SeasonRuleId
  /** The race the warning is about. */
  raceId: string
  /** The anchor it relates to, when the rule is about one. */
  anchorId?: string
  /** Filled in for `crowded_month`, so the copy can say how many. */
  count?: number
}

/**
 * The classic tune-up: about half the anchor's distance, three to four weeks out.
 *
 * Three weeks is the earliest that still leaves a taper; four is the latest that
 * still says anything about race fitness. Half the distance is the shape of the
 * thing, not a measurement, so the band is generous.
 */
export const TUNE_UP_WEEKS = { min: 3, max: 4 } as const
export const TUNE_UP_DISTANCE_RATIO = { min: 0.35, max: 0.65 } as const

/** Nothing but the taper in the last fortnight. */
export const TAPER_DAYS = 14

/** More than this in one month and something has to give. */
export const MAX_RACES_PER_MONTH = 2

const DAY = 24 * 60 * 60 * 1000

function daysBetween(from: Date, to: Date): number {
  const start = (value: Date) =>
    Date.UTC(value.getFullYear(), value.getMonth(), value.getDate())
  return Math.round((start(to) - start(from)) / DAY)
}

export type TuneUpWindow = {
  from: Date
  to: Date
  /** The distance a tune-up for this anchor would sensibly be. */
  targetDistanceKm: number
}

/**
 * When and how long a tune-up for this anchor would be.
 *
 * This is the output discovery needs: "a 10K in July, near home" is a query with
 * a window and a distance in it, and both come from the anchor's own date and
 * distance rather than from the runner guessing.
 */
export function tuneUpWindowFor(anchor: SeasonRace): TuneUpWindow {
  return {
    from: new Date(anchor.date.getTime() - TUNE_UP_WEEKS.max * 7 * DAY),
    to: new Date(anchor.date.getTime() - TUNE_UP_WEEKS.min * 7 * DAY),
    targetDistanceKm: Math.round(anchor.distanceKm / 2),
  }
}

/**
 * Where a race sits in the season, out of every attempt at it.
 *
 * The next attempt if there is one, and otherwise the last one that happened. A
 * race whose only date is in the past still belongs in the season: an anchor
 * that was run and failed is what flags everything that was serving it.
 */
export function seasonDate(dates: readonly Date[], today: Date = new Date()): Date | undefined {
  const sorted = [...dates].sort((left, right) => left.getTime() - right.getTime())
  return sorted.find((date) => date.getTime() >= today.getTime()) ?? sorted[sorted.length - 1]
}

export type TuneUpFit = {
  fits: boolean
  weeksBefore: number
  /** The candidate's distance as a fraction of the anchor's. */
  distanceRatio: number
}

/** How well one race works as a tune-up for an anchor. */
export function tuneUpFit(anchor: SeasonRace, candidate: { date: Date; distanceKm: number }): TuneUpFit {
  const days = daysBetween(candidate.date, anchor.date)
  const weeksBefore = days / 7
  const distanceRatio =
    anchor.distanceKm > 0 ? candidate.distanceKm / anchor.distanceKm : 0

  return {
    fits:
      weeksBefore >= TUNE_UP_WEEKS.min &&
      weeksBefore <= TUNE_UP_WEEKS.max &&
      distanceRatio >= TUNE_UP_DISTANCE_RATIO.min &&
      distanceRatio <= TUNE_UP_DISTANCE_RATIO.max,
    weeksBefore,
    distanceRatio,
  }
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}`
}

/**
 * What looks off about a season, from the rules above.
 *
 * Warnings, never blocks. The runner knows things the app does not: a race in the
 * taper week might be a parkrun with the kids, and telling somebody they cannot
 * enter it would be the app overstepping.
 */
export function seasonWarnings(races: readonly SeasonRace[], today: Date = new Date()): SeasonWarning[] {
  const warnings: SeasonWarning[] = []
  const upcoming = races.filter((race) => race.date.getTime() >= today.getTime())
  const anchors = upcoming.filter((race) => race.isAnchor)

  for (const anchor of anchors) {
    for (const race of upcoming) {
      if (race.id === anchor.id) continue

      const days = daysBetween(race.date, anchor.date)
      if (days > 0 && days <= TAPER_DAYS) {
        warnings.push({ rule: 'taper_clash', raceId: race.id, anchorId: anchor.id })
        continue
      }

      // A race declared as a tune-up for this anchor, sitting outside the window
      // where a tune-up does its job.
      if (race.servesRaceId === anchor.id && !tuneUpFit(anchor, race).fits) {
        warnings.push({ rule: 'tune_up_window', raceId: race.id, anchorId: anchor.id })
      }
    }
  }

  // An anchor that failed is in the past, so this rule reads every race rather
  // than only the upcoming ones. A failure degrades one race and not the season:
  // the races that were serving it are flagged, never cancelled, and the runner
  // decides whether they still make sense.
  const failedAnchors = new Set(
    races.filter((race) => race.isAnchor && race.failed).map((race) => race.id),
  )
  for (const race of upcoming) {
    if (race.servesRaceId && failedAnchors.has(race.servesRaceId)) {
      warnings.push({
        rule: 'anchor_failed',
        raceId: race.id,
        anchorId: race.servesRaceId,
      })
    }
  }

  const byMonth = new Map<string, SeasonRace[]>()
  for (const race of upcoming) {
    const key = monthKey(race.date)
    byMonth.set(key, [...(byMonth.get(key) ?? []), race])
  }
  for (const month of byMonth.values()) {
    if (month.length <= MAX_RACES_PER_MONTH) continue
    // The last one in is the one to question, so the warning lands on the race
    // that made the month crowded rather than on all of them.
    const sorted = [...month].sort((left, right) => left.date.getTime() - right.date.getTime())
    for (const race of sorted.slice(MAX_RACES_PER_MONTH)) {
      warnings.push({ rule: 'crowded_month', raceId: race.id, count: month.length })
    }
  }

  return warnings
}

/** The races declared as serving this anchor, soonest first. */
export function racesServing(anchorId: string, races: readonly SeasonRace[]): SeasonRace[] {
  return races
    .filter((race) => race.servesRaceId === anchorId)
    .sort((left, right) => left.date.getTime() - right.date.getTime())
}
