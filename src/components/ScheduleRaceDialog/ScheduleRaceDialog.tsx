import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DayField } from '../DatePicker'
import { formatEventTypeLabel } from '../../i18n/formatters'
import type { EntryPrefill } from '../../domain/entryPrefill'
import type { BucketListItem } from '../../types/BucketListItem'
import type { EventType } from '../../types/Event'

type ScheduleRaceDialogProps = {
  open: boolean
  item: BucketListItem | null
  /** What the race is run over, from the catalog entry behind the wish. */
  disciplines: readonly EventType[]
  /** What the catalog knows about the next running, when the race is one it holds. */
  offer: EntryPrefill | null
  loading?: boolean
  saving?: boolean
  onCancel: () => void
  onConfirm: (eventType: EventType, day: string) => void
}

/**
 * Putting a wish in the calendar, in one step.
 *
 * It used to be two screens: a dialog for the distance and then the whole
 * event form, which opened on today's date even when the catalog held the
 * edition. Everything the form asked for is already on the wish except the
 * distance, when there is a choice, and the day.
 *
 * The day is never invented. The catalog's is offered when it has one, said to
 * be the catalog's, and an entry nobody checked stays a suggestion the runner
 * confirms. With no date there is no event: a race whose next edition has not
 * been published stays a wish.
 */
export function ScheduleRaceDialog({
  open,
  item,
  disciplines,
  offer,
  loading,
  saving,
  onCancel,
  onConfirm,
}: ScheduleRaceDialogProps) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<EventType | null>(null)
  const [day, setDay] = useState<string | undefined>(undefined)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!open || !item) return
    setSelected(disciplines[0] ?? null)
    setError(false)
  }, [open, item, disciplines])

  // Separately, because the catalog is read after the dialog opens: setting the
  // day with the rest would set it to nothing.
  useEffect(() => {
    if (open) setDay(offer?.raceDate)
  }, [open, offer])

  if (!open || !item) return null

  const confirm = () => {
    if (!selected || !day) {
      setError(!day)
      return
    }
    onConfirm(selected, day)
  }

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-foreground/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-race-title"
        className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-lg"
      >
        <h2 id="schedule-race-title" className="text-lg font-semibold text-foreground">
          {t('bucketList.scheduleTitle')}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {t('bucketList.scheduleMessage', { name: item.name })}
        </p>

        {disciplines.length > 1 ? (
          <fieldset className="mt-4 space-y-2">
            <legend className="sr-only">{t('bucketList.scheduleDiscipline')}</legend>
            {disciplines.map((discipline) => (
              <label
                key={discipline}
                className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2 hover:bg-background"
              >
                <input
                  type="radio"
                  name="schedule-discipline"
                  value={discipline}
                  checked={selected === discipline}
                  onChange={() => setSelected(discipline)}
                  className="size-4 accent-primary"
                />
                <span className="text-sm font-semibold text-foreground">
                  {formatEventTypeLabel(discipline)}
                </span>
              </label>
            ))}
          </fieldset>
        ) : null}

        <div className="mt-4">
          <label htmlFor="schedule-race-day" className="block text-sm font-semibold text-foreground">
            {t('entry.raceDate')}
          </label>
          {loading ? (
            <p className="mt-1 text-xs text-muted">{t('common.loading')}</p>
          ) : (
            <DayField
              id="schedule-race-day"
              value={day}
              onChange={(next) => {
                setDay(next)
                setError(false)
              }}
              hasError={error}
            />
          )}
          {offer?.raceDate ? (
            <p className="mt-1 text-xs text-muted">
              {t(offer.assertable ? 'entry.prefilledReviewed' : 'entry.prefilled', {
                source: offer.source,
              })}
            </p>
          ) : null}
          {error ? (
            <p className="mt-1 text-xs text-danger">{t('bucketList.scheduleNeedsDate')}</p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted hover:text-foreground"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            disabled={!selected || saving}
            onClick={confirm}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {t('common.schedule')}
          </button>
        </div>
      </div>
    </div>
  )
}
