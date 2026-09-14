import { describe, expect, it } from 'vitest'
import i18n from '../i18n'
import type { RaceMilestone } from '../domain/raceMilestones'
import { toMilestoneCard } from './milestoneCards'
import { makeEvent } from './analytics/testFixtures'

const event = makeEvent({
  id: 'e1',
  date: new Date(2026, 8, 12),
  eventType: 'km_10',
  name: 'Tierparklauf',
  time: '00:53:22',
  pace: '5:20',
})

const t = i18n.t.bind(i18n)

function record(overrides: Partial<Extract<RaceMilestone, { kind: 'personal_record' }>> = {}) {
  return {
    kind: 'personal_record',
    id: 'record',
    weight: 100,
    eventType: 'km_10',
    improvementSeconds: 21,
    superseded: null,
    ...overrides,
  } as RaceMilestone
}

describe('a personal record card', () => {
  it('prints the race time and what it took off', () => {
    const card = toMilestoneCard(record(), event, t)
    expect(card.value).toBe('00:53:22')
    expect(card.detail).toContain('21')
  })

  it('says it in words when the gain rounds to nothing', () => {
    const card = toMilestoneCard(record({ improvementSeconds: 0.4 }), event, t)
    expect(card.detail).toBe(i18n.t('celebration.personalRecord.improvementTiny'))
  })

  it('calls the first one the first, not an improvement', () => {
    const card = toMilestoneCard(record({ improvementSeconds: null }), event, t)
    expect(card.detail).toBe(i18n.t('celebration.personalRecord.first'))
  })

  it('names the race that took it away', () => {
    const card = toMilestoneCard(
      record({
        superseded: { eventId: 'e2', eventName: 'Volkslauf', date: new Date(2026, 10, 1) },
      }),
      event,
      t,
    )
    expect(card.superseded?.eventId).toBe('e2')
    expect(card.superseded?.label).toContain('Volkslauf')
  })
})

describe('the other cards', () => {
  it('put the goal itself where the number goes', () => {
    const milestone: RaceMilestone = {
      kind: 'annual_goal',
      id: 'goal-g1',
      weight: 90,
      goal: {
        id: 'g1',
        userId: 'u1',
        eventType: 'km_10',
        targetCount: 3,
        year: 2026,
        createdAt: new Date(2026, 0, 1),
        updatedAt: new Date(2026, 0, 1),
      },
    }
    expect(toMilestoneCard(milestone, event, t).value).toBe('3x 10Km')
  })

  it('count races with a plain number', () => {
    const milestone: RaceMilestone = { kind: 'race_count', id: 'race-count-10', weight: 40, ordinal: 10 }
    expect(toMilestoneCard(milestone, event, t).value).toBe('10')
  })

  it('give season kilometres their unit', () => {
    const milestone: RaceMilestone = {
      kind: 'season_distance',
      id: 'season-distance-100',
      weight: 35,
      year: 2026,
      markKm: 100,
      totalKm: 104,
    }
    expect(toMilestoneCard(milestone, event, t).value).toBe('100 Km')
  })
})
