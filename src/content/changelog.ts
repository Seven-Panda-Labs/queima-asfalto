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

export type ChangelogVersion = { version: string; markdown: string }

const VERSION_LABEL = /^\[([^\]]+)\]/

/** Version number from a heading such as `[1.42.0] - 2026-08-01`, used as its anchor. */
export function changelogHeadingVersion(heading: string): string | null {
  return VERSION_LABEL.exec(heading.trim())?.[1] ?? null
}

/** Splits the displayed changelog into one entry per version, newest first. */
export function splitChangelogVersions(markdown: string): ChangelogVersion[] {
  return markdown
    .split(/^(?=## \[)/m)
    .map((chunk) => chunk.trim())
    .flatMap((chunk) => {
      const version = changelogHeadingVersion(chunk.replace(/^## /, ''))
      return chunk.startsWith('## [') && version ? [{ version, markdown: chunk }] : []
    })
}

export async function getChangelogMarkdown(locale: AppLanguage): Promise<string> {
  const cached = changelogCache.get(locale)
  if (cached) return cached

  const mod = await CHANGELOG_LOADERS[locale]()
  const markdown = prepareChangelogForDisplay(mod.default)
  changelogCache.set(locale, markdown)
  return markdown
}
