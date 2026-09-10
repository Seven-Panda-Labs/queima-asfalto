import { describe, expect, it } from 'vitest'
import { nameMatchScore, nameTokensOf, rankByName, searchTokens } from './nameTokens'

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

  it('glues a single letter to the number after it', () => {
    // "S25 Berlin" and "S 25 Berlin" are one race, and the catalog held the
    // second: both the "s" and the "25" were dropped, leaving only "berlin".
    expect(nameTokensOf('S 25 Berlin', 'Berlin')).toEqual(['s25', 'berlin'])
    expect(nameTokensOf('S25 Berlin', 'Berlin')).toEqual(['s25', 'berlin'])
  })

  it('leaves an edition number out, and does not glue a fraction', () => {
    // "26. WACHAUmarathon" is one race and "26" is on a thousand others.
    expect(nameTokensOf('26. WACHAUmarathon', 'Krems')).toEqual(['wachaumarathon', 'krems'])
    expect(nameTokensOf('Kaiserwinkl 1/2 Marathon', '')).toEqual(['kaiserwinkl', 'marathon'])
  })
})

describe('searchTokens', () => {
  it('asks for every word, and the most selective first', () => {
    // One word was not enough. Typing this asked for "maratona", which is on
    // hundreds of entries, and answered with Castro Marim, Parma and Vilnius.
    expect(searchTokens('EDP Meia Maratona de Lisboa')).toEqual([
      'edp',
      'lisboa',
      'meia',
      'maratona',
    ])
  })

  it('keeps a sponsor, which narrows harder than a place', () => {
    // Excluded while this picked one word, because a sponsor is what differs
    // between two namings. With a pool per word the ranking sorts that out.
    expect(searchTokens('BMW BERLIN-MARATHON')).toEqual(['bmw', 'berlin', 'marathon'])
  })

  it('puts a generic word last, not out', () => {
    // Last, because a pool has to come from somewhere when everything typed is
    // generic, and out only when there is something better to ask for.
    expect(searchTokens('BMW Marathon')).toEqual(['bmw', 'marathon'])
    expect(searchTokens('Teltowkanal Halbmarathon')).toEqual(['teltowkanal', 'halbmarathon'])
  })

  it('returns every word, and leaves the querying budget to the caller', () => {
    // A word left out of the scoring is a word that cannot tell two races
    // apart: only "meia" separates the Meia Maratona de Lisboa from the
    // Maratona de Lisboa, and it is a word worth scoring and not querying.
    expect(searchTokens('Corrida da Ponte 25 de Abril Lisboa Portugal')).toEqual([
      'ponte',
      'abril',
      'lisboa',
      'portugal',
      'corrida',
    ])
  })

  it('normalises what was typed the way the tokens were', () => {
    expect(searchTokens('Gerês')).toEqual(['geres'])
    expect(searchTokens('  BERLIN  ')).toEqual(['berlin'])
  })

  it('says each word once', () => {
    expect(searchTokens('Berlin Berlin Marathon')).toEqual(['berlin', 'marathon'])
  })

  it('has nothing to ask for when nothing typed is long enough', () => {
    expect(searchTokens('')).toEqual([])
    expect(searchTokens('de 5k')).toEqual([])
  })

  it('asks for the same word whether S25 or S 25 was typed', () => {
    expect(searchTokens('S25')).toEqual(['s25'])
    expect(searchTokens('S 25 Berlin')).toEqual(['s25', 'berlin'])
  })
})

describe('nameMatchScore', () => {
  const lisbon = nameTokensOf('Meia Maratona de Lisboa', 'Alfama')

  it('counts how much of what was typed an entry accounts for', () => {
    expect(nameMatchScore(lisbon, 'EDP Meia Maratona de Lisboa')).toBe(3)
    // Castro Marim agrees on the distance and not on the place.
    expect(nameMatchScore(nameTokensOf('Meia Maratona do Concelho de Castro Marim', 'Castro Marim'), 'EDP Meia Maratona de Lisboa')).toBe(2)
    expect(nameMatchScore(nameTokensOf('Parma Mezza Maratona', 'Parma'), 'EDP Meia Maratona de Lisboa')).toBe(1)
  })

  it('forgives the ending German puts on a place', () => {
    // "Berliner Firmenlauf" against "Firmenlauf Berlin" is one race.
    expect(nameMatchScore(nameTokensOf('Firmenlauf', 'Berlin'), 'Berliner Firmenlauf')).toBe(2)
  })

  it('is zero for an entry that shares nothing', () => {
    expect(nameMatchScore(lisbon, 'Tierparklauf')).toBe(0)
    expect(nameMatchScore([], 'anything')).toBe(0)
  })
})

describe('rankByName, on the rows the search actually returned', () => {
  /** Exactly what typing the Meia Maratona de Lisboa answered with. */
  const returned = [
    ['Meia Maratona do Concelho de Castro Marim', 'Castro Marim', '2026-09-12'],
    ['Meia Maratona de S. João das Lampas', 'União das freguesias de São João das Lampas', '2026-09-12'],
    ['Parma Mezza Maratona', 'Parma', '2026-09-13'],
    ['Maratona Alzheimer', 'Pisignano', '2026-09-13'],
    ['23. Swedbank Vilniaus Maratona', 'Vilnius', '2026-09-13'],
    ['Meia Maratona de Benedita', 'Benedita', '2026-09-13'],
    ['Meia Maratona de Lisboa', 'Alfama', '2027-03-07'],
  ].map(([name, city, nextRaceDate]) => ({
    name,
    nameTokens: nameTokensOf(name!, city!),
    nextRaceDate,
  }))

  it('puts the race that was typed first, not the soonest one', () => {
    const ranked = rankByName(returned, 'EDP Meia Maratona de Lisboa')

    // Ordered by date it came seventh, behind six races it is not.
    expect(ranked[0]?.name).toBe('Meia Maratona de Lisboa')
  })

  it('breaks a tie on the date, so the list still reads as a calendar', () => {
    const ranked = rankByName(returned, 'Meia Maratona')

    // Six of these account for both words, and among those the soonest wins.
    expect(ranked[0]?.nextRaceDate).toBe('2026-09-12')
  })
})
