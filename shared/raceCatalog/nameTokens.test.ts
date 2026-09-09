import { describe, expect, it } from 'vitest'
import { nameTokensOf, searchToken } from './nameTokens'

describe('nameTokensOf', () => {
  it('takes the words of the name and the town', () => {
    expect(nameTokensOf('Generali Berliner Halbmarathon', 'Berlin')).toEqual([
      'generali',
      'berliner',
      'halbmarathon',
      'berlin',
    ])
  })

  it('strips the accents a runner will not type', () => {
    // Typed as "geres" far more often than as "Gerês".
    expect(nameTokensOf('Gerês Extreme Marathon', 'Campo do Gerês')).toContain('geres')
    expect(nameTokensOf('Maratona de València', 'València')).toContain('valencia')
  })

  it('leaves out what is too short to search for', () => {
    // "de", "do", "am", "5k" and every roman numeral.
    expect(nameTokensOf('X Trail Vitoriano', 'Ermidas do Sado')).toEqual([
      'trail',
      'vitoriano',
      'ermidas',
      'sado',
    ])
  })

  it('says each word once', () => {
    expect(nameTokensOf('Berlin Marathon', 'Berlin')).toEqual(['berlin', 'marathon'])
  })

  it('splits on the punctuation a name is full of', () => {
    expect(nameTokensOf('10-Teiche-Marathon', 'Goslar-Hahnenklee')).toEqual([
      'teiche',
      'marathon',
      'goslar',
      'hahnenklee',
    ])
  })

  it('stops before the index entry gets silly', () => {
    const long = nameTokensOf(
      'The Very Long Charity Fun Run Around Every Lake And Hill In The County',
      'Somewhere',
    )
    expect(long.length).toBeLessThanOrEqual(12)
  })

  it('survives a name with nothing searchable in it', () => {
    expect(nameTokensOf('5K', '')).toEqual([])
  })
})

describe('searchToken', () => {
  it('picks the most selective word typed', () => {
    // Firestore takes one array-contains, and "teltowkanal" is on one entry
    // while "halbmarathon" is on hundreds.
    expect(searchToken('teltowkanal halbmarathon')).toBe('teltowkanal')
  })

  it('normalises what was typed the way the tokens were', () => {
    expect(searchToken('Gerês')).toBe('geres')
    expect(searchToken('  BERLIN  ')).toBe('berlin')
  })

  it('skips the sponsor, which is the word that differs between two names', () => {
    // Both "generali" and "berliner" are distinctive and the same length, and
    // the sponsor is exactly what one source has and another does not.
    expect(searchToken('Generali Berliner Halbmarathon')).toBe('berliner')
    expect(searchToken('BMW BERLIN-MARATHON')).toBe('berlin')
  })

  it('falls back to the longest when every word is generic or a sponsor', () => {
    expect(searchToken('BMW Marathon')).toBe('marathon')
  })

  it('has nothing to ask for when nothing typed is long enough', () => {
    expect(searchToken('')).toBeUndefined()
    expect(searchToken('de')).toBeUndefined()
    expect(searchToken('5k')).toBeUndefined()
  })

  it('matches the tokens it will be compared against', () => {
    const tokens = nameTokensOf('Teltowkanal Halbmarathon', 'Teltow')
    expect(tokens).toContain(searchToken('teltowkanal'))
    expect(tokens).toContain(searchToken('Teltow'))
  })
})
