import { describe, expect, it } from 'vitest'
import { resolveInitialAccountStatus } from './userProfile.js'

describe('resolveInitialAccountStatus', () => {
  it('approves the configured admin email', () => {
    expect(resolveInitialAccountStatus('Admin@Example.com', 'admin@example.com')).toBe('approved')
  })

  it('marks other emails as pending', () => {
    expect(resolveInitialAccountStatus('user@example.com', 'admin@example.com')).toBe('pending')
  })

  it('marks missing email as pending', () => {
    expect(resolveInitialAccountStatus(undefined, 'admin@example.com')).toBe('pending')
  })
})
