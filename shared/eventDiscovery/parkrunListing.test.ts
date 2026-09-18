import { describe, expect, it } from 'vitest'
import { isParkrunListing } from './parkrunListing'

describe('isParkrunListing', () => {
  it('reads the venues the German calendars list as events', () => {
    // Every one of these is in the live catalog today, as an annual race.
    expect(isParkrunListing({ name: 'Speyer Leinpfad Parkrun' })).toBe(true)
    expect(isParkrunListing({ name: 'Kemnader See parkrun' })).toBe(true)
    expect(isParkrunListing({ name: 'Lillie Parkrun Ann Arbor' })).toBe(true)
  })

  it('reads the site even when the name says nothing', () => {
    expect(
      isParkrunListing({ name: 'Alstervorland', officialUrl: 'https://www.parkrun.com.de/' }),
    ).toBe(true)
    expect(
      isParkrunListing({ name: 'Lillie', sourceUrl: 'https://www.parkrun.us/lillie/' }),
    ).toBe(true)
  })

  it('leaves the annual races whose name happens to say park run', () => {
    // A half marathon, a 5 km in Ann Arbor, and a charity run for dogs. All
    // three are real entries a looser test threw out of the catalog.
    expect(
      isParkrunListing({ name: 'Brescia Park Run', officialUrl: 'https://bprhalfmarathon.it/' }),
    ).toBe(false)
    expect(
      isParkrunListing({ name: 'Burns Park Run', officialUrl: 'http://www.burnsparkrun.org' }),
    ).toBe(false)
    expect(isParkrunListing({ name: 'Bark in the Park Run for the Dogs' })).toBe(false)
  })

  it('leaves a German word that starts the same way', () => {
    expect(isParkrunListing({ name: 'Parkrundenlauf Leipzig' })).toBe(false)
  })
})
