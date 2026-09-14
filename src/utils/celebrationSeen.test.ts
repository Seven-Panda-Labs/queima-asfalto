import { beforeEach, describe, expect, it } from 'vitest'
import type { RaceMilestone } from '../domain/raceMilestones'
import { markMilestonesSeen, unseenMilestones } from './celebrationSeen'
import { scopedStorageKey } from './userStorage'

const record: RaceMilestone = {
  kind: 'personal_record',
  id: 'record',
  weight: 100,
  eventType: 'km_10',
  improvementSeconds: 15,
  superseded: null,
}

const goal: RaceMilestone = {
  kind: 'race_count',
  id: 'race-count-10',
  weight: 40,
  ordinal: 10,
}

describe('milestones already celebrated', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('are all new the first time', () => {
    expect(unseenMilestones('u1', 'e1', [record, goal])).toHaveLength(2)
  })

  it('stop coming back once marked', () => {
    markMilestonesSeen('u1', 'e1', [record])
    expect(unseenMilestones('u1', 'e1', [record, goal])).toEqual([goal])
  })

  it('are kept per race and per runner', () => {
    markMilestonesSeen('u1', 'e1', [record])
    expect(unseenMilestones('u1', 'e2', [record])).toEqual([record])
    expect(unseenMilestones('u2', 'e1', [record])).toEqual([record])
  })

  it('survive a second mark on the same race', () => {
    markMilestonesSeen('u1', 'e1', [record])
    markMilestonesSeen('u1', 'e1', [goal])
    expect(unseenMilestones('u1', 'e1', [record, goal])).toEqual([])
  })

  it('read a corrupted entry as nothing seen', () => {
    localStorage.setItem(scopedStorageKey('u1', 'celebrated:e1'), 'not json')
    expect(unseenMilestones('u1', 'e1', [record])).toEqual([record])
  })
})
