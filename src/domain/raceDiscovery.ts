import type { RaceCatalogEdition, RaceCatalogEntry } from '../../shared/raceCatalog'
import { NOMINAL_DISTANCE_KM, type EventType } from './eventCodes'
import { tuneUpFit, type SeasonRace } from './seasonRules'

/** Every field optional, and blank means "any": this is a browse, not a form to fill. */
export type DiscoveryCriteria = {
  disciplines: EventType[]
  /** ISO 3166-1 alpha-2, or '' for anywhere. */
  country: string
  /** Free text over city and region. */
  place: string
  /** Inclusive ISO days, `YYYY-MM-DD`. */
  from: string
  to: string
}

export const EMPTY_CRITERIA: DiscoveryCriteria = {
  disciplines: [],
  country: '',
  place: '',
  from: '',
  to: '',
}

export type DiscoveryCandidate = {
  entry: RaceCatalogEntry
  /** The edition on offer: the soonest one still ahead. */
  edition: RaceCatalogEdition
  date: Date
  /** How this race sits against the anchor, when one was picked. */
  weeksBeforeAnchor?: number
  fitsAnchor?: boolean
}

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

function weeksBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / MS_PER_WEEK
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

/**
 * The edition a runner could still enter.
 *
 * An entry holds every edition anybody recorded, so the one to offer is the
 * soonest one that has not happened yet. A race with no dated edition is not a
 * candidate: "usually in September" cannot be ranked against a window.
 */
export function nextEdition(
  entry: RaceCatalogEntry,
  today: Date,
): RaceCatalogEdition | null {
  const upcoming = (entry.editions ?? [])
    .filter((edition) => edition.raceDate && new Date(edition.raceDate) >= today)
    .sort((left, right) => (left.raceDate! < right.raceDate! ? -1 : 1))
  return upcoming[0] ?? null
}

/**
 * Candidates for a loose set of criteria, best first.
 *
 * The interviews say this is not a free browse: the real query for a secondary
 * race is "fit a 10K into July as build-up, preferably without travelling". So
 * an anchor, when there is one, decides the order, and the criteria only decide
 * what is in the list at all.
 */
export function findCandidates(
  entries: readonly RaceCatalogEntry[],
  criteria: DiscoveryCriteria,
  options: { today?: Date; anchor?: SeasonRace } = {},
): DiscoveryCandidate[] {
  const today = options.today ?? new Date()
  const anchor = options.anchor
  const place = normalize(criteria.place)

  const candidates: DiscoveryCandidate[] = []

  for (const entry of entries) {
    if (entry.retired === true) continue

    const edition = nextEdition(entry, today)
    if (!edition?.raceDate) continue

    if (criteria.from && edition.raceDate < criteria.from) continue
    if (criteria.to && edition.raceDate > criteria.to) continue
    if (criteria.country && entry.country.toUpperCase() !== criteria.country.toUpperCase()) continue
    if (place && !normalize(`${entry.city} ${entry.name}`).includes(place)) continue
    if (
      criteria.disciplines.length > 0 &&
      !entry.disciplines.some((discipline) => criteria.disciplines.includes(discipline))
    ) {
      continue
    }

    const date = new Date(edition.raceDate)
    const candidate: DiscoveryCandidate = { entry, edition, date }

    if (anchor) {
      // A multi distance event is a candidate if any of its distances works as
      // a tune-up for this anchor, which is the question the runner is asking.
      const fits = entry.disciplines.map((discipline) =>
        tuneUpFit(anchor, { date, distanceKm: NOMINAL_DISTANCE_KM[discipline] }),
      )
      candidate.weeksBeforeAnchor = fits[0]?.weeksBefore ?? weeksBetween(date, anchor.date)
      candidate.fitsAnchor = fits.some((fit) => fit.fits)
    }

    candidates.push(candidate)
  }

  return candidates.sort((left, right) => {
    if (anchor) {
      // The ones in the window first, then whatever is closest to it.
      if (left.fitsAnchor !== right.fitsAnchor) return left.fitsAnchor ? -1 : 1
      const distance = (weeks: number | undefined) => Math.abs((weeks ?? 0) - 3.5)
      const gap = distance(left.weeksBeforeAnchor) - distance(right.weeksBeforeAnchor)
      if (Math.abs(gap) > 0.01) return gap
    }
    return left.date.getTime() - right.date.getTime()
  })
}
