import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { applyLanguage, type AppLanguage } from '../../i18n'
import { updateUserAppLanguage } from '../../services/users'
import { NotificationPrefsSection } from './NotificationPrefsSection'
import { ThemePreferenceButtons } from './ThemePreferenceButtons'

export function SettingsAppSection() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const currentLanguage = (i18n.language === 'en' ? 'en' : 'pt') as AppLanguage

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
          <button
            type="button"
            onClick={() => void handleLanguageChange('pt')}
            className={[
              'rounded-md border px-4 py-2 text-sm font-semibold transition-colors',
              currentLanguage === 'pt'
                ? 'border-primary bg-primary text-white'
                : 'border-border text-foreground hover:bg-background',
            ].join(' ')}
          >
            {t('common.languagePt')}
          </button>
          <button
            type="button"
            onClick={() => void handleLanguageChange('en')}
            className={[
              'rounded-md border px-4 py-2 text-sm font-semibold transition-colors',
              currentLanguage === 'en'
                ? 'border-primary bg-primary text-white'
                : 'border-border text-foreground hover:bg-background',
            ].join(' ')}
          >
            {t('common.languageEn')}
          </button>
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
