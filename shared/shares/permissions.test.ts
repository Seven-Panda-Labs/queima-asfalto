import { describe, expect, it } from 'vitest'
import {
  hasAnyPermission,
  hasBucketListAccess,
  hasSharedResultsAccess,
  normalizeEmail,
  parseSharePermissions,
} from './permissions.js'

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Mo@Example.COM ')).toBe('mo@example.com')
  })
})

describe('hasBucketListAccess', () => {
  it('allows read and write', () => {
    expect(hasBucketListAccess('read')).toBe(true)
    expect(hasBucketListAccess('write')).toBe(true)
    expect(hasBucketListAccess('none')).toBe(false)
  })
})

describe('hasSharedResultsAccess', () => {
  it('allows read and write events permission', () => {
    expect(hasSharedResultsAccess('read')).toBe(true)
    expect(hasSharedResultsAccess('write')).toBe(true)
    expect(hasSharedResultsAccess('read_no_results')).toBe(false)
    expect(hasSharedResultsAccess('none')).toBe(false)
  })
})

describe('parseSharePermissions', () => {
  it('defaults invalid values to none', () => {
    expect(parseSharePermissions(null)).toEqual({
      bucketList: 'none',
      events: 'none',
      goals: 'none',
      performanceGoals: 'none',
      media: 'none',
    })
  })

  it('parses valid permissions', () => {
    expect(
      parseSharePermissions({
        bucketList: 'write',
        events: 'read_no_results',
        goals: 'read',
        performanceGoals: 'none',
        media: 'read',
      }),
    ).toEqual({
      bucketList: 'write',
      events: 'read_no_results',
      goals: 'read',
      performanceGoals: 'none',
      media: 'read',
    })
  })
})

describe('hasAnyPermission', () => {
  it('detects when at least one section is shared', () => {
    expect(
      hasAnyPermission({
        bucketList: 'none',
        events: 'read_no_results',
        goals: 'none',
        performanceGoals: 'none',
        media: 'none',
      }),
    ).toBe(true)
  })
})
