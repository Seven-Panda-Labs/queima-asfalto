import { describe, expect, it } from 'vitest'
import {
  getTimingDisclaimerMarkdown,
  resolveTimingDisclaimerLocale,
} from './timingDisclaimer'

describe('timingDisclaimer', () => {
  it('resolves locale from i18n language', () => {
    expect(resolveTimingDisclaimerLocale('pt-PT')).toBe('pt')
    expect(resolveTimingDisclaimerLocale('en-GB')).toBe('en')
  })

  it('includes pt, en, es and de disclaimer bodies', () => {
    expect(getTimingDisclaimerMarkdown('pt')).toMatch(/importação de resultados oficiais/i)
    expect(getTimingDisclaimerMarkdown('en')).toMatch(/official results import/i)
    expect(getTimingDisclaimerMarkdown('es')).toMatch(/resultados oficiales/i)
    expect(getTimingDisclaimerMarkdown('de')).toMatch(/Import offizieller Ergebnisse/i)
  })
})
