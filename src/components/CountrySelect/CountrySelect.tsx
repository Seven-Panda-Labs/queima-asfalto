import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ISO_COUNTRIES } from '../../../shared/eventDiscovery/countries'

/**
 * Picks a country by its name and stores its ISO code.
 *
 * The catalog stores two letters, and the field used to ask for them: nobody
 * remembers that Slovenia is SI and Slovakia SK, and a country typed wrong is
 * not a typo the entry recovers from. The country is the first thing the
 * duplicate rule compares, so a race filed under the wrong one can never merge
 * with its own other listing.
 *
 * The names come from `Intl.DisplayNames` in the reader's language, the same
 * way the discovery filter names them, so the list reads as Portuguese to a
 * Portuguese operator and there is no list of names to translate.
 */
export function CountrySelect({
  id,
  value,
  onChange,
  className,
}: {
  id?: string
  /** An ISO 3166-1 alpha-2 code, or an empty string for nothing chosen yet. */
  value: string
  onChange: (iso: string) => void
  className?: string
}) {
  const { t, i18n } = useTranslation()

  // Two hundred and fifty names through a collator, and the language only
  // changes when the reader changes it.
  const options = useMemo(() => byName(i18n.language), [i18n.language])

  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={className}
    >
      <option value="">{t('common.pickCountry')}</option>
      {options.map(({ code, name }) => (
        <option key={code} value={code}>
          {name}
        </option>
      ))}
    </select>
  )
}

/** The country's own name in the reader's language, with the code as a fallback. */
function countryName(code: string, language: string): string {
  try {
    return new Intl.DisplayNames([language], { type: 'region' }).of(code) ?? code
  } catch {
    return code
  }
}

/**
 * The countries in the order a reader can follow: by the name on screen.
 *
 * Sorting by code would read as no order at all, since the code is the part
 * nobody sees. The collator is what puts Áustria under A and Suíça under S.
 */
function byName(language: string): { code: string; name: string }[] {
  const collator = new Intl.Collator(language, { sensitivity: 'base' })
  return ISO_COUNTRIES.map((code) => ({ code, name: countryName(code, language) })).sort(
    (left, right) => collator.compare(left.name, right.name),
  )
}
