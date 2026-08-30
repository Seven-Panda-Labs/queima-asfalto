import { useTranslation } from 'react-i18next'
import { MarkdownDocument } from '../../components/MarkdownDocument/MarkdownDocument'
import { PageShell } from '../../components/PageShell/PageShell'
import { getTimingDisclaimerMarkdown } from '../../content/timingDisclaimer'
import { normalizeAppLanguage } from '../../i18n/locale'

export function TimingDisclaimer() {
  const { t, i18n } = useTranslation()
  const language = normalizeAppLanguage(i18n.language)

  return (
    <PageShell title={t('timingDisclaimer.title')} description={t('timingDisclaimer.subtitle')}>
      <MarkdownDocument language={language} markdown={getTimingDisclaimerMarkdown(language)} />
    </PageShell>
  )
}
