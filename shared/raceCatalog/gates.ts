/**
 * A registration gate, as a person edits it and as the catalog stores it.
 *
 * The three gates take an instant when the organiser publishes a time and a
 * plain day when only the day is known, and both shapes are real: of the 63
 * gate values in one instance, 40 carry an hour and 23 do not. Boston closes
 * at `2026-09-18T21:00:00Z`, which is 17:00 where the race is, and London
 * simply says `2026-04-24`.
 *
 * The form should not have to know that. It edits a day and, when there is
 * one, an hour in the race's own zone, and this turns that into what is
 * stored and back.
 */

/** A day, and the local hour when the organiser published one. */
export type GateParts = {
  /** ISO day, `YYYY-MM-DD`. */
  day: string
  /** `HH:MM` in the race's zone, or nothing when only the day is known. */
  time?: string
}

/** What a zone's clock is ahead of UTC at that instant, in minutes. */
export function zoneOffsetMinutes(zone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at)
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0)
  // Midnight comes back as 24 in some engines.
  const asUtc = Date.UTC(
    read('year'),
    read('month') - 1,
    read('day'),
    read('hour') % 24,
    read('minute'),
    read('second'),
  )
  return (asUtc - at.getTime()) / 60_000
}

/** The day and, when there is one, the hour the race's own clock reads. */
export function splitGate(
  value: string | undefined,
  zone: string | undefined,
): GateParts | undefined {
  if (!value) return undefined
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return { day: value }

  const at = new Date(value)
  if (Number.isNaN(at.getTime())) return undefined

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: zone ?? 'UTC',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).formatToParts(at)
    const read = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
    const hour = String(Number(read('hour')) % 24).padStart(2, '0')
    return {
      day: `${read('year')}-${read('month')}-${read('day')}`,
      time: `${hour}:${read('minute')}`,
    }
  } catch {
    return undefined
  }
}

/**
 * What the catalog stores for that day and hour.
 *
 * A day alone stays a day: inventing midnight would be inventing precision.
 * An hour is read in the race's zone and stored as the instant it names, so a
 * reminder can print "opens today at 11:00 JST" wherever the runner is.
 *
 * The offset is asked for twice because it can change between the guess and
 * the answer: an hour on the night the clocks move is an hour on both sides of
 * the boundary until the instant is known.
 */
export function joinGate(parts: GateParts, zone: string | undefined): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(parts.day)) return undefined
  if (!parts.time) return parts.day
  if (!/^\d{2}:\d{2}$/.test(parts.time)) return parts.day
  // An hour with no zone is an hour in nobody's day.
  if (!zone) return parts.day

  const naive = Date.parse(`${parts.day}T${parts.time}:00Z`)
  if (Number.isNaN(naive)) return parts.day

  try {
    let instant = naive - zoneOffsetMinutes(zone, new Date(naive)) * 60_000
    instant = naive - zoneOffsetMinutes(zone, new Date(instant)) * 60_000
    return new Date(instant).toISOString().replace('.000Z', 'Z')
  } catch {
    return parts.day
  }
}
