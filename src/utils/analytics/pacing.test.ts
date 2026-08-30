import { describe, expect, it } from 'vitest'
import type { Event } from '../../types/Event'
import { buildPacingSummary } from './pacing'

function race(date: string, drift?: number): Event {
  return {
    id: date,
    date: new Date(date),
    ...(drift === undefined ? {} : { trackPacingDriftSeconds: drift }),
  } as Event
}

describe('buildPacingSummary', () => {
  it('keeps only races that carry a drift', () => {
    const summary = buildPacingSummary([race('2026-01-01', 12), race('2026-02-01'), race('2026-03-01', -8)])
    expect(summary.points).toHaveLength(2)
  })

  it('orders oldest first so the chart reads left to right', () => {
    const summary = buildPacingSummary([race('2026-03-01', 1), race('2026-01-01', 2)])
    expect(summary.points.map((point) => point.event.id)).toEqual(['2026-01-01', '2026-03-01'])
  })

  it('counts fading, even and negative splits around the band', () => {
    const summary = buildPacingSummary([
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
    const summary = buildPacingSummary([
      race('2026-01-01', 10),
      race('2026-01-02', 12),
      race('2026-01-03', 300),
    ])
    expect(summary.medianDriftSeconds).toBe(12)
  })

  it('has nothing to say without any track', () => {
    const summary = buildPacingSummary([race('2026-01-01'), race('2026-02-01')])
    expect(summary).toEqual({ points: [], faded: 0, even: 0, negative: 0, medianDriftSeconds: 0 })
  })
})
