import { describe, expect, it } from 'vitest'
import { toAnalysableResults } from './results'
import { makeEvent } from './testFixtures'
import {
  buildEquivalentSeries,
  equivalentTimeSeconds,
  pickReferenceEventType,
  predictRaceTimes,
  RIEGEL_EXPONENT,
} from './equivalence'

describe('equivalentTimeSeconds', () => {
  it('applies Riegel and grows faster than distance', () => {
    const tenK = 50 * 60
    const half = equivalentTimeSeconds(tenK, 10, 21.0975)!

    expect(half).toBeCloseTo(tenK * Math.pow(21.0975 / 10, RIEGEL_EXPONENT), 6)
    // A flat pace would give 105.5 min; Riegel asks more of the longer race.
    expect(half).toBeGreaterThan(tenK * 2.10975)
  })

  it('is identity at the same distance and rejects nonsense', () => {
    expect(equivalentTimeSeconds(1800, 5, 5)).toBeCloseTo(1800, 6)
    expect(equivalentTimeSeconds(0, 5, 10)).toBeNull()
    expect(equivalentTimeSeconds(1800, 0, 10)).toBeNull()
  })
})

describe('pickReferenceEventType', () => {
  it('picks the most raced discipline', () => {
    const results = toAnalysableResults([
      makeEvent({ id: '1', date: new Date(2026, 0, 1), eventType: 'km_5', realDistance: 5, time: '00:25:00' }),
      makeEvent({ id: '2', date: new Date(2026, 1, 1), eventType: 'km_10', time: '00:50:00' }),
      makeEvent({ id: '3', date: new Date(2026, 2, 1), eventType: 'km_10', time: '00:51:00' }),
    ])

    expect(pickReferenceEventType(results)).toBe('km_10')
  })

  it('breaks ties towards the longer distance', () => {
    const results = toAnalysableResults([
      makeEvent({ id: '1', date: new Date(2026, 0, 1), eventType: 'km_10', time: '00:50:00' }),
      makeEvent({ id: '2', date: new Date(2026, 1, 1), eventType: 'km_42_2', realDistance: 42.2, time: '04:00:00' }),
    ])

    expect(pickReferenceEventType(results)).toBe('km_42_2')
  })

  it('returns null without results', () => {
    expect(pickReferenceEventType([])).toBeNull()
  })
})

describe('buildEquivalentSeries', () => {
  const results = toAnalysableResults([
    makeEvent({ id: 'best', date: new Date(2026, 0, 1), eventType: 'km_10', time: '00:50:00' }),
    makeEvent({ id: 'slow', date: new Date(2026, 1, 1), eventType: 'km_5', realDistance: 5, time: '00:30:00' }),
  ])

  it('scores the best result at 100 and the rest below it', () => {
    const series = buildEquivalentSeries(results, 10)

    expect(series).toHaveLength(2)
    expect(series[0]!.index).toBeCloseTo(100, 6)
    expect(series[1]!.index).toBeLessThan(100)
  })

  it('gives the same index whatever the reference distance', () => {
    // The reference factor cancels in the ratio between two equivalent times,
    // so changing it moves the unit, not the curve.
    const atTen = buildEquivalentSeries(results, 10).map((point) => point.index)
    const atMarathon = buildEquivalentSeries(results, 42.195).map((point) => point.index)

    atTen.forEach((index, position) => expect(atMarathon[position]).toBeCloseTo(index, 9))
  })

  it('returns nothing without results', () => {
    expect(buildEquivalentSeries([], 10)).toEqual([])
  })
})

describe('predictRaceTimes', () => {
  const today = new Date(2026, 8, 1)

  it('predicts every discipline from the strongest recent result, not the latest', () => {
    const results = toAnalysableResults([
      makeEvent({ id: 'strong', date: new Date(2026, 0, 1), eventType: 'km_10', time: '00:40:00' }),
      makeEvent({ id: 'latest', date: new Date(2026, 6, 1), eventType: 'km_10', time: '01:00:00' }),
    ])

    const forecast = predictRaceTimes(results, 10, today)!
    const tenK = forecast.predictions.find((prediction) => prediction.eventType === 'km_10')!

    expect(forecast.basedOn.event.id).toBe('strong')
    expect(forecast.fromRecentForm).toBe(true)
    expect(tenK.predictedSeconds).toBeCloseTo(2400, 6)
    expect(forecast.predictions.map((prediction) => prediction.eventType)).toEqual([
      'km_5',
      'km_10',
      'km_21_1',
      'km_42_2',
    ])
  })

  it('ignores an old personal best that no longer describes current form', () => {
    // The case the window exists for: a 2022 mark predicting 2026.
    const results = toAnalysableResults([
      makeEvent({ id: 'ancient', date: new Date(2022, 5, 29), eventType: 'km_10', time: '00:40:00' }),
      makeEvent({ id: 'recent', date: new Date(2026, 5, 1), eventType: 'km_10', time: '00:50:00' }),
    ])

    const forecast = predictRaceTimes(results, 10, today)!

    expect(forecast.basedOn.event.id).toBe('recent')
    expect(forecast.fromRecentForm).toBe(true)
  })

  it('falls back to the latest races, and says so, when the window is empty', () => {
    const results = toAnalysableResults([
      makeEvent({ id: 'old', date: new Date(2022, 0, 1), eventType: 'km_10', time: '00:50:00' }),
      makeEvent({ id: 'less-old', date: new Date(2023, 0, 1), eventType: 'km_10', time: '00:45:00' }),
    ])

    const forecast = predictRaceTimes(results, 10, today)!

    expect(forecast.fromRecentForm).toBe(false)
    expect(forecast.basedOn.event.id).toBe('less-old')
  })

  it('has nothing to forecast without results', () => {
    expect(predictRaceTimes([], 10, today)).toBeNull()
  })
})
