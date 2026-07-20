import { describe, expect, it } from 'vitest'
import { isPrivacyPolicyEnabled, privacyPolicyPath, PRIVACY_POLICY_PATH } from './privacyPolicy'

describe('privacyPolicy config', () => {
  it('is disabled by default', () => {
    expect(isPrivacyPolicyEnabled()).toBe(false)
  })

  it('uses in-app route', () => {
    expect(privacyPolicyPath()).toBe(PRIVACY_POLICY_PATH)
    expect(PRIVACY_POLICY_PATH).toBe('/privacidade')
  })
})
