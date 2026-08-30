import { describe, expect, it } from 'vitest'
import { getTimingDisclaimerMarkdown } from './timingDisclaimer'

describe('timingDisclaimer', () => {
  it('includes pt, en, es, de, fr and ar disclaimer bodies', () => {
    expect(getTimingDisclaimerMarkdown('pt')).toMatch(/importação de resultados oficiais/i)
    expect(getTimingDisclaimerMarkdown('en')).toMatch(/official results import/i)
    expect(getTimingDisclaimerMarkdown('es')).toMatch(/resultados oficiales/i)
    expect(getTimingDisclaimerMarkdown('de')).toMatch(/Import offizieller Ergebnisse/i)
    expect(getTimingDisclaimerMarkdown('fr')).toMatch(/importation des résultats officiels/i)
    expect(getTimingDisclaimerMarkdown('ar')).toMatch(/النتائج الرسمية/)
  })
})
