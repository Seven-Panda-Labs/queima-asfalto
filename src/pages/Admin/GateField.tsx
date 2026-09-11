import { useTranslation } from 'react-i18next'
import { joinGate, splitGate } from '../../../shared/raceCatalog'
import { DayField } from './DayField'

/**
 * When a registration window opens, closes or is drawn.
 *
 * A day, and an hour only when the organiser published one: of the gates in a
 * real catalog, 40 carry an hour and 23 do not, and inventing midnight for the
 * second kind would be inventing precision. The hour is the race's own, so
 * "opens at 11:00" is the organiser's clock and not the operator's, and it is
 * stored as the instant that names.
 *
 * Without a zone there is no instant to store, so the hour is not offered:
 * the race's country answers that for all but a few, and the form asks above
 * when it cannot.
 */
export function GateField({
  id,
  label,
  value,
  zone,
  onChange,
}: {
  id: string
  label: string
  /** An ISO day or an instant, as the catalog stores it. */
  value: string | undefined
  /** The race's zone, when it has one. */
  zone: string | undefined
  onChange: (value: string | undefined) => void
}) {
  const { t } = useTranslation()
  const parts = splitGate(value, zone)

  return (
    <div className="text-xs font-semibold text-muted">
      <label htmlFor={id}>{label}</label>
      <DayField
        id={id}
        value={parts?.day}
        onChange={(day) => onChange(day ? joinGate({ day, time: parts?.time }, zone) : undefined)}
      />
      {parts?.day ? (
        <div className="mt-1 flex items-center gap-2">
          <label className="sr-only" htmlFor={`${id}-time`}>
            {t('admin.catalogGateTime')}
          </label>
          <input
            id={`${id}-time`}
            type="time"
            value={parts.time ?? ''}
            disabled={!zone}
            onChange={(event) =>
              onChange(joinGate({ day: parts.day, time: event.target.value || undefined }, zone))
            }
            className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground disabled:opacity-50"
          />
          <span className="text-xs font-normal text-muted">
            {zone ? t('admin.catalogGateTimeZone', { zone }) : t('admin.catalogGateTimeNeedsZone')}
          </span>
        </div>
      ) : null}
    </div>
  )
}
