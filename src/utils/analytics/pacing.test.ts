import { describe, expect, it } from 'vitest'
import type { Event } from '../../types/Event'
import { toAnalysableResults } from './results'
import { buildPacingSummary } from './pacing'

function race(date: string, drift?: number, eventType = 'km_5'): Event {
  return {
    id: date,
    name: `Race ${date}`,
    date: new Date(date),
    realDistance: 5,
    time: '00:25:00',
    status: 'completed',
    eventType,
    ...(drift === undefined ? {} : { trackPacingDriftSeconds: drift }),
  } as Event
}

function summaryOf(events: Event[], season = 2026) {
  return buildPacingSummary(toAnalysableResults(events), season)
}

describe('buildPacingSummary', () => {
  it('keeps only races that carry a drift', () => {
    const summary = summaryOf([race('2026-01-01', 12), race('2026-02-01'), race('2026-03-01', -8)])
    expect(summary.points).toHaveLength(2)
  })

  it('stays inside the season it was asked for', () => {
    // The block sits under a heading naming one season, so it shows that season.
    const summary = summaryOf([race('2025-06-01', 30), race('2026-01-01', 12)])
    expect(summary.points).toHaveLength(1)
    expect(summary.points[0].date.getFullYear()).toBe(2026)
  })

  it('orders oldest first so the chart reads left to right', () => {
    const summary = summaryOf([race('2026-03-01', 1), race('2026-01-01', 2)])
    expect(summary.points.map((point) => point.result.event.id)).toEqual([
      '2026-01-01',
      '2026-03-01',
    ])
  })

  it('counts fading, even and negative splits around the band', () => {
    const summary = summaryOf([
      race('2026-01-01', 20),
      race('2026-01-02', 6),
      race('2026-01-03', 5),
      race('2026-01-04', -5),
      race('2026-01-05', -20),
    ])

    expect(summary.faded).toBe(2)
    expect(summary.even).toBe(2)
    expect(summary.negative).toBe(1)
  })

  it('reports the median, which one wild race cannot drag', () => {
    const summary = summaryOf([
      race('2026-01-01', 10),
      race('2026-01-02', 12),
      race('2026-01-03', 300),
    ])
    expect(summary.medianDriftSeconds).toBe(12)
  })

  it('leaves out a race that is not an analysable result', () => {
    const planned = { ...race('2026-04-01', 15), status: 'planned' } as Event
    expect(summaryOf([race('2026-01-01', 12), planned]).points).toHaveLength(1)
  })

  it('has nothing to say without any track', () => {
    const summary = summaryOf([race('2026-01-01'), race('2026-02-01')])
    expect(summary).toEqual({ points: [], faded: 0, even: 0, negative: 0, medianDriftSeconds: 0 })
  })
})
