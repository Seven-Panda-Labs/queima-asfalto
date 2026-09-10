import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Picks an IANA time zone from a list, grouped by region.
 *
 * The field used to be free text asking for the IANA name, and this one is
 * worse than a country typed wrong: nothing here shows the value again. The
 * zone is what turns a deadline into a local hour, so "Europe/Lisboa" or
 * "WEST" is a reminder that fires at the wrong time, or not at all, and the
 * entry looks correct while it happens.
 *
 * The list is the browser's own (`Intl.supportedValuesOf`), so there is no
 * table of zones to keep up with the ones that get added or renamed. The
 * current offset is on every option because that is what an operator checks
 * against: Atlantic/Azores and Europe/Lisbon are one hour apart and the names
 * do not say so.
 */
export function TimezoneSelect({
  id,
  value,
  onChange,
  className,
}: {
  id?: string
  /** An IANA name, or an empty string for a zone nobody has said yet. */
  value: string
  onChange: (zone: string) => void
  className?: string
}) {
  const { t } = useTranslation()
  const regions = useMemo(byRegion, [])

  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={className}
    >
      {/* The zone is optional: an edition can be dated with nobody having said
          which clock the deadline is on. */}
      <option value="">{t('common.dash')}</option>
      {/* A zone the browser does not know, from an older harvest, would leave
          the select showing something it is not. */}
      {value && !regions.some((region) => region.zones.some((zone) => zone.id === value)) ? (
        <option value={value}>{value}</option>
      ) : null}
      {regions.map((region) => (
        <optgroup key={region.name} label={region.name}>
          {region.zones.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}

/** "America/Argentina/Buenos_Aires" reads as "Argentina / Buenos Aires". */
function placeOf(zone: string): string {
  return zone.split('/').slice(1).join(' / ').replace(/_/g, ' ')
}

/** The zone's offset right now, which is what tells two neighbours apart. */
function offsetOf(zone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: zone,
      timeZoneName: 'longOffset',
    }).formatToParts(new Date())
    const name = parts.find((part) => part.type === 'timeZoneName')?.value ?? ''
    // Plain "GMT" is the zero offset, which reads better spelled out.
    return name === 'GMT' ? 'UTC+00:00' : name.replace('GMT', 'UTC')
  } catch {
    return ''
  }
}

/**
 * The zones the browser knows, under the region they are named after.
 *
 * Four hundred zones in one list is a scroll; under Europe, Africa and the
 * rest it is a dozen each. Computed once: it costs four hundred formatters,
 * around twenty milliseconds, and the offsets only move twice a year.
 */
function byRegion(): { name: string; zones: { id: string; label: string }[] }[] {
  let zones: string[] = []
  try {
    zones = Intl.supportedValuesOf('timeZone')
  } catch {
    // An engine without the list leaves the field to the fallback option
    // above, which keeps whatever the entry already had.
    return []
  }

  const grouped = new Map<string, { id: string; label: string }[]>()
  for (const zone of zones) {
    const region = zone.split('/')[0] ?? zone
    const label = `${placeOf(zone) || zone} · ${offsetOf(zone)}`
    grouped.set(region, [...(grouped.get(region) ?? []), { id: zone, label }])
  }

  return [...grouped]
    .map(([name, list]) => ({ name, zones: list }))
    .sort((left, right) => left.name.localeCompare(right.name))
}
