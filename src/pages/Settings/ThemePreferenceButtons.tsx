import { useTranslation } from 'react-i18next'
import { ViewSwitcher } from '../../components/ViewSwitcher'
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
    <div className="mt-4">
      <ViewSwitcher
        label={t('settings.themeSection')}
        value={preference}
        onChange={setPreference}
        options={THEME_OPTIONS.map(({ value, labelKey }) => ({
          value,
          label: t(labelKey),
        }))}
      />
    </div>
  )
}
