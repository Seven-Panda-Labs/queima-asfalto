import type { AppLanguage } from '../i18n/languages'

const CHANGELOG_LOADERS: Record<AppLanguage, () => Promise<{ default: string }>> = {
  pt: () => import('../../change-log.md?raw'),
  en: () => import('../../change-log.en.md?raw'),
  es: () => import('../../change-log.es.md?raw'),
  de: () => import('../../change-log.de.md?raw'),
  fr: () => import('../../change-log.fr.md?raw'),
  ar: () => import('../../change-log.ar.md?raw'),
}

const changelogCache = new Map<AppLanguage, string>()

const VERSION_HEADING = /^## \[[^\]]+\]/m
const APPENDIX_HEADING =
  /^## (Legenda|Referências|Legend|References|Leyenda|Referencias|Legende|Referenzen|Légende|Références|وسيلة الإيضاح|المراجع)\s*$/m

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

export async function getChangelogMarkdown(locale: AppLanguage): Promise<string> {
  const cached = changelogCache.get(locale)
  if (cached) return cached

  const mod = await CHANGELOG_LOADERS[locale]()
  const markdown = prepareChangelogForDisplay(mod.default)
  changelogCache.set(locale, markdown)
  return markdown
}
