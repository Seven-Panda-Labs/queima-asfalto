import { describe, expect, it } from 'vitest'
import { OTHER_SPORT_WORDS, readsAsAnotherSport } from './otherSport'

describe('readsAsAnotherSport', () => {
  it('reads another sport as another sport', () => {
    // 49 live entries in the instance, and every one of them is one.
    expect(readsAsAnotherSport('Oranke Open Triathlon')).toBe(true)
    expect(readsAsAnotherSport('Baltic X Cross Duathlon')).toBe(true)
    expect(readsAsAnotherSport('SwimRun Urban Challenge Berlin')).toBe(true)
    expect(readsAsAnotherSport('Run and Bike Berlin')).toBe(true)
  })

  it('reads a walk with no running word as a walk', () => {
    expect(readsAsAnotherSport('Ahmadiyya Charity Walk Alzey')).toBe(true)
    expect(readsAsAnotherSport('Globetrotter Wandertage')).toBe(true)
    expect(readsAsAnotherSport('Hiking-Day Detmold')).toBe(true)
  })

  it('leaves a run with a walk beside it alone', () => {
    // 225 live entries, and this is the list that must never be swept.
    expect(readsAsAnotherSport('Wiler-Herbstlauf + Nordic Walking')).toBe(false)
    expect(readsAsAnotherSport('Nikolauslauf mit Walking')).toBe(false)
    expect(readsAsAnotherSport('Crosslauf & Nordic Walking in Birkenwerder')).toBe(false)
    expect(readsAsAnotherSport('Run and Walk Bern')).toBe(false)
    expect(readsAsAnotherSport('Walk & Run Detmold')).toBe(false)
    expect(readsAsAnotherSport('Charity Walk & Run in Freiburg')).toBe(false)
  })

  it('leaves an ordinary race alone', () => {
    expect(readsAsAnotherSport('Berlin Marathon')).toBe(false)
    expect(readsAsAnotherSport('Meia Maratona de Lisboa')).toBe(false)
    expect(readsAsAnotherSport('Tierparklauf')).toBe(false)
  })

  it('asks for words a name search can actually match', () => {
    // Ten is the limit of one array-contains-any.
    expect(OTHER_SPORT_WORDS.length).toBeLessThanOrEqual(10)
    for (const word of OTHER_SPORT_WORDS) expect(word).toBe(word.toLowerCase())
  })
})
