import { describe, expect, it } from 'vitest'
import { namesMatch, splitFullName, matchesResultsProfile } from './matchName'

describe('namesMatch', () => {
  it('matches first and last name', () => {
    expect(
      namesMatch(
        { resultFirstName: 'Zé', resultLastName: 'Ninguém' },
        'Zé',
        'Ninguém',
      ),
    ).toBe(true)
  })

  it('matches with only last name configured', () => {
    expect(namesMatch({ resultLastName: 'Ninguém' }, 'John', 'Ninguém')).toBe(true)
  })

  it('rejects when last name differs', () => {
    expect(
      namesMatch(
        { resultFirstName: 'Zé', resultLastName: 'Ninguém' },
        'Zé',
        'Santos',
      ),
    ).toBe(false)
  })
})

describe('splitFullName', () => {
  it('splits full name into first and last', () => {
    expect(splitFullName('Zé Ninguém')).toEqual({ first: 'Zé', last: 'Ninguém' })
  })
})

describe('matchesResultsProfile', () => {
  it('matches compound registration names', () => {
    const profile = { resultFirstName: 'Zé', resultLastName: 'Ninguém' }
    expect(matchesResultsProfile(profile, 'Zé Fulano Ninguém')).toBe(true)
  })

  it('matches configured aliases', () => {
    const profile = {
      resultFirstName: 'Maria',
      resultLastName: 'Silva',
      resultNameAliases: ['Maria Santos'],
    }
    expect(matchesResultsProfile(profile, 'Maria Santos')).toBe(true)
    expect(matchesResultsProfile(profile, 'Maria Silva')).toBe(true)
  })
})
