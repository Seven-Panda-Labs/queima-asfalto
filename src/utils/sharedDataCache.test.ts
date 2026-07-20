import { describe, expect, it, beforeEach } from 'vitest'
import {
  clearSharedDataCache,
  getSharedEventsCache,
  setSharedEventsCache,
} from './sharedDataCache'
import type { SharePermissions } from '../types/Share'

const permissions: SharePermissions = {
  bucketList: 'none',
  events: 'read',
  goals: 'none',
  performanceGoals: 'none',
  media: 'none',
}

describe('sharedDataCache', () => {
  beforeEach(() => {
    clearSharedDataCache()
  })

  it('stores and retrieves events cache by owner', () => {
    setSharedEventsCache('owner-1', {
      events: [],
      ownerDisplayName: 'Zé Ninguém',
      permissions,
    })

    expect(getSharedEventsCache('owner-1')?.ownerDisplayName).toBe('Zé Ninguém')
    expect(getSharedEventsCache('owner-2')).toBeUndefined()
  })
})
