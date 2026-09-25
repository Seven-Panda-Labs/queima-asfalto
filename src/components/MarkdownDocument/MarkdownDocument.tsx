import type { ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { resolveTextDirection, type AppLanguage } from '../../i18n/languages'

type MarkdownDocumentProps = {
  language: AppLanguage
  markdown: string
  /** Rendered in place of the markdown, for content that is still loading. */
  fallback?: ReactNode
  /** Overrides for single elements, merged over the defaults. */
  components?: Components
}

export function MarkdownDocument({ language, markdown, fallback, components }: MarkdownDocumentProps) {
  return (
    <article
      dir={resolveTextDirection(language)}
      className="changelog mt-6 rounded-lg border border-border bg-surface p-6"
    >
      {fallback ?? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
            ...components,
          }}
        >
          {markdown}
        </ReactMarkdown>
      )}
    </article>
  )
}
