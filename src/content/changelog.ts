import changelogEn from '../../change-log.en.md?raw'
import changelogPt from '../../change-log.md?raw'
import changelogEs from '../../change-log.es.md?raw'
import changelogDe from '../../change-log.de.md?raw'
import { resolveContentLocale, type ContentLocale } from '../i18n/locale'

export type ChangelogLocale = ContentLocale

const CHANGELOG_BY_LOCALE: Record<ChangelogLocale, string> = {
  pt: changelogPt,
  en: changelogEn,
  es: changelogEs,
  de: changelogDe,
}

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

export function getChangelogMarkdown(locale: ChangelogLocale): string {
  return prepareChangelogForDisplay(CHANGELOG_BY_LOCALE[locale])
}
