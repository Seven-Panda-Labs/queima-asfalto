import { describe, expect, it } from 'vitest'
import { buildSporthiveSearchTerm } from './sporthiveSearch'

describe('buildSporthiveSearchTerm', () => {
  it('prefers full name lowercased', () => {
    expect(
      buildSporthiveSearchTerm({ resultFirstName: 'Zé', resultLastName: 'Ninguém' }),
    ).toBe('zé ninguém')
  })

  it('falls back to last name', () => {
    expect(buildSporthiveSearchTerm({ resultLastName: 'Ninguém' })).toBe('ninguém')
  })

  it('returns null when too short', () => {
    expect(buildSporthiveSearchTerm({ resultFirstName: 'A' })).toBeNull()
  })
})
