import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import { LanguageToggle } from '../../components/LanguageToggle/LanguageToggle'
import { PageShell } from '../../components/PageShell/PageShell'
import {
  getChangelogMarkdown,
  resolveChangelogLocale,
  type ChangelogLocale,
} from '../../content/changelog'

export function Changelog() {
  const { t, i18n } = useTranslation()
  const [locale, setLocale] = useState<ChangelogLocale>(() => resolveChangelogLocale(i18n.language))

  return (
    <PageShell title={t('changelog.title')} description={t('changelog.subtitle')}>
      <LanguageToggle
        locale={locale}
        onChange={setLocale}
        ariaLabelKey="changelog.languageToggle"
        labelKeyPrefix="changelog"
      />

      <article className="changelog mt-6 rounded-lg border border-border bg-surface p-6">
        <ReactMarkdown
          components={{
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
          }}
        >
          {getChangelogMarkdown(locale)}
        </ReactMarkdown>
      </article>
    </PageShell>
  )
}
