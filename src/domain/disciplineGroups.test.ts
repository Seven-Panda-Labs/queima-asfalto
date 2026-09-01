import { describe, expect, it } from 'vitest'
import { EVENT_TYPES } from './eventCodes'
import { disciplineGroup, groupedDisciplines } from './disciplineGroups'

describe('disciplineGroup', () => {
  it('splits the catalogue at the 5K and at the marathon', () => {
    expect(disciplineGroup('m_1500')).toBe('short')
    expect(disciplineGroup('m_3000')).toBe('short')
    expect(disciplineGroup('km_5')).toBe('road')
    expect(disciplineGroup('km_42_2')).toBe('road')
    expect(disciplineGroup('km_50')).toBe('ultra')
    expect(disciplineGroup('mi_100')).toBe('ultra')
  })

  it('gives every discipline a group', () => {
    for (const eventType of EVENT_TYPES) {
      expect(disciplineGroup(eventType)).toBeTruthy()
    }
  })
})

describe('groupedDisciplines', () => {
  it('covers the catalogue once, in distance order', () => {
    const groups = groupedDisciplines()
    expect(groups.map((group) => group.id)).toEqual(['short', 'road', 'ultra'])
    expect(groups.flatMap((group) => group.disciplines)).toEqual(EVENT_TYPES)
  })

  it('drops a group with nothing in it', () => {
    const groups = groupedDisciplines(['km_5', 'km_10'])
    expect(groups.map((group) => group.id)).toEqual(['road'])
    expect(groups[0]!.disciplines).toEqual(['km_5', 'km_10'])
  })
})
