import { describe, expect, it } from 'vitest'
import { getEventsViewMode, setEventsViewMode } from './eventsViewMode'

describe('eventsViewMode', () => {
  it('defaults to lista', () => {
    expect(getEventsViewMode('test-user-map')).toBe('lista')
  })

  it('persists mapa mode per user', () => {
    const userId = `test-user-map-${Date.now()}`
    setEventsViewMode('mapa', userId)
    expect(getEventsViewMode(userId)).toBe('mapa')
    setEventsViewMode('lista', userId)
  })
})
