import { Navigate } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { PageShell } from '../../components/PageShell/PageShell'
import { isPrivacyPolicyEnabled } from '../../config/privacyPolicy'
import {
  getPrivacyPolicyMarkdown,
  resolvePrivacyPolicyLocale,
  type PrivacyPolicyLocale,
} from '../../content/privacyPolicy'

function localeToggleClass(active: boolean): string {
  return [
    'rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
    active ? 'bg-primary text-white' : 'text-muted hover:bg-background hover:text-foreground',
  ].join(' ')
}

export function PrivacyPolicy() {
  const { t, i18n } = useTranslation()
  const [locale, setLocale] = useState<PrivacyPolicyLocale>(() =>
    resolvePrivacyPolicyLocale(i18n.language),
  )

  if (!isPrivacyPolicyEnabled()) {
    return <Navigate to="/" replace />
  }

  return (
    <PageShell title={t('privacy.title')} description={t('privacy.subtitle')}>
      <div className="mt-6 flex justify-end gap-2" role="group" aria-label={t('privacy.languageToggle')}>
        <button
          type="button"
          className={localeToggleClass(locale === 'pt')}
          aria-pressed={locale === 'pt'}
          onClick={() => setLocale('pt')}
        >
          {t('privacy.languagePt')}
        </button>
        <button
          type="button"
          className={localeToggleClass(locale === 'en')}
          aria-pressed={locale === 'en'}
          onClick={() => setLocale('en')}
        >
          {t('privacy.languageEn')}
        </button>
      </div>

      <article className="changelog mt-6 rounded-lg border border-border bg-surface p-6">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
          }}
        >
          {getPrivacyPolicyMarkdown(locale)}
        </ReactMarkdown>
      </article>
    </PageShell>
  )
}
