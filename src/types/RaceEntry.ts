import type { EventType } from './Event'

/** How a place in the race is obtained. The scarce thing, not the race itself. */
export const ENTRY_METHODS = [
  'lottery',
  'first_come',
  'qualifying',
  'charity',
  'invite',
  'unknown',
] as const

export type EntryMethod = (typeof ENTRY_METHODS)[number]

/**
 * Where one attempt at getting in has reached.
 *
 * `accepted` and `registered` are not the same thing, and the difference is the
 * whole point of the funnel: a drawn runner who never pays loses the place they
 * won.
 */
export const ENTRY_STATUSES = [
  'watching',
  'applied',
  'accepted',
  'registered',
  'rejected',
  'declined',
  'missed',
] as const

export type EntryStatus = (typeof ENTRY_STATUSES)[number]

export type EntryChecklistItem = {
  label: string
  done: boolean
}

/**
 * One year's attempt at getting into one race.
 *
 * The race is the identity (`races/{raceId}`, from #249) and this is what happens
 * around it in a given year: when the gate opens, when it closes, whether the
 * draw went your way, and what it cost. A race the runner simply wants and knows
 * nothing else about has no entry at all, which is what makes a wish a wish.
 */
export type RaceEntry = {
  id: string
  userId: string
  /** The race this is an attempt at. */
  raceId: string
  /** The wish it came from, when there was one. */
  bucketListItemId?: string
  year: number
  /** Which distance this attempt is for, when the race offers several. */
  discipline?: EventType
  raceDate?: Date
  /** False while the date is a guess from the catalog's typical month. */
  raceDateConfirmed: boolean
  entryMethod: EntryMethod
  entryStatus: EntryStatus
  registrationOpensAt?: Date
  /** IANA zone, so a reminder can print the local opening time. */
  registrationOpensTimezone?: string
  /** The last moment a place can still be taken. */
  registrationClosesAt?: Date
  lotteryDrawAt?: Date
  /**
   * The deadline to secure a place already won.
   *
   * Not the application deadline: London gives drawn runners until a date in
   * July, Valencia gives them twelve days, and missing it loses a place that was
   * already yours. Without this date the `accepted` group would say "act" with
   * no answer to "by when".
   */
  placeConfirmByAt?: Date
  registrationUrl?: string
  fee?: number
  feeCurrency?: string
  checklist?: EntryChecklistItem[]
  /** The previous year's entry, which keeps a rollover from happening twice. */
  rolledOverFrom?: string
  /** Set when the entry became a calendar event. */
  eventId?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export type RaceEntryCreate = {
  raceId: string
  bucketListItemId?: string
  year: number
  discipline?: EventType
  raceDate?: Date
  raceDateConfirmed?: boolean
  entryMethod: EntryMethod
  entryStatus: EntryStatus
  registrationOpensAt?: Date
  registrationOpensTimezone?: string
  registrationClosesAt?: Date
  lotteryDrawAt?: Date
  placeConfirmByAt?: Date
  registrationUrl?: string
  fee?: number
  feeCurrency?: string
  checklist?: EntryChecklistItem[]
  rolledOverFrom?: string
  eventId?: string
  notes?: string
}

export function isEntryMethod(value: string): value is EntryMethod {
  return (ENTRY_METHODS as readonly string[]).includes(value)
}

export function isEntryStatus(value: string): value is EntryStatus {
  return (ENTRY_STATUSES as readonly string[]).includes(value)
}
