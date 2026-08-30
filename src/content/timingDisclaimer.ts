import timingDisclaimerSource from '../../timing-disclaimer.md?raw'
import type { AppLanguage } from '../i18n/languages'

const LOCALE_MARKER = /^---locale:(pt|en|es|de|fr|ar)---$/gm

function parseLocaleSections(template: string): Map<AppLanguage, string> {
  const sections = new Map<AppLanguage, string>()
  const matches = [...template.matchAll(LOCALE_MARKER)]

  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i]
    const locale = match[1] as AppLanguage
    const start = (match.index ?? 0) + match[0].length
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? template.length) : template.length
    sections.set(locale, template.slice(start, end).trim())
  }

  return sections
}

const DISCLAIMER_BY_LOCALE = parseLocaleSections(timingDisclaimerSource)

export function getTimingDisclaimerMarkdown(locale: AppLanguage): string {
  return DISCLAIMER_BY_LOCALE.get(locale) ?? ''
}
