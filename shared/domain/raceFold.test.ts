import { describe, expect, it } from 'vitest'
import { foldedRaceFields, raceToKeep } from './raceFold'

describe('foldedRaceFields', () => {
  it('keeps the anchors of both races', () => {
    expect(foldedRaceFields({ anchorYears: [2030] }, { anchorYears: [2029, 2030] }).anchorYears).toEqual([
      2029, 2030,
    ])
  })

  it('takes the rest only where the race that stays has nothing', () => {
    const into = { officialUrl: 'https://kept.example', locationLat: 1, locationLng: 2 }
    const from = {
      officialUrl: 'https://dropped.example',
      locationLat: 3,
      locationLng: 4,
      role: 'build_up',
      servesRaceId: 'race-anchor',
    }

    expect(foldedRaceFields(into, from)).toEqual({
      anchorYears: [],
      role: 'build_up',
      servesRaceId: 'race-anchor',
      officialUrl: 'https://kept.example',
      locationLat: 1,
      locationLng: 2,
    })
  })

  it('keeps the role of the race that stays with the race it serves', () => {
    const fields = foldedRaceFields({ role: 'test' }, { role: 'build_up', servesRaceId: 'race-anchor' })

    expect(fields.role).toBe('test')
    expect(fields.servesRaceId).toBeUndefined()
  })
})

describe('raceToKeep', () => {
  const race = (id: string, name: string, created: string) => ({ id, name, createdAt: new Date(created) })
  const typo = race('typo', 'Napoli City Half Marahton', '2025-01-01')
  const right = race('right', 'Napoli City Half Marathon', '2026-01-01')

  it('keeps the race named like the catalog', () => {
    expect(raceToKeep([typo, right], 'Napoli City Half Marathon', () => 0)).toBe(right)
  })

  it('then the one with the most pointing at it, then the oldest', () => {
    expect(raceToKeep([typo, right], 'Napoli Half', (r) => (r === right ? 3 : 1))).toBe(right)
    expect(raceToKeep([right, typo], undefined, () => 0)).toBe(typo)
  })
})
