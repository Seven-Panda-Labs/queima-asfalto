import { describe, expect, it } from 'vitest'
import { toAnalysableResults } from './results'
import { makeEvent } from './testFixtures'
import { buildPercentileSeries, parseFieldPlacing, summarisePercentiles } from './percentile'

describe('parseFieldPlacing', () => {
  it('reads position and field size, and derives the top percentage', () => {
    const placing = parseFieldPlacing('25/100')!

    expect(placing.position).toBe(25)
    expect(placing.total).toBe(100)
    expect(placing.fraction).toBe(0.25)
    expect(placing.topPercent).toBe(25)
  })

  it('takes the first line as the overall placing', () => {
    // Later lines are age group or gender; nothing says which is which.
    expect(parseFieldPlacing('12/340\n3/45')!.position).toBe(12)
    expect(parseFieldPlacing('1. 12/340\n2. 3/45')!.total).toBe(340)
  })

  it('accepts the written forms the app already parses', () => {
    expect(parseFieldPlacing('12 de 340')!.position).toBe(12)
    expect(parseFieldPlacing('12 of 340')!.total).toBe(340)
  })

  it('never rounds a winner down to zero percent', () => {
    expect(parseFieldPlacing('1/5000')!.topPercent).toBe(1)
  })

  it('rejects what it cannot trust', () => {
    expect(parseFieldPlacing(undefined)).toBeNull()
    expect(parseFieldPlacing('  ')).toBeNull()
    expect(parseFieldPlacing('primeiro')).toBeNull()
    expect(parseFieldPlacing('500/100')).toBeNull()
  })
})

describe('buildPercentileSeries', () => {
  const results = toAnalysableResults([
    makeEvent({ id: '1', date: new Date(2026, 0, 1), eventType: 'km_10', time: '00:50:00', classification: '50/100' }),
    makeEvent({ id: '2', date: new Date(2026, 1, 1), eventType: 'km_10', time: '00:55:00', classification: '10/100' }),
    makeEvent({ id: '3', date: new Date(2026, 2, 1), eventType: 'km_10', time: '00:48:00' }),
  ])

  it('skips races with no usable classification', () => {
    expect(buildPercentileSeries(results).map((point) => point.result.event.id)).toEqual(['1', '2'])
  })

  it('picks the best placing even when it was not the fastest race', () => {
    const summary = summarisePercentiles(buildPercentileSeries(results))!

    expect(summary.best.result.event.id).toBe('2')
    expect(summary.bestTopPercent).toBe(10)
    expect(summary.averageTopPercent).toBe(30)
    expect(summary.races).toBe(2)
  })

  it('returns no summary without placings', () => {
    expect(summarisePercentiles([])).toBeNull()
  })
})
