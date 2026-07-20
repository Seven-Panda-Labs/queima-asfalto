import { useTranslation } from 'react-i18next'
import { useTheme } from '../../contexts/ThemeContext'

const THEME_OPTIONS = [
  { value: 'system' as const, labelKey: 'settings.themeSystem' },
  { value: 'light' as const, labelKey: 'settings.themeLight' },
  { value: 'dark' as const, labelKey: 'settings.themeDark' },
]

export function ThemePreferenceButtons() {
  const { t } = useTranslation()
  const { preference, setPreference } = useTheme()

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {THEME_OPTIONS.map(({ value, labelKey }) => (
        <button
          key={value}
          type="button"
          onClick={() => setPreference(value)}
          className={[
            'rounded-md border px-4 py-2 text-sm font-semibold transition-colors',
            preference === value
              ? 'border-primary bg-primary text-white'
              : 'border-border text-foreground hover:bg-background',
          ].join(' ')}
        >
          {t(labelKey)}
        </button>
      ))}
    </div>
  )
}
