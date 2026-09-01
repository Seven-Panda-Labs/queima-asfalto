import { afterEach, describe, expect, it } from 'vitest'
import { assertAccountApprovalConfig, isAccountApprovalRequired } from './config.js'

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

  it('throws when enabled without the public url', () => {
    process.env.ACCOUNT_APPROVAL_REQUIRED = 'true'
    delete process.env.APP_PUBLIC_URL
    expect(() => assertAccountApprovalConfig()).toThrow(/APP_PUBLIC_URL/)
  })

  it('no longer asks for an admin email: the admin is a user, not a variable', () => {
    process.env.ACCOUNT_APPROVAL_REQUIRED = 'true'
    delete process.env.ADMIN_EMAIL
    process.env.APP_PUBLIC_URL = 'https://example.web.app'
    process.env.RESEND_API_KEY = 're_test'
    process.env.EMAIL_FROM = 'QA <noreply@example.com>'
    process.env.APPROVAL_TOKEN_SECRET = 'long-secret-for-tests'
    expect(() => assertAccountApprovalConfig()).not.toThrow()
  })

  it('passes when enabled with required vars', () => {
    process.env.ACCOUNT_APPROVAL_REQUIRED = 'true'
    process.env.APP_PUBLIC_URL = 'https://example.web.app'
    process.env.RESEND_API_KEY = 're_test'
    process.env.EMAIL_FROM = 'QA <noreply@example.com>'
    process.env.APPROVAL_TOKEN_SECRET = 'long-secret-for-tests'
    expect(() => assertAccountApprovalConfig()).not.toThrow()
  })
})
