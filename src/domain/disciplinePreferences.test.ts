import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ENABLED_DISCIPLINES,
  parseEnabledDisciplines,
  visibleDisciplines,
} from './disciplinePreferences'

describe('parseEnabledDisciplines', () => {
  it('gives every discipline to an account that never set the preference', () => {
    expect(parseEnabledDisciplines(undefined)).toEqual(DEFAULT_ENABLED_DISCIPLINES)
    expect(parseEnabledDisciplines({})).toEqual(DEFAULT_ENABLED_DISCIPLINES)
  })

  it('keeps the stored selection', () => {
    expect(parseEnabledDisciplines({ enabledDisciplines: ['km_10', 'km_42_2'] })).toEqual([
      'km_10',
      'km_42_2',
    ])
  })

  it('sorts by distance whatever order it was stored in', () => {
    expect(parseEnabledDisciplines({ enabledDisciplines: ['km_42_2', 'km_5'] })).toEqual([
      'km_5',
      'km_42_2',
    ])
  })

  it('drops unknown codes and duplicates', () => {
    expect(
      parseEnabledDisciplines({ enabledDisciplines: ['km_10', 'km_10', 'km_7', 42] }),
    ).toEqual(['km_10'])
  })

  it('falls back when the selection would leave nothing to pick', () => {
    expect(parseEnabledDisciplines({ enabledDisciplines: [] })).toEqual(
      DEFAULT_ENABLED_DISCIPLINES,
    )
    expect(parseEnabledDisciplines({ enabledDisciplines: ['nope'] })).toEqual(
      DEFAULT_ENABLED_DISCIPLINES,
    )
    expect(parseEnabledDisciplines({ enabledDisciplines: 'km_10' })).toEqual(
      DEFAULT_ENABLED_DISCIPLINES,
    )
  })
})

describe('visibleDisciplines', () => {
  it('adds back a disabled discipline the data still uses', () => {
    expect(visibleDisciplines(['km_10'], ['km_42_2'])).toEqual(['km_10', 'km_42_2'])
  })

  it('leaves the enabled set alone when the data adds nothing', () => {
    expect(visibleDisciplines(['km_5', 'km_10'], ['km_10'])).toEqual(['km_5', 'km_10'])
  })

  it('ignores codes that are not disciplines', () => {
    expect(visibleDisciplines(['km_10'], ['km_7' as never])).toEqual(['km_10'])
  })
})

describe('DEFAULT_ENABLED_DISCIPLINES', () => {
  it('stays the four the app shipped with, however wide the catalogue grows', () => {
    expect(DEFAULT_ENABLED_DISCIPLINES).toEqual(['km_5', 'km_10', 'km_21_1', 'km_42_2'])
  })
})
