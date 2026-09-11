/**
 * The zone a race runs in, asked of the platform rather than of an operator.
 *
 * The field was on every edition and repeated for each one, and it earns its
 * keep in exactly one place: a deadline reminder firing on the day prints the
 * organiser's own hour, because a window that opens at 11:00 in Tokyo opens at
 * 03:00 in Lisbon. Measured on a real instance, 37 editions of 5327 carried a
 * zone and only 4 of them also had a gate with an hour in it.
 *
 * A zone is a property of the place, so the country usually answers. Where it
 * cannot, the answer is a short list rather than a text field: Portugal is
 * three zones and the United States twenty-nine, and either is a list a person
 * reads in a second.
 */

/** The zones a country spans, or nothing on an engine that cannot say. */
export function zonesForCountry(country: string | undefined): string[] {
  if (!country || !/^[A-Za-z]{2}$/.test(country)) return []
  try {
    const locale = new Intl.Locale(`und-${country.toUpperCase()}`) as Intl.Locale & {
      getTimeZones?: () => string[] | undefined
      timeZones?: string[]
    }
    return [...(locale.getTimeZones?.() ?? locale.timeZones ?? [])]
  } catch {
    return []
  }
}

/** What a zone's clock reads right now, so two of them can be compared. */
function offsetOf(zone: string, now: Date): string | null {
  try {
    return (
      new Intl.DateTimeFormat('en', { timeZone: zone, timeZoneName: 'longOffset' })
        .formatToParts(now)
        .find((part) => part.type === 'timeZoneName')?.value ?? null
    )
  } catch {
    return null
  }
}

/**
 * The country's zone, when the country has one to give.
 *
 * Two cases count as one answer. A country with a single zone is the obvious
 * one, and a country whose zones are all on the same clock is the same answer
 * wearing several names: Germany is `Europe/Berlin` and `Europe/Busingen`, and
 * a reminder cannot tell them apart.
 *
 * Everything else returns nothing, which is the honest answer and the one that
 * makes the form ask: the platform lists a country's zones alphabetically, so
 * taking the first would file a race in Lisbon under the Azores.
 */
export function timezoneFor(country: string | undefined, now = new Date()): string | undefined {
  const zones = zonesForCountry(country)
  if (zones.length === 0) return undefined
  if (zones.length === 1) return zones[0]

  const offsets = new Set(zones.map((zone) => offsetOf(zone, now)))
  if (offsets.size === 1 && !offsets.has(null)) return zones[0]
  return undefined
}

/**
 * The zone a race's deadlines are published in.
 *
 * The edition's own comes first, because an entry from before this was asked
 * about every year and somebody may have corrected one; then what the entry
 * says; then what the country says.
 */
export function raceTimezone(
  race: { country?: string; timezone?: string },
  edition?: { timezone?: string },
): string | undefined {
  return edition?.timezone ?? race.timezone ?? timezoneFor(race.country)
}
