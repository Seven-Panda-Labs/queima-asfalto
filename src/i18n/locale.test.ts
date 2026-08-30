import { describe, expect, it } from 'vitest'
import { normalizeAppLanguage, resolveIntlLocale } from './locale'

describe('normalizeAppLanguage', () => {
  it('strips the region from supported languages', () => {
    expect(normalizeAppLanguage('pt')).toBe('pt')
    expect(normalizeAppLanguage('pt-PT')).toBe('pt')
    expect(normalizeAppLanguage('en')).toBe('en')
    expect(normalizeAppLanguage('en-GB')).toBe('en')
    expect(normalizeAppLanguage('es')).toBe('es')
    expect(normalizeAppLanguage('de')).toBe('de')
    expect(normalizeAppLanguage('fr')).toBe('fr')
    expect(normalizeAppLanguage('fr-CA')).toBe('fr')
    expect(normalizeAppLanguage('ar')).toBe('ar')
    expect(normalizeAppLanguage('ar-MA')).toBe('ar')
  })

  it('falls back to en for unsupported languages', () => {
    expect(normalizeAppLanguage('it')).toBe('en')
  })
})

describe('resolveIntlLocale', () => {
  it('maps each language to a formatting locale', () => {
    expect(resolveIntlLocale('pt-PT')).toBe('pt-PT')
    expect(resolveIntlLocale('en')).toBe('en-GB')
    expect(resolveIntlLocale('it')).toBe('en-GB')
  })

  it('keeps Latin digits in Arabic', () => {
    expect(resolveIntlLocale('ar')).toBe('ar-u-nu-latn')
  })
})
