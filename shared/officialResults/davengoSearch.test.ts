import { describe, expect, it } from 'vitest'
import { buildDavengoSearchTerm } from './davengoSearch'

describe('buildDavengoSearchTerm', () => {
  it('prefers last name', () => {
    expect(
      buildDavengoSearchTerm({ resultFirstName: 'Zé', resultLastName: 'Ninguém' }),
    ).toBe('Ninguém')
  })

  it('falls back to first name', () => {
    expect(buildDavengoSearchTerm({ resultFirstName: 'Zé' })).toBe('Zé')
  })

  it('returns null when names are too short', () => {
    expect(buildDavengoSearchTerm({ resultFirstName: 'A' })).toBeNull()
  })
})
