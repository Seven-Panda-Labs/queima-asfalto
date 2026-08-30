import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MarkdownDocument } from '../../components/MarkdownDocument/MarkdownDocument'
import { PageShell } from '../../components/PageShell/PageShell'
import { getChangelogMarkdown } from '../../content/changelog'
import { normalizeAppLanguage } from '../../i18n/locale'

export function Changelog() {
  const { t, i18n } = useTranslation()
  const language = normalizeAppLanguage(i18n.language)
  const [markdown, setMarkdown] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    void getChangelogMarkdown(language).then((content) => {
      if (!cancelled) {
        setMarkdown(content)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [language])

  return (
    <PageShell title={t('changelog.title')} description={t('changelog.subtitle')}>
      <MarkdownDocument
        language={language}
        markdown={markdown}
        fallback={loading ? <p className="text-sm text-muted">{t('common.loading')}</p> : null}
      />
    </PageShell>
  )
}
