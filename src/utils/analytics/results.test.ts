import { describe, expect, it } from 'vitest'
import { makeEvent } from './testFixtures'
import {
  formatDurationSeconds,
  formatPaceDelta,
  formatPaceSeconds,
  isAnalysableResult,
  toAnalysableResults,
  totalDistanceKm,
  weightedAveragePaceSeconds,
} from './results'

describe('isAnalysableResult', () => {
  it('needs a completed event with a parseable time and a real distance', () => {
    const base = { id: '1', date: new Date(2026, 0, 1), eventType: 'km_10' as const }

    expect(isAnalysableResult(makeEvent({ ...base, time: '00:50:00' }))).toBe(true)
    expect(isAnalysableResult(makeEvent({ ...base, status: 'planned', time: '00:50:00' }))).toBe(false)
    expect(isAnalysableResult(makeEvent({ ...base }))).toBe(false)
    expect(isAnalysableResult(makeEvent({ ...base, time: 'nonsense' }))).toBe(false)
    expect(isAnalysableResult(makeEvent({ ...base, time: '00:50:00', realDistance: 0 }))).toBe(false)
  })

  it('rebuilds the time from a stored pace when there is no time', () => {
    // A importação de Excel aceita uma coluna de ritmo sem coluna de tempo.
    const event = makeEvent({
      id: '1',
      date: new Date(2026, 0, 1),
      eventType: 'km_10',
      pace: '5:00',
    })

    expect(isAnalysableResult(event)).toBe(true)

    const [result] = toAnalysableResults([event])
    expect(result!.timeSeconds).toBe(3000)
    expect(result!.timeFromPace).toBe(true)
  })

  it('does not require the stored pace, which the analysis derives itself', () => {
    const event = makeEvent({
      id: '1',
      date: new Date(2026, 0, 1),
      eventType: 'km_10',
      time: '00:50:00',
    })
    expect(event.pace).toBeUndefined()

    const [result] = toAnalysableResults([event])
    expect(result!.paceSeconds).toBe(300)
    expect(result!.timeFromPace).toBe(false)
  })

  it('derives pace from time and distance rather than trusting the stored string', () => {
    // Campos independentes: o `pace` guardado pode estar desalinhado do tempo.
    const [result] = toAnalysableResults([
      makeEvent({
        id: '1',
        date: new Date(2026, 0, 1),
        eventType: 'km_10',
        realDistance: 10.5,
        time: '00:52:30',
        pace: '9:99',
      }),
    ])

    expect(result!.paceSeconds).toBe(300)
  })
})

describe('toAnalysableResults', () => {
  it('sorts chronologically and drops what it cannot use', () => {
    const results = toAnalysableResults([
      makeEvent({ id: 'b', date: new Date(2026, 5, 1), eventType: 'km_10', time: '00:50:00' }),
      makeEvent({ id: 'skip', date: new Date(2026, 2, 1), eventType: 'km_10', status: 'missed' }),
      makeEvent({ id: 'a', date: new Date(2026, 0, 1), eventType: 'km_5', time: '00:25:00' }),
    ])

    expect(results.map((result) => result.event.id)).toEqual(['a', 'b'])
  })
})

describe('weightedAveragePaceSeconds', () => {
  it('weights by distance so a 5K does not count as much as a marathon', () => {
    const results = toAnalysableResults([
      makeEvent({
        id: '1',
        date: new Date(2026, 0, 1),
        eventType: 'km_5',
        realDistance: 5,
        time: '00:20:00', // 4:00/km
      }),
      makeEvent({
        id: '2',
        date: new Date(2026, 1, 1),
        eventType: 'km_42_2',
        realDistance: 45,
        time: '04:30:00', // 6:00/km
      }),
    ])

    // A média simples dos ritmos daria 5:00/km; ponderada são 290s = 4:50/km.
    expect(weightedAveragePaceSeconds(results)).toBe((1200 + 16200) / 50)
    expect(totalDistanceKm(results)).toBe(50)
  })

  it('returns null without results', () => {
    expect(weightedAveragePaceSeconds([])).toBeNull()
  })
})

describe('formatting', () => {
  it('formats paces, signed deltas and durations', () => {
    expect(formatPaceSeconds(305)).toBe('5:05')
    expect(formatPaceDelta(-6)).toBe('-0:06')
    expect(formatPaceDelta(66)).toBe('+1:06')
    expect(formatPaceDelta(0)).toBe('0:00')
    expect(formatDurationSeconds(3725)).toBe('1:02:05')
    expect(formatDurationSeconds(125)).toBe('2:05')
  })
})
