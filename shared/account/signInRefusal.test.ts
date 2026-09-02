import { describe, expect, it } from 'vitest'
import { describeSignInRefusal, SIGN_IN_REFUSALS } from './signInRefusal'

/** What Firebase actually hands the browser when a blocking function throws. */
function wrapped(token: string): Error {
  return new Error(
    `Firebase: HTTP Cloud Function returned an error: {"error":{"details":"${token}",` +
      `"message":"BLOCKING_FUNCTION_ERROR_RESPONSE: ${token}","status":"PERMISSION_DENIED"}} (auth/internal-error).`,
  )
}

describe('describeSignInRefusal', () => {
  it('recognises an account still waiting for approval', () => {
    expect(describeSignInRefusal(wrapped(SIGN_IN_REFUSALS.pending))).toBe('pending')
  })

  it('recognises a rejected account', () => {
    expect(describeSignInRefusal(wrapped(SIGN_IN_REFUSALS.rejected))).toBe('rejected')
  })

  it('says nothing specific about anything else', () => {
    expect(describeSignInRefusal(new Error('auth/popup-closed-by-user'))).toBe('generic')
    expect(describeSignInRefusal(undefined)).toBe('generic')
    expect(describeSignInRefusal('network request failed')).toBe('generic')
  })
})
