import { Children, useEffect, useState, type ReactNode } from 'react'
import type { Components } from 'react-markdown'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { MarkdownDocument } from '../../components/MarkdownDocument/MarkdownDocument'
import { PageShell } from '../../components/PageShell/PageShell'
import {
  changelogHeadingVersion,
  getChangelogMarkdown,
  splitChangelogVersions,
  type ChangelogVersion,
} from '../../content/changelog'
import { normalizeAppLanguage } from '../../i18n/locale'

const RECENT_VERSION_COUNT = 10

function textOf(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) => (typeof child === 'string' || typeof child === 'number' ? String(child) : ''))
    .join('')
}

/** Each version heading carries its own anchor, so `/novidades#1.42.0` can be shared. */
const components: Components = {
  h2: ({ children }) => {
    const version = changelogHeadingVersion(textOf(children))
    if (!version) return <h2>{children}</h2>
    return (
      <h2 id={version}>
        <a href={`#${version}`}>{children}</a>
      </h2>
    )
  },
}

export function Changelog() {
  const { t, i18n } = useTranslation()
  const { hash } = useLocation()
  const language = normalizeAppLanguage(i18n.language)
  const [versions, setVersions] = useState<ChangelogVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [showOlder, setShowOlder] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    void getChangelogMarkdown(language).then((content) => {
      if (!cancelled) {
        setVersions(splitChangelogVersions(content))
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [language])

  const target = decodeURIComponent(hash.slice(1))
  // A link to an archived version opens the archive, otherwise the anchor would not exist.
  const expanded =
    showOlder || versions.findIndex((entry) => entry.version === target) >= RECENT_VERSION_COUNT
  const visible = expanded ? versions : versions.slice(0, RECENT_VERSION_COUNT)

  // The router does not scroll to a hash, and the heading only exists once the file has loaded.
  useEffect(() => {
    if (target && versions.length > 0) document.getElementById(target)?.scrollIntoView()
  }, [target, versions])

  return (
    <PageShell title={t('changelog.title')} description={t('changelog.subtitle')}>
      <MarkdownDocument
        language={language}
        markdown={visible.map((entry) => entry.markdown).join('\n\n')}
        components={components}
        fallback={loading ? <p className="text-sm text-muted">{t('common.loading')}</p> : null}
      />
      {!loading && visible.length < versions.length ? (
        <button
          type="button"
          onClick={() => setShowOlder(true)}
          className="mt-4 rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-border/40"
        >
          {t('changelog.showOlder')}
        </button>
      ) : null}
    </PageShell>
  )
}
