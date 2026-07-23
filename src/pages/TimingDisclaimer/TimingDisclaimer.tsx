import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { LanguageToggle } from '../../components/LanguageToggle/LanguageToggle'
import { PageShell } from '../../components/PageShell/PageShell'
import {
  getTimingDisclaimerMarkdown,
  resolveTimingDisclaimerLocale,
  type TimingDisclaimerLocale,
} from '../../content/timingDisclaimer'

export function TimingDisclaimer() {
  const { t, i18n } = useTranslation()
  const [locale, setLocale] = useState<TimingDisclaimerLocale>(() =>
    resolveTimingDisclaimerLocale(i18n.language),
  )

  return (
    <PageShell title={t('timingDisclaimer.title')} description={t('timingDisclaimer.subtitle')}>
      <LanguageToggle
        locale={locale}
        onChange={setLocale}
        ariaLabelKey="timingDisclaimer.languageToggle"
        labelKeyPrefix="timingDisclaimer"
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
          {getTimingDisclaimerMarkdown(locale)}
        </ReactMarkdown>
      </article>
    </PageShell>
  )
}
