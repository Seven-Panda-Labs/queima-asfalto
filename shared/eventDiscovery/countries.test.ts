import { describe, expect, it } from 'vitest'
import { toIsoCountry } from './countries'

describe('toIsoCountry', () => {
  it('keeps a code that is already ISO', () => {
    expect(toIsoCountry('PT')).toBe('PT')
    expect(toIsoCountry('de')).toBe('DE')
  })

  it('reads the name a source publishes instead of a code', () => {
    // running.life sends this in addressCountry, where ISO is documented.
    expect(toIsoCountry('Deutschland')).toBe('DE')
    expect(toIsoCountry('Österreich')).toBe('AT')
    expect(toIsoCountry('Switzerland')).toBe('CH')
  })

  it('corrects the two letter codes that are not the standard', () => {
    // "London, UK" on a German directory. The ISO code is GB.
    expect(toIsoCountry('UK')).toBe('GB')
    expect(toIsoCountry('EL')).toBe('GR')
  })

  it('resolves to nothing rather than guessing', () => {
    expect(toIsoCountry('Nirgendwoland')).toBeUndefined()
    expect(toIsoCountry('DEU')).toBeUndefined()
    expect(toIsoCountry('')).toBeUndefined()
    expect(toIsoCountry(undefined)).toBeUndefined()
  })
})

describe('the United Kingdom, however a source writes it', () => {
  it('reads the German name, which is what a calendar sent', () => {
    // 117 races filed under the country "XX" until this was in the table.
    expect(toIsoCountry('Vereinigtes Königreich')).toBe('GB')
    expect(toIsoCountry('vereinigtes koenigreich')).toBe('GB')
  })

  it('reads the other spellings a source might use', () => {
    expect(toIsoCountry('Royaume-Uni')).toBe('GB')
    expect(toIsoCountry('Reino Unido')).toBe('GB')
    expect(toIsoCountry('United Kingdom')).toBe('GB')
  })
})
