import { resolveContentLocale, type ContentLocale } from '../i18n/locale'

export type ChangelogLocale = ContentLocale

const CHANGELOG_LOADERS: Record<
  ChangelogLocale,
  () => Promise<{ default: string }>
> = {
  pt: () => import('../../change-log.md?raw'),
  en: () => import('../../change-log.en.md?raw'),
  es: () => import('../../change-log.es.md?raw'),
  de: () => import('../../change-log.de.md?raw'),
}

const changelogCache = new Map<ChangelogLocale, string>()

export function resolveChangelogLocale(language: string): ChangelogLocale {
  return resolveContentLocale(language)
}

const VERSION_HEADING = /^## \[[^\]]+\]/m
const APPENDIX_HEADING =
  /^## (Legenda|Referências|Legend|References|Leyenda|Referencias|Legende|Referenzen)\s*$/m

/** User-facing body: version history only (drops header and repo appendix sections). */
export function prepareChangelogForDisplay(markdown: string): string {
  const versionMatch = VERSION_HEADING.exec(markdown)
  let body =
    versionMatch && versionMatch.index != null ? markdown.slice(versionMatch.index) : markdown

  const appendixMatch = APPENDIX_HEADING.exec(body)
  if (appendixMatch && appendixMatch.index != null) {
    body = body.slice(0, appendixMatch.index)
  }

  return body.trim()
}

export async function getChangelogMarkdown(locale: ChangelogLocale): Promise<string> {
  const cached = changelogCache.get(locale)
  if (cached) return cached

  const mod = await CHANGELOG_LOADERS[locale]()
  const markdown = prepareChangelogForDisplay(mod.default)
  changelogCache.set(locale, markdown)
  return markdown
}
