import { describe, expect, it } from 'vitest'
import i18n from './index'
import type { RaceMilestone } from '../domain/raceMilestones'
import { celebrationVoiceSection, pickCelebrationVoice, voiceSeed } from './voiceCelebration'

const record: RaceMilestone = {
  kind: 'personal_record',
  id: 'record',
  weight: 100,
  eventType: 'km_10',
  improvementSeconds: 21,
  superseded: null,
}

const beaten: RaceMilestone = {
  ...record,
  superseded: { eventId: 'e2', eventName: 'Volkslauf', date: new Date(2026, 10, 1) },
}

const count: RaceMilestone = { kind: 'race_count', id: 'race-count-10', weight: 40, ordinal: 10 }

describe('which voice a race gets', () => {
  it('is the record voice when a record still stands', () => {
    expect(celebrationVoiceSection([record, count])).toBe('record')
  })

  it('is the goal voice when a goal closed and no record stands', () => {
    const annual: RaceMilestone = {
      kind: 'annual_goal',
      id: 'goal-g1',
      weight: 90,
      goal: {
        id: 'g1',
        userId: 'u1',
        eventType: 'km_10',
        targetCount: 3,
        year: 2026,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }
    expect(celebrationVoiceSection([beaten, annual])).toBe('goal')
  })

  it('is the past voice when every mark has fallen', () => {
    expect(celebrationVoiceSection([beaten])).toBe('past')
  })

  it('is the generic voice for the rest', () => {
    expect(celebrationVoiceSection([count])).toBe('generic')
  })
})

describe('the line a race says', () => {
  it('is the same every time the race is opened', () => {
    const t = i18n.t.bind(i18n)
    const first = pickCelebrationVoice(t, 'record', voiceSeed('event-1'))
    const second = pickCelebrationVoice(t, 'record', voiceSeed('event-1'))
    expect(first).toEqual(second)
    expect(first.primary.length).toBeGreaterThan(0)
    expect(first.secondary.length).toBeGreaterThan(0)
  })
})
