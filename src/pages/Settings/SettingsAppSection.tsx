import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { ViewSwitcher } from '../../components/ViewSwitcher'
import { applyLanguage, type AppLanguage } from '../../i18n'
import { normalizeAppLanguage } from '../../i18n/locale'
import { updateUserAppLanguage } from '../../services/users'
import { DisciplinesSection } from './DisciplinesSection'
import { NotificationPrefsSection } from './NotificationPrefsSection'
import { ThemePreferenceButtons } from './ThemePreferenceButtons'

const LANGUAGE_BUTTONS: Array<{ code: AppLanguage; labelKey: string }> = [
  { code: 'pt', labelKey: 'common.languagePt' },
  { code: 'en', labelKey: 'common.languageEn' },
  { code: 'es', labelKey: 'common.languageEs' },
  { code: 'de', labelKey: 'common.languageDe' },
  { code: 'fr', labelKey: 'common.languageFr' },
  { code: 'ar', labelKey: 'common.languageAr' },
]

export function SettingsAppSection() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const currentLanguage = normalizeAppLanguage(i18n.language)

  async function handleLanguageChange(language: AppLanguage) {
    await applyLanguage(language, user?.uid ?? null)
    if (user) {
      await updateUserAppLanguage(user.uid, language)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground">{t('settings.languageSection')}</h2>
        <p className="mt-2 text-sm text-muted">{t('settings.languageSubtitle')}</p>
        <div className="mt-4">
          <ViewSwitcher
            label={t('settings.languageSection')}
            value={currentLanguage}
            onChange={(code) => void handleLanguageChange(code)}
            options={LANGUAGE_BUTTONS.map(({ code, labelKey }) => ({
              value: code,
              label: t(labelKey),
            }))}
          />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground">{t('settings.themeSection')}</h2>
        <p className="mt-2 text-sm text-muted">{t('settings.themeSubtitle')}</p>
        <ThemePreferenceButtons />
      </section>

      <DisciplinesSection />

      <NotificationPrefsSection />
    </div>
  )
}
