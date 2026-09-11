import { useTranslation } from 'react-i18next'
import { DatePicker } from '../../components/DatePicker/DatePicker'
import { parseDateInput, toDateInputValue } from '../../utils/date'

/**
 * A day, picked on the app's own calendar.
 *
 * Not `<input type="date">`: that one renders in the format of the operating
 * system, so a browser set to English shows 09/11/2026 for the 11th of
 * September to somebody reading the page in Portuguese. The app's picker
 * writes the date the way the app's own language writes it.
 *
 * Optional by nature here: an edition can be dated with no gates at all, and a
 * gate can be a date that was published and later withdrawn.
 */
export function DayField({
  id,
  value,
  onChange,
  hasError,
}: {
  id?: string
  /** ISO day, `YYYY-MM-DD`, or nothing. */
  value: string | undefined
  onChange: (day: string | undefined) => void
  hasError?: boolean
}) {
  const { t } = useTranslation()

  if (!value) {
    return (
      <button
        type="button"
        id={id}
        onClick={() => onChange(toDateInputValue(new Date()))}
        className="mt-1 w-full rounded-md border border-dashed border-border px-3 py-2 text-start text-sm text-muted hover:border-primary hover:text-primary"
      >
        {t('admin.catalogSetDate')}
      </button>
    )
  }

  return (
    <div className="mt-1 flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <DatePicker
          id={id}
          value={parseDateInput(value)}
          onChange={(date) => onChange(toDateInputValue(date))}
          hasError={hasError}
        />
      </div>
      <button
        type="button"
        onClick={() => onChange(undefined)}
        className="shrink-0 rounded-md border border-border px-2 py-2 text-xs font-semibold text-muted hover:text-foreground"
      >
        {t('common.remove')}
      </button>
    </div>
  )
}
