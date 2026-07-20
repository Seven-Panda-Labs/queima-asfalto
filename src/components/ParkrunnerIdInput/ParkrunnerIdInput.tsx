import { useTranslation } from 'react-i18next'
import {
  formatParkrunnerId,
  parseParkrunnerIdDigits,
  PARKRUNNER_ID_DIGIT_COUNT,
} from '../../../shared/officialResults'

type ParkrunnerIdInputProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  hasError?: boolean
  className?: string
}

export function ParkrunnerIdInput({
  id,
  value,
  onChange,
  hasError = false,
  className = '',
}: ParkrunnerIdInputProps) {
  const { t } = useTranslation()
  const digits = parseParkrunnerIdDigits(value)

  return (
    <div className={className}>
      <div
        className={[
          'flex max-w-xs overflow-hidden rounded-md border bg-background',
          hasError ? 'border-danger' : 'border-border',
        ].join(' ')}
      >
        <span
          className="flex items-center border-r border-border bg-surface px-3 text-sm font-semibold text-foreground"
          aria-hidden
        >
          A
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={PARKRUNNER_ID_DIGIT_COUNT}
          value={digits}
          onChange={(event) => onChange(formatParkrunnerId(event.target.value))}
          placeholder={t('officialResults.parkrunnerIdDigitsPlaceholder')}
          aria-describedby={id ? `${id}-hint` : undefined}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-foreground"
        />
      </div>
      <p id={id ? `${id}-hint` : undefined} className="mt-2 text-xs text-muted">
        {t('officialResults.parkrunnerIdFormatHint')}
      </p>
    </div>
  )
}
