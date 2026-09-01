import { describe, expect, it } from 'vitest'
import type { Event } from '../../types/Event'
import { buildCourseComparison, courseKey } from './course'

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

describe('buildCourseComparison', () => {
  /** Narrows to the ranking shape, so a regression fails the type check too. */
  function ranked(event: Event, all: Event[]) {
    const comparison = buildCourseComparison(event, all)
    if (comparison?.kind !== 'ran') throw new Error('expected a ranking')
    return comparison
  }

  it('has nothing to say about a course run once', () => {
    expect(buildCourseComparison(hasenheide[0], [hasenheide[0]])).toBeNull()
  })

  it('ranks every running by pace, fastest first', () => {
    const history = ranked(hasenheide[2], hasenheide)
    expect(history.runs).toHaveLength(3)
    expect(history.best.result.event.id).toBe('b')
    expect(history.current.rank).toBe(3)
  })

  it('keeps the runs in chronological order', () => {
    const history = ranked(hasenheide[2], [...hasenheide].reverse())
    expect(history.runs.map((run) => run.result.event.id)).toEqual(['a', 'b', 'c'])
  })

  it('points at the running immediately before this one', () => {
    expect(ranked(hasenheide[2], hasenheide).previous?.result.event.id).toBe('b')
    expect(ranked(hasenheide[0], hasenheide).previous).toBeNull()
  })

  it('treats a course remeasured slightly as the same course', () => {
    // B2Run Berlin is recorded at 5.8 km one year and 5.7 km another.
    const runs = [
      race('x', 'B2Run Berlin', '2019-09-04', '00:33:05', 5.8),
      race('y', 'B2Run Berlin', '2024-09-17', '00:31:00', 5.7),
    ]
    expect(buildCourseComparison(runs[1], runs)!.runs).toHaveLength(2)
  })

  it('groups runnings whose names were typed in a different order', () => {
    const runs = [
      race('x', 'Parkrun Hasenheide', '2025-01-01', '00:26:00'),
      race('y', 'Hasenheide Parkrun', '2026-01-01', '00:25:00'),
    ]
    expect(buildCourseComparison(runs[1], runs)!.runs).toHaveLength(2)
  })

  it('refuses a race that only shares a name', () => {
    const runs = [
      race('x', 'Grande Prova', '2024-01-01', '00:25:00', 5),
      race('y', 'Grande Prova', '2025-01-01', '01:40:00', 21.1),
    ]
    expect(buildCourseComparison(runs[1], runs)).toBeNull()
  })

  it('turns into a target for a race that has not been run yet', () => {
    const ahead = {
      id: 'next',
      name: 'Parkrun Hasenheide',
      date: new Date('2027-01-01'),
      realDistance: 5,
      status: 'confirmed',
      eventType: 'km_5',
    } as Event

    const comparison = buildCourseComparison(ahead, [...hasenheide, ahead])!
    expect(comparison.kind).toBe('upcoming')
    if (comparison.kind !== 'upcoming') throw new Error('expected an outlook')

    // The best of the three is 4:57 a kilometre, so five kilometres is 1485s.
    expect(comparison.runs).toHaveLength(3)
    expect(comparison.best.result.event.id).toBe('b')
    expect(comparison.latest.result.event.id).toBe('c')
    expect(Math.round(comparison.targetSeconds)).toBe(1485)
  })

  it('needs only one past running to have something to beat', () => {
    const ahead = {
      id: 'next',
      name: 'Parkrun Hasenheide',
      date: new Date('2027-01-01'),
      realDistance: 5,
      status: 'planned',
      eventType: 'km_5',
    } as Event

    expect(buildCourseComparison(ahead, [hasenheide[0], ahead])).not.toBeNull()
    expect(buildCourseComparison(ahead, [ahead])).toBeNull()
  })

  it('ranks rather than targets once a time is recorded', () => {
    expect(buildCourseComparison(hasenheide[2], hasenheide)!.kind).toBe('ran')
  })

  it('leaves out races with no usable result', () => {
    const planned = { ...race('z', 'Parkrun Hasenheide', '2027-01-01', ''), status: 'planned' } as Event
    const history = buildCourseComparison(hasenheide[2], [...hasenheide, planned])!
    expect(history.runs).toHaveLength(3)
  })
})

describe('grouping by race identity', () => {
  function linked(
    id: string,
    name: string,
    date: string,
    time: string,
    realDistance: number,
    raceId?: string,
  ): Event {
    return {
      id,
      name,
      date: new Date(date),
      realDistance,
      time,
      status: 'completed',
      eventType: 'km_5',
      raceId,
    } as Event
  }

  it('groups two runnings of one race however the name was typed', () => {
    const current = linked('e2', 'Tierparklauf 2026', '2026-05-01', '00:21:30', 5, 'race-tp')
    const earlier = linked('e1', 'Lauf im Tierpark', '2025-05-01', '00:22:30', 5, 'race-tp')

    const comparison = buildCourseComparison(current, [current, earlier])

    expect(comparison?.kind).toBe('ran')
    expect(comparison?.runs).toHaveLength(2)
  })

  it('keeps the distances of one race apart, because a race is not a course', () => {
    // Tierparklauf runs a 5K and a 10K. One race, two courses.
    const fiveK = linked('e1', 'Tierparklauf', '2026-05-01', '00:21:30', 5, 'race-tp')
    const tenK = linked('e2', 'Tierparklauf', '2026-09-01', '00:45:00', 10, 'race-tp')

    const comparison = buildCourseComparison(tenK, [fiveK, tenK])

    expect(comparison).toBeNull()
  })

  it('still tolerates the same course measured differently', () => {
    const current = linked('e2', 'Tierparklauf', '2026-05-01', '00:21:30', 5, 'race-tp')
    const earlier = linked('e1', 'Tierparklauf', '2025-05-01', '00:22:30', 4.9, 'race-tp')

    expect(buildCourseComparison(current, [current, earlier])?.runs).toHaveLength(2)
  })

  it('falls back to the name when only one side carries an identity', () => {
    const linkedRun = linked('e2', 'Tierparklauf', '2026-05-01', '00:21:30', 5, 'race-tp')
    const older = linked('e1', 'Tierparklauf', '2025-05-01', '00:22:30', 5, undefined)

    expect(buildCourseComparison(linkedRun, [linkedRun, older])?.runs).toHaveLength(2)
  })

  it('does not group two races that only share a name, once both are identified', () => {
    const mine = linked('e2', 'Tierparklauf', '2026-05-01', '00:21:30', 5, 'race-a')
    const other = linked('e1', 'Tierparklauf', '2025-05-01', '00:22:30', 5, 'race-b')

    expect(buildCourseComparison(mine, [mine, other])).toBeNull()
  })
})
