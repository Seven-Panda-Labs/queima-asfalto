import { describe, expect, it } from 'vitest'
import { buildMyRaceResultSearchTerm } from './myRaceResultSearch'

describe('buildMyRaceResultSearchTerm', () => {
  it('prefers last name', () => {
    expect(buildMyRaceResultSearchTerm({ resultFirstName: 'Zé', resultLastName: 'Ninguém' })).toBe(
      'ninguém',
    )
  })

  it('falls back to first name', () => {
    expect(buildMyRaceResultSearchTerm({ resultFirstName: 'Zé' })).toBe('zé')
  })
})
