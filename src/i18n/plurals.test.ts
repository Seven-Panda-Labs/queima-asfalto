import { describe, expect, it } from 'vitest'
import ar from './locales/ar.json'
import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import pt from './locales/pt.json'

/** Sections nest: `eventMedia.errors` is an object, not a string. */
type Bundle = Record<string, Record<string, unknown>>

/** A section named by a dotted path, so nested groups can be checked too. */
function sectionOf(bundle: Bundle, path: string): Record<string, unknown> {
  let current: unknown = bundle
  for (const step of path.split('.')) {
    current = (current as Record<string, unknown>)[step]
  }
  return current as Record<string, unknown>
}

const LOCALES: Record<string, Bundle> = { ar, de, en, es, fr, pt }

/**
 * Keys resolved with a `count`. i18next picks `key_<category>` for the count's
 * CLDR category and, when that form is missing, renders the key name itself.
 * Arabic has six categories where Portuguese has two, so "2 times" showed the
 * literal string "courseTargetRuns" until this was pinned down.
 */
const PLURALISED = [
  ['dashboard', 'courseTargetRuns'],
  ['courseHistory', 'subtitle'],
  ['courseHistory', 'subtitleUpcoming'],
  ['season', 'serving'],
  ['season', 'beforeAnchor'],
  ['season.warnings', 'crowded_month'],
] as const

/** Enough counts to reach every category any of these languages defines. */
const COUNTS = [0, 1, 2, 3, 6, 11, 21, 100]

function requiredCategories(language: string): Set<string> {
  const rules = new Intl.PluralRules(language)
  return new Set(COUNTS.map((count) => rules.select(count)))
}

describe('plural forms', () => {
  for (const [language, bundle] of Object.entries(LOCALES)) {
    for (const [section, key] of PLURALISED) {
      it(`${language}: ${section}.${key} covers every category the language uses`, () => {
        const forms = sectionOf(bundle, section)
        const present = Object.keys(forms).filter((name) =>
          name.startsWith(`${key}_`),
        )

        for (const category of requiredCategories(language)) {
          expect(present).toContain(`${key}_${category}`)
        }

        // A form that is present but empty renders as nothing at all.
        for (const name of present) {
          const text = forms[name]
          expect(typeof text).toBe('string')
          expect(String(text).trim().length).toBeGreaterThan(0)
        }
      })
    }
  }

  it('leaves no unsuffixed base key that would shadow the plural forms', () => {
    for (const bundle of Object.values(LOCALES)) {
      for (const [section, key] of PLURALISED) {
        expect(Object.keys(sectionOf(bundle, section))).not.toContain(key)
      }
    }
  })
})
