import { Navigate } from 'react-router-dom'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { LanguageToggle } from '../../components/LanguageToggle/LanguageToggle'
import { PageShell } from '../../components/PageShell/PageShell'
import { isPrivacyPolicyEnabled } from '../../config/privacyPolicy'
import {
  getPrivacyPolicyMarkdown,
  resolvePrivacyPolicyLocale,
  type PrivacyPolicyLocale,
} from '../../content/privacyPolicy'

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
      <LanguageToggle
        locale={locale}
        onChange={setLocale}
        ariaLabelKey="privacy.languageToggle"
        labelKeyPrefix="privacy"
      />

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
