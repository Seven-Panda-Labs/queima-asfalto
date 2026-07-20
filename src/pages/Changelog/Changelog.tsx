import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import { PageShell } from '../../components/PageShell/PageShell'
import {
  getChangelogMarkdown,
  resolveChangelogLocale,
  type ChangelogLocale,
} from '../../content/changelog'

function changelogToggleClass(active: boolean): string {
  return [
    'rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
    active ? 'bg-primary text-white' : 'text-muted hover:bg-background hover:text-foreground',
  ].join(' ')
}

export function Changelog() {
  const { t, i18n } = useTranslation()
  const [locale, setLocale] = useState<ChangelogLocale>(() => resolveChangelogLocale(i18n.language))

  return (
    <PageShell title={t('changelog.title')} description={t('changelog.subtitle')}>
      <div className="mt-6 flex justify-end gap-2" role="group" aria-label={t('changelog.languageToggle')}>
        <button
          type="button"
          className={changelogToggleClass(locale === 'pt')}
          aria-pressed={locale === 'pt'}
          onClick={() => setLocale('pt')}
        >
          {t('changelog.languagePt')}
        </button>
        <button
          type="button"
          className={changelogToggleClass(locale === 'en')}
          aria-pressed={locale === 'en'}
          onClick={() => setLocale('en')}
        >
          {t('changelog.languageEn')}
        </button>
      </div>

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
