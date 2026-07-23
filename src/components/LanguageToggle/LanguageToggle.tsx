import { useTranslation } from 'react-i18next'
import type { ContentLocale } from '../../i18n/locale'

type LanguageToggleProps = {
  locale: ContentLocale
  onChange: (locale: ContentLocale) => void
  ariaLabelKey: string
  labelKeyPrefix: 'changelog' | 'privacy' | 'timingDisclaimer'
}

function toggleClass(active: boolean): string {
  return [
    'rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
    active ? 'bg-primary text-white' : 'text-muted hover:bg-background hover:text-foreground',
  ].join(' ')
}

export function LanguageToggle({
  locale,
  onChange,
  ariaLabelKey,
  labelKeyPrefix,
}: LanguageToggleProps) {
  const { t } = useTranslation()
  const locales: ContentLocale[] = ['pt', 'en', 'es', 'de']

  return (
    <div className="mt-6 flex flex-wrap justify-end gap-2" role="group" aria-label={t(ariaLabelKey)}>
      {locales.map((value) => (
        <button
          key={value}
          type="button"
          className={toggleClass(locale === value)}
          aria-pressed={locale === value}
          onClick={() => onChange(value)}
        >
          {t(`${labelKeyPrefix}.language${value === 'pt' ? 'Pt' : value === 'en' ? 'En' : value === 'es' ? 'Es' : 'De'}`)}
        </button>
      ))}
    </div>
  )
}
