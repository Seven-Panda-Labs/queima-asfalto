import { describe, expect, it } from 'vitest'
import { raceTimezone, timezoneFor, zonesForCountry } from './timezones'

describe('timezoneFor', () => {
  it('answers for a country with one zone', () => {
    expect(timezoneFor('GB')).toBe('Europe/London')
    expect(timezoneFor('FR')).toBe('Europe/Paris')
    expect(timezoneFor('DK')).toBe('Europe/Copenhagen')
  })

  it('answers when the zones are the same clock under two names', () => {
    // Germany is Europe/Berlin and Europe/Busingen, and no reminder can tell
    // them apart. 1458 entries in the instance are German.
    expect(timezoneFor('DE')).toBe('Europe/Berlin')
  })

  it('says nothing for a country that is really several', () => {
    // The platform lists them alphabetically, so the first would file a race
    // in Lisbon under the Azores.
    expect(timezoneFor('PT')).toBeUndefined()
    expect(timezoneFor('ES')).toBeUndefined()
    expect(timezoneFor('US')).toBeUndefined()
  })

  it('says nothing about what is not a country', () => {
    expect(timezoneFor(undefined)).toBeUndefined()
    expect(timezoneFor('')).toBeUndefined()
    expect(timezoneFor('Portugal')).toBeUndefined()
  })
})

describe('zonesForCountry', () => {
  it('is the list to choose from when a choice is needed', () => {
    expect(zonesForCountry('PT')).toEqual(['Atlantic/Azores', 'Atlantic/Madeira', 'Europe/Lisbon'])
    expect(zonesForCountry('US').length).toBeGreaterThan(20)
  })
})

describe('raceTimezone', () => {
  it('prefers what was written down, then the entry, then the country', () => {
    expect(raceTimezone({ country: 'PT', timezone: 'Europe/Lisbon' }, { timezone: 'Atlantic/Azores' })).toBe(
      'Atlantic/Azores',
    )
    expect(raceTimezone({ country: 'PT', timezone: 'Europe/Lisbon' })).toBe('Europe/Lisbon')
    expect(raceTimezone({ country: 'DE' })).toBe('Europe/Berlin')
    expect(raceTimezone({ country: 'US' })).toBeUndefined()
  })
})
