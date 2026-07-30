import { afterEach, describe, expect, it } from 'vitest'
import {
  assertAccountApprovalConfig,
  getAdminEmail,
  isAccountApprovalRequired,
} from './config.js'

const originalEnv = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnv }
})

describe('isAccountApprovalRequired', () => {
  it('is false by default', () => {
    delete process.env.ACCOUNT_APPROVAL_REQUIRED
    expect(isAccountApprovalRequired()).toBe(false)
  })

  it('is true when env is true', () => {
    process.env.ACCOUNT_APPROVAL_REQUIRED = 'true'
    expect(isAccountApprovalRequired()).toBe(true)
  })
})

describe('assertAccountApprovalConfig', () => {
  it('does nothing when approval is disabled', () => {
    delete process.env.ACCOUNT_APPROVAL_REQUIRED
    expect(() => assertAccountApprovalConfig()).not.toThrow()
  })

  it('throws when enabled without admin email and public url', () => {
    process.env.ACCOUNT_APPROVAL_REQUIRED = 'true'
    delete process.env.ADMIN_EMAIL
    delete process.env.APP_PUBLIC_URL
    expect(() => assertAccountApprovalConfig()).toThrow(/ADMIN_EMAIL/)
  })

  it('passes when enabled with required vars', () => {
    process.env.ACCOUNT_APPROVAL_REQUIRED = 'true'
    process.env.ADMIN_EMAIL = 'admin@example.com'
    process.env.APP_PUBLIC_URL = 'https://example.web.app'
    process.env.RESEND_API_KEY = 're_test'
    process.env.EMAIL_FROM = 'QA <noreply@example.com>'
    process.env.APPROVAL_TOKEN_SECRET = 'long-secret-for-tests'
    expect(() => assertAccountApprovalConfig()).not.toThrow()
    expect(getAdminEmail()).toBe('admin@example.com')
  })
})
