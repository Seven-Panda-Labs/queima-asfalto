import { describe, expect, it } from 'vitest'
import type { Event } from '../../types/Event'
import { buildCourseHistory, courseKey } from './course'

function race(
  id: string,
  name: string,
  date: string,
  time: string,
  realDistance = 5,
): Event {
  return {
    id,
    name,
    date: new Date(date),
    realDistance,
    time,
    status: 'completed',
    eventType: 'km_5',
  } as Event
}

const hasenheide = [
  race('a', 'Parkrun Hasenheide', '2021-10-01', '00:26:40'),
  race('b', 'parkrun  Hasenheide', '2023-01-14', '00:24:45'),
  race('c', 'Parkrun Hasenheide', '2026-05-02', '00:27:15'),
]

describe('courseKey', () => {
  const same = (left: string, right: string) => expect(courseKey(left)).toBe(courseKey(right))
  const different = (left: string, right: string) =>
    expect(courseKey(left)).not.toBe(courseKey(right))

  it('forgives casing and spacing', () => {
    same('  parkrun   Hasenheide ', 'Parkrun Hasenheide')
  })

  it('forgives the word order, which is the reported case', () => {
    same('Parkrun Hasenheide', 'Hasenheide Parkrun')
  })

  it('forgives punctuation and accents', () => {
    same('Corrida São Silvestre', 'corrida sao-silvestre')
  })

  it('drops the year, so editions group together', () => {
    same('Hasenheide Parkrun 2023', 'Parkrun Hasenheide')
  })

  it('keeps numbers that are part of the name', () => {
    // Without its 25 this is "berlin s", which is a different race.
    expect(courseKey('S 25 Berlin').split(' ')).toContain('25')
    different('S 25 Berlin', 'S 10 Berlin')
  })

  it('does not merge races that merely read alike', () => {
    different('Meia Maratona de Lisboa', 'Maratona de Lisboa')
    different('Parkrun Hasenheide', 'Havelkanal Parkrun')
  })
})

describe('buildCourseHistory', () => {
  it('has nothing to say about a course run once', () => {
    expect(buildCourseHistory(hasenheide[0], [hasenheide[0]])).toBeNull()
  })

  it('ranks every running by pace, fastest first', () => {
    const history = buildCourseHistory(hasenheide[2], hasenheide)!
    expect(history.runs).toHaveLength(3)
    expect(history.best.result.event.id).toBe('b')
    expect(history.current.rank).toBe(3)
  })

  it('keeps the runs in chronological order', () => {
    const history = buildCourseHistory(hasenheide[2], [...hasenheide].reverse())!
    expect(history.runs.map((run) => run.result.event.id)).toEqual(['a', 'b', 'c'])
  })

  it('points at the running immediately before this one', () => {
    expect(buildCourseHistory(hasenheide[2], hasenheide)!.previous?.result.event.id).toBe('b')
    expect(buildCourseHistory(hasenheide[0], hasenheide)!.previous).toBeNull()
  })

  it('treats a course remeasured slightly as the same course', () => {
    // B2Run Berlin is recorded at 5.8 km one year and 5.7 km another.
    const runs = [
      race('x', 'B2Run Berlin', '2019-09-04', '00:33:05', 5.8),
      race('y', 'B2Run Berlin', '2024-09-17', '00:31:00', 5.7),
    ]
    expect(buildCourseHistory(runs[1], runs)!.runs).toHaveLength(2)
  })

  it('groups runnings whose names were typed in a different order', () => {
    const runs = [
      race('x', 'Parkrun Hasenheide', '2025-01-01', '00:26:00'),
      race('y', 'Hasenheide Parkrun', '2026-01-01', '00:25:00'),
    ]
    expect(buildCourseHistory(runs[1], runs)!.runs).toHaveLength(2)
  })

  it('refuses a race that only shares a name', () => {
    const runs = [
      race('x', 'Grande Prova', '2024-01-01', '00:25:00', 5),
      race('y', 'Grande Prova', '2025-01-01', '01:40:00', 21.1),
    ]
    expect(buildCourseHistory(runs[1], runs)).toBeNull()
  })

  it('leaves out races with no usable result', () => {
    const planned = { ...race('z', 'Parkrun Hasenheide', '2027-01-01', ''), status: 'planned' } as Event
    const history = buildCourseHistory(hasenheide[2], [...hasenheide, planned])!
    expect(history.runs).toHaveLength(3)
  })
})
