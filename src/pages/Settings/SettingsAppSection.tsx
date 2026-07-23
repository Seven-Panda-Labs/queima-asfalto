import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { applyLanguage, type AppLanguage } from '../../i18n'
import { normalizeAppLanguage } from '../../i18n/locale'
import { updateUserAppLanguage } from '../../services/users'
import { NotificationPrefsSection } from './NotificationPrefsSection'
import { ThemePreferenceButtons } from './ThemePreferenceButtons'

const LANGUAGE_BUTTONS: Array<{ code: AppLanguage; labelKey: string }> = [
  { code: 'pt', labelKey: 'common.languagePt' },
  { code: 'en', labelKey: 'common.languageEn' },
  { code: 'es', labelKey: 'common.languageEs' },
  { code: 'de', labelKey: 'common.languageDe' },
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
        <div className="mt-4 flex flex-wrap gap-3">
          {LANGUAGE_BUTTONS.map(({ code, labelKey }) => (
            <button
              key={code}
              type="button"
              onClick={() => void handleLanguageChange(code)}
              className={[
                'rounded-md border px-4 py-2 text-sm font-semibold transition-colors',
                currentLanguage === code
                  ? 'border-primary bg-primary text-white'
                  : 'border-border text-foreground hover:bg-background',
              ].join(' ')}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground">{t('settings.themeSection')}</h2>
        <p className="mt-2 text-sm text-muted">{t('settings.themeSubtitle')}</p>
        <ThemePreferenceButtons />
      </section>

      <NotificationPrefsSection />
    </div>
  )
}
