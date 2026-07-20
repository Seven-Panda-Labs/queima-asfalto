export const OFFICIAL_RESULTS_LOOKUP_RATE_LIMIT_ID = 'officialResults'

export function officialResultsLookupRateLimitPath(userId: string): string {
  return `users/${userId}/rateLimits/${OFFICIAL_RESULTS_LOOKUP_RATE_LIMIT_ID}`
}
