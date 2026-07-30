import { describe, expect, it } from 'vitest'
import { createApprovalToken, verifyApprovalToken } from './approvalToken.js'

describe('approvalToken', () => {
  const secret = 'test-secret-min-16-chars'

  it('round-trips approve and reject tokens', () => {
    const now = 1_700_000_000_000
    const approve = createApprovalToken(secret, 'user-1', 'approve', now)
    const reject = createApprovalToken(secret, 'user-1', 'reject', now)

    expect(verifyApprovalToken(secret, approve, now + 1000)).toEqual({
      uid: 'user-1',
      action: 'approve',
    })
    expect(verifyApprovalToken(secret, reject, now + 1000)).toEqual({
      uid: 'user-1',
      action: 'reject',
    })
  })

  it('rejects tampered tokens', () => {
    const token = createApprovalToken(secret, 'user-1', 'approve')
    expect(() => verifyApprovalToken(secret, `${token}x`)).toThrow()
  })

  it('rejects expired tokens', () => {
    const now = 1_700_000_000_000
    const token = createApprovalToken(secret, 'user-1', 'approve', now)
    expect(() => verifyApprovalToken(secret, token, now + 8 * 24 * 60 * 60 * 1000)).toThrow(
      /expired/i,
    )
  })
})
