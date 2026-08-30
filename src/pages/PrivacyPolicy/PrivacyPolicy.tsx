import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MarkdownDocument } from '../../components/MarkdownDocument/MarkdownDocument'
import { PageShell } from '../../components/PageShell/PageShell'
import { isPrivacyPolicyEnabled } from '../../config/privacyPolicy'
import { getPrivacyPolicyMarkdown } from '../../content/privacyPolicy'
import { normalizeAppLanguage } from '../../i18n/locale'

export function PrivacyPolicy() {
  const { t, i18n } = useTranslation()
  const language = normalizeAppLanguage(i18n.language)

  if (!isPrivacyPolicyEnabled()) {
    return <Navigate to="/" replace />
  }

  return (
    <PageShell title={t('privacy.title')} description={t('privacy.subtitle')}>
      <MarkdownDocument language={language} markdown={getPrivacyPolicyMarkdown(language)} />
    </PageShell>
  )
}
