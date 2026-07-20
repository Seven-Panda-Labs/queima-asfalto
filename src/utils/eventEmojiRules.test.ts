import { describe, expect, it } from 'vitest'
import { pickRandomEventEmoji, suggestEventEmoji } from './eventEmojiRules'

describe('suggestEventEmoji', () => {
  it('picks tree for Parkrun name variations', () => {
    expect(
      suggestEventEmoji({ name: 'ParkRun Hasenheide', date: new Date(2026, 0, 15) }),
    ).toBe('🌳')
    expect(suggestEventEmoji({ name: 'Park Run Berlin', date: new Date(2026, 2, 1) })).toBe('🌳')
  })

  it('picks medal for marathon keywords', () => {
    expect(suggestEventEmoji({ name: 'Meia Maratona de Lisboa', date: new Date(2026, 3, 1) })).toBe(
      '🏅',
    )
    expect(suggestEventEmoji({ name: 'Berlin Marathon', date: new Date(2026, 8, 27) })).toBe('🏅')
  })

  it('picks landscape for trail or nature locations', () => {
    expect(
      suggestEventEmoji({
        name: 'Trail Run',
        date: new Date(2026, 4, 10),
        location: 'Sintra',
      }),
    ).toBe('🏞️')
    expect(
      suggestEventEmoji({
        name: 'Plänterwaldlauf',
        date: new Date(2026, 1, 1),
        location: 'Berlin',
      }),
    ).toBe('🏞️')
  })

  it('picks sun for summer dates when no name rule matches', () => {
    expect(suggestEventEmoji({ name: 'Corrida Local', date: new Date(2026, 6, 15) })).toBe('☀️')
  })

  it('picks snowflake for winter dates when no name rule matches', () => {
    expect(suggestEventEmoji({ name: 'Corrida Local', date: new Date(2026, 0, 20) })).toBe('❄️')
  })

  it('falls back to a stable random emoji', () => {
    const first = suggestEventEmoji({ name: 'Corrida Genérica', date: new Date(2026, 3, 12) })
    const second = suggestEventEmoji({ name: 'Corrida Genérica', date: new Date(2026, 3, 12) })
    expect(first).toBe(second)
    expect(first).not.toBe('☀️')
    expect(first).not.toBe('❄️')
  })

  it('prioritises Parkrun over summer season', () => {
    expect(suggestEventEmoji({ name: 'Parkrun Verão', date: new Date(2026, 7, 1) })).toBe('🌳')
  })
})

describe('pickRandomEventEmoji', () => {
  it('returns an emoji from the options list', () => {
    expect(pickRandomEventEmoji('seed-a').length).toBeGreaterThan(0)
  })
})
