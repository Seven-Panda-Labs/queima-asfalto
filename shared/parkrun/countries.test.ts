import { describe, expect, it } from 'vitest'
import { formatParkrunEventSubtitle, parkrunCountryName } from './countries'

describe('parkrun countries', () => {
  it('resolves country names from parkrun codes', () => {
    expect(parkrunCountryName(32, 'en')).toBe('Germany')
    expect(parkrunCountryName(97, 'en')).toBe('United Kingdom')
    expect(parkrunCountryName(32, 'pt')).toBe('Alemanha')
  })

  it('formats event subtitle with location and country', () => {
    expect(formatParkrunEventSubtitle('Centenary Park', 3, 'en')).toBe(
      'Centenary Park · Australia',
    )
    expect(formatParkrunEventSubtitle('Centenary Park', 97, 'pt')).toBe(
      'Centenary Park · Reino Unido',
    )
  })
})
