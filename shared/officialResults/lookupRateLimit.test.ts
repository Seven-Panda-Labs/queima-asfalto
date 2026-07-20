import { describe, expect, it } from 'vitest'
import {
  OFFICIAL_RESULTS_LOOKUP_RATE_LIMIT_ID,
  officialResultsLookupRateLimitPath,
} from './lookupRateLimit'

describe('officialResultsLookupRateLimitPath', () => {
  it('points to a fixed rate limit document under the user', () => {
    expect(officialResultsLookupRateLimitPath('user-alice')).toBe(
      `users/user-alice/rateLimits/${OFFICIAL_RESULTS_LOOKUP_RATE_LIMIT_ID}`,
    )
  })
})
