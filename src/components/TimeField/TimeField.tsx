import { useTranslation } from 'react-i18next'

const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, '0'))

/**
 * An hour of the day, on the 24-hour clock.
 *
 * Not `<input type="time">`: like the date input, it renders in the format of
 * the operating system, so a browser set to English shows 05:30 PM to somebody
 * reading the page in Portuguese.
 *
 * With `optional`, the hour list starts with a dash that clears the value.
 */
export function TimeField({
  id,
  value,
  onChange,
  optional = false,
  disabled = false,
  className = '',
}: {
  /** Goes on the hour, so a `<label htmlFor>` names the field. */
  id?: string
  /** `HH:MM`, or nothing. */
  value: string | undefined
  onChange: (time: string | undefined) => void
  optional?: boolean
  disabled?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  const [hour = '', minute = '00'] = value ? value.split(':') : []
  const select = `rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground disabled:opacity-50 ${className}`

  return (
    <span className="inline-flex items-center gap-1" dir="ltr">
      <select
        id={id}
        value={hour}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value ? `${event.target.value}:${minute}` : undefined)
        }
        className={select}
      >
        {optional || !hour ? <option value="">{t('common.dash')}</option> : null}
        {HOURS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span aria-hidden>:</span>
      <select
        aria-label={t('timeField.minute')}
        value={minute}
        disabled={disabled || !hour}
        onChange={(event) => onChange(`${hour}:${event.target.value}`)}
        className={select}
      >
        {MINUTES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </span>
  )
}
