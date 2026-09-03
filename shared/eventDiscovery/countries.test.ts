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
