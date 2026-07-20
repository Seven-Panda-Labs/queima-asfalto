import timingDisclaimerSource from '../../timing-disclaimer.md?raw'

export type TimingDisclaimerLocale = 'pt' | 'en'

const LOCALE_MARKER = /^---locale:(pt|en)---$/gm

function parseLocaleSections(template: string): Map<TimingDisclaimerLocale, string> {
  const sections = new Map<TimingDisclaimerLocale, string>()
  const matches = [...template.matchAll(LOCALE_MARKER)]

  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i]
    const locale = match[1] as TimingDisclaimerLocale
    const start = (match.index ?? 0) + match[0].length
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? template.length) : template.length
    sections.set(locale, template.slice(start, end).trim())
  }

  return sections
}

const DISCLAIMER_BY_LOCALE = parseLocaleSections(timingDisclaimerSource)

export function resolveTimingDisclaimerLocale(language: string): TimingDisclaimerLocale {
  return language.startsWith('en') ? 'en' : 'pt'
}

export function getTimingDisclaimerMarkdown(locale: TimingDisclaimerLocale): string {
  return DISCLAIMER_BY_LOCALE.get(locale) ?? ''
}
