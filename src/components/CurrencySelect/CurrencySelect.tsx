import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Picks a currency by its name and stores its ISO 4217 code.
 *
 * The field was three free letters, which is three ways to be wrong: a fee of
 * 40 EURO, EU or eur is a fee nothing can print. What a price means is the
 * amount and the currency together, so the currency has to be as reliable as
 * the number beside it.
 *
 * The list is the browser's own (`Intl.supportedValuesOf`), named by
 * `Intl.DisplayNames` in the reader's language, so there is no table here to
 * keep up with. The code leads the label because that is what an operator is
 * reading off the organiser's page.
 */
export function CurrencySelect({
  id,
  value,
  onChange,
  className,
}: {
  id?: string
  /** An ISO 4217 code, or an empty string when no fee is recorded. */
  value: string
  onChange: (currency: string) => void
  className?: string
}) {
  const { t, i18n } = useTranslation()
  const options = useMemo(() => named(i18n.language), [i18n.language])

  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={className}
    >
      {/* Optional: an edition whose fee nobody has read has no currency. */}
      <option value="">{t('common.dash')}</option>
      {/* A code from before this list, so an entry never loses what it had. */}
      {value && !options.some((option) => option.code === value) ? (
        <option value={value}>{value}</option>
      ) : null}
      {options.map((option) => (
        <option key={option.code} value={option.code}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

function named(language: string): { code: string; label: string }[] {
  let codes: string[] = []
  try {
    codes = Intl.supportedValuesOf('currency')
  } catch {
    // An engine without the list leaves the field to whatever it already had.
    return []
  }

  let names: Intl.DisplayNames | null = null
  try {
    names = new Intl.DisplayNames([language], { type: 'currency' })
  } catch {
    names = null
  }

  return codes.map((code) => {
    const name = names?.of(code)
    return { code, label: name && name !== code ? `${code} · ${name}` : code }
  })
}
