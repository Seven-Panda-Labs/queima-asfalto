import { describe, expect, it } from 'vitest'
import {
  canAccessAppData,
  parseRegistrationLocale,
  resolveEffectiveAccountStatus,
} from './types.js'

describe('resolveEffectiveAccountStatus', () => {
  it('treats missing field as approved', () => {
    expect(resolveEffectiveAccountStatus(undefined)).toBe('approved')
    expect(resolveEffectiveAccountStatus({ name: 'Test' })).toBe('approved')
  })

  it('returns known statuses', () => {
    expect(resolveEffectiveAccountStatus({ accountStatus: 'pending' })).toBe('pending')
    expect(resolveEffectiveAccountStatus({ accountStatus: 'rejected' })).toBe('rejected')
  })

  it('falls back to approved for invalid values', () => {
    expect(resolveEffectiveAccountStatus({ accountStatus: 'unknown' })).toBe('approved')
  })
})

describe('canAccessAppData', () => {
  it('only allows approved users', () => {
    expect(canAccessAppData('approved')).toBe(true)
    expect(canAccessAppData('pending')).toBe(false)
    expect(canAccessAppData('rejected')).toBe(false)
  })
})

describe('parseRegistrationLocale', () => {
  it('maps BCP-47 tags to app languages', () => {
    expect(parseRegistrationLocale('pt-PT')).toBe('pt')
    expect(parseRegistrationLocale('en-US')).toBe('en')
  })

  it('returns undefined for unsupported locales', () => {
    expect(parseRegistrationLocale('fr-FR')).toBeUndefined()
    expect(parseRegistrationLocale('')).toBeUndefined()
  })
})
