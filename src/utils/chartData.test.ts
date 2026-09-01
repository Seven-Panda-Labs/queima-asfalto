import { describe, expect, it } from 'vitest'
import type { Event } from '../types/Event'
import {
  buildPaceChartData,
  buildPaceChartSeries,
  PACE_CHART_COLORS,
  PACE_CHART_POINT_STYLES,
} from './chartData'
import { EVENT_TYPES } from '../domain/eventCodes'

function makeEvent(overrides: Partial<Event> & Pick<Event, 'eventType' | 'date' | 'status'>): Event {
  const now = new Date()
  return {
    id: 'event-1',
    userId: 'user-1',
    name: 'Test Event',
    realDistance: 5,
    location: 'Berlin',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe('buildPaceChartData', () => {
  const events: Event[] = [
    makeEvent({
      id: '1',
      eventType: 'km_5',
      status: 'completed',
      date: new Date(2026, 5, 1),
      pace: '5:30',
      time: '00:27:30',
    }),
    makeEvent({
      id: '2',
      eventType: 'km_5',
      status: 'completed',
      date: new Date(2026, 2, 1),
      pace: '5:00',
      time: '00:25:00',
    }),
    makeEvent({
      id: '3',
      eventType: 'km_10',
      status: 'completed',
      date: new Date(2026, 3, 1),
      pace: '6:00',
      time: '01:00:00',
    }),
    makeEvent({
      id: '4',
      eventType: 'km_5',
      status: 'completed',
      date: new Date(2026, 4, 1),
      pace: undefined,
    }),
    makeEvent({
      id: '5',
      eventType: 'km_5',
      status: 'confirmed',
      date: new Date(2026, 7, 1),
      pace: '4:50',
    }),
  ]

  it('filters by eventType', () => {
    const points = buildPaceChartData(events, 'km_5')
    expect(points).toHaveLength(2)
    expect(points.every((point) => point.event.eventType === 'km_5')).toBe(true)
  })

  it('sorts by date ascending for chart', () => {
    const points = buildPaceChartData(events, 'km_5')
    expect(points[0].date.getMonth()).toBe(2)
    expect(points[1].date.getMonth()).toBe(5)
  })

  it('ignores events without pace', () => {
    const points = buildPaceChartData(events, 'km_5')
    expect(points.some((point) => point.event.id === '4')).toBe(false)
  })
})

describe('buildPaceChartSeries', () => {
  const events: Event[] = [
    makeEvent({
      id: '1',
      eventType: 'km_5',
      status: 'completed',
      date: new Date(2026, 2, 1),
      pace: '5:00',
      time: '00:25:00',
    }),
    makeEvent({
      id: '2',
      eventType: 'km_10',
      status: 'completed',
      date: new Date(2026, 3, 1),
      pace: '6:00',
      time: '01:00:00',
    }),
  ]

  it('returns one series for a specific discipline', () => {
    const series = buildPaceChartSeries(events, 'km_5')
    expect(series).toHaveLength(1)
    expect(series[0]?.eventType).toBe('km_5')
    expect(series[0]?.points).toHaveLength(1)
  })

  it('returns one series per discipline with data when all', () => {
    const series = buildPaceChartSeries(events, 'all')
    expect(series).toHaveLength(2)
    expect(series.map((item) => item.eventType)).toEqual(['km_5', 'km_10'])
  })
})

describe('the chart palette', () => {
  it('covers every discipline, colour and shape', () => {
    for (const eventType of EVENT_TYPES) {
      expect(PACE_CHART_COLORS[eventType]).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(PACE_CHART_POINT_STYLES[eventType]).toBeTruthy()
    }
  })

  it('keeps the colours the app shipped with', () => {
    expect(PACE_CHART_COLORS.km_5).toBe('#2563EB')
    expect(PACE_CHART_COLORS.km_10).toBe('#10B981')
    expect(PACE_CHART_COLORS.km_21_1).toBe('#F97316')
    expect(PACE_CHART_COLORS.km_42_2).toBe('#8B5CF6')
  })
})
